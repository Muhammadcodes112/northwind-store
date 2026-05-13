import type { Request, Response } from "express";
import crypto from "node:crypto";
import { getEnv } from "../lib/env";
import { db } from "../db";
import { checkoutSessions, orders, orderItems } from "../db/schema";
import { eq } from "drizzle-orm";

const env = getEnv();

export async function paystackWebhookHandler(req: Request, res: Response) {
  try {
    const secret = env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      res.status(400).json({ error: "Paystack secret not configured" });
      return;
    }

    // Verify signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "charge.success") {
      const data = event.data;
      const metadata = data.metadata;
      
      if (!metadata || !metadata.checkout_session_id) {
        res.status(200).send("Ignored: no checkout_session_id in metadata");
        return;
      }

      const sessionId = metadata.checkout_session_id;

      // Find the checkout session
      const [session] = await db
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.id, sessionId));

      if (!session) {
        console.error("Paystack webhook: checkout session not found", sessionId);
        res.status(200).send("Session not found");
        return;
      }

      // Check if order already exists
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.paystackReference, data.reference));

      if (existingOrder) {
        res.status(200).send("Order already processed");
        return;
      }

      // Create order
      await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            userId: session.userId,
            status: "completed",
            paystackReference: data.reference,
            deliveryLocation: metadata.delivery_location ?? null,
            totalCents: session.totalCents,
          })
          .returning();

        for (const line of session.lines) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: line.productId,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
          });
        }
      });
      
      const [order] = await db.select().from(orders).where(eq(orders.paystackReference, data.reference));
      if (order) {
        const { reduceStockForOrder } = await import("../lib/inventory.js");
        await reduceStockForOrder(order.id);

        const { createNotification } = await import("../controllers/notificationController.js");
        
        // 1. Payment Notification
        await createNotification(order.userId, {
          title: "Payment Confirmed ✅",
          message: `We've received your payment for order #${order.id.slice(0, 8)}.`,
          type: "payment",
          link: `/orders/${order.id}`,
        });

        // 2. Order Completed Notification
        await createNotification(order.userId, {
          title: "Order Completed 🎉",
          message: `Your order #${order.id.slice(0, 8)} is now marked as completed. Thank you for your purchase!`,
          type: "order_update",
          link: `/orders/${order.id}`,
        });

        // @ts-ignore
        const { notifyOrderCompleted } = await import("../lib/orderNotifications");
        await notifyOrderCompleted(order.id).catch(console.error);
      }
      
      console.log(`Order created for Paystack ref ${data.reference}`);

    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Paystack webhook error:", error);
    res.status(500).send("Webhook error");
  }
}
