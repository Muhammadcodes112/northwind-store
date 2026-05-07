import type { Request, Response, NextFunction } from "express";
import { getEnv } from "../lib/env";
import z from "zod";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../lib/users";
import { db } from "../db";
import { CheckoutSessionLine, checkoutSessions, products } from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { paystackInitializeCheckout } from "../lib/paystack";
import { notifyOrderCreated } from "../lib/orderNotifications";

const env = getEnv();

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  method: z.enum(["paystack", "pod"]).default("paystack"),
  deliveryLocation: z.string().trim().min(3),
});

export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    // only signed-in users can start checkout
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = cartSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid cart", details: parsed.error.flatten() });
      return;
    }

    // paystack configuration check only if method is paystack
    if (parsed.data.method === "paystack" && !env.PAYSTACK_SECRET_KEY) {
      res.status(503).json({ error: "Payments are not configured (Paystack secret key missing)" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const ids = parsed.data.items.map((i) => i.productId);

    // load every cart product that exists, is active, and matches the IDs we asked for.
    const prodRows = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.active, true)));

    if (prodRows.length !== ids.length) {
      res.status(400).json({ error: "One or more products are invalid" });
      return;
    }

    const byId = new Map(prodRows.map((p) => [p.id, p]));
    let totalCents = 0;
    const lines: CheckoutSessionLine[] = [];

    for (const line of parsed.data.items) {
      const p = byId.get(line.productId)!;
      totalCents += p.priceCents * line.quantity;
      lines.push({
        productId: p.id,
        quantity: line.quantity,
        unitPriceCents: p.priceCents,
      });
    }

    if (totalCents < 10) {
      res.status(400).json({
        error: "Total below minimum",
      });
      return;
    }

    const [session] = await db
      .insert(checkoutSessions)
      .values({
        userId: localUser.id,
        lines,
        totalCents,
        currency: "ngn",
      })
      .returning();

    const successUrl = `${env.FRONTEND_URL}/checkout/return?checkout_id={CHECKOUT_ID}`;

    if (parsed.data.method === "pod") {
      // Pay on delivery: create the order immediately as pending
      const { orders, orderItems } = await import("../db/schema.js");
      let newOrderId = "";
      await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            userId: localUser.id,
            status: "pending",
            totalCents: totalCents,
            deliveryLocation: parsed.data.deliveryLocation,
            // no paystack reference for POD
          })
          .returning();
        
        newOrderId = order.id;

        for (const line of lines) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: line.productId,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
          });
        }
      });

      notifyOrderCreated(newOrderId).catch(console.error);

      res.json({ checkoutUrl: successUrl.replace("{CHECKOUT_ID}", session.id) });
      return;
    }

    const checkout = await paystackInitializeCheckout(env, {
      email: localUser.email || "customer@example.com",
      amount: totalCents, // Paystack amounts are in kobo, cents are equivalent (1/100 of base currency)
      metadata: {
        checkout_session_id: session.id,
        delivery_location: parsed.data.deliveryLocation,
      },
      callback_url: successUrl.replace("{CHECKOUT_ID}", session.id),
    });

    await db
      .update(checkoutSessions)
      .set({ paystackReference: checkout.reference })
      .where(eq(checkoutSessions.id, session.id));

    res.json({ checkoutUrl: checkout.authorization_url });
  } catch (e) {
    next(e);
  }
}
