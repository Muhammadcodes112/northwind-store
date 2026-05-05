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
            status: "paid",
            paystackReference: data.reference,
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
      
      console.log(`Order created for Paystack ref ${data.reference}`);

      // Email Admins
      try {
        const { users } = await import("../db/schema.js");
        const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
        const adminEmails = adminUsers.map((u) => u.email).filter(Boolean);

        if (adminEmails.length > 0) {
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            // @ts-ignore
            const { Resend } = await import("resend");
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: "Emporium Corner Orders <onboarding@resend.dev>", // default testing email for Resend
              to: adminEmails,
              subject: "New Order Received - Emporium Corner",
              html: `<h2>New Order Paid</h2>
                <p>A new order has been placed and confirmed paid via Paystack.</p>
                <p><strong>Paystack Ref:</strong> ${data.reference}</p>
                <p><strong>Amount:</strong> NGN ${(session.totalCents / 100).toFixed(2)}</p>
                <p>Please check the admin dashboard to fulfill this order.</p>
              `,
            });
            console.log("Emailed admins successfully:", adminEmails);
          } else {
            console.log("RESEND_API_KEY not set. Would have emailed admins:", adminEmails);
          }
        }
      } catch (e) {
        console.error("Error emailing admins:", e);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Paystack webhook error:", error);
    res.status(500).send("Webhook error");
  }
}
