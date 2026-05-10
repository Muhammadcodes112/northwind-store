import type { Request, Response } from "express";
import { getEnv } from "../lib/env";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { parseRole } from "../lib/roles";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

async function sendWelcomeEmail(email: string | undefined, displayName: string | null) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || !email) return;

  // @ts-ignore
  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: "The Emporium Corner <onboarding@resend.dev>",
    to: [email],
    subject: "Welcome to The Emporium Corner",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <h2 style="color: #c0994f;">Welcome to The Emporium Corner</h2>
        <p>Hello ${displayName || "there"},</p>
        <p>Thank you for registering with The Emporium Corner. You are now part of the family.</p>
        <p>We are happy to have you here and cannot wait to help you discover products you love.</p>
        <p style="margin-top: 24px;">Warmly,<br/>The Emporium Corner Team</p>
      </div>
    `,
  }).catch(console.error);
}

export async function clerkWebhookHandler(req: Request, res: Response) {
  const env = getEnv();

  try {
    // webhook verification needs a shared secret; without it we cannot trust incoming POSTs.
    if (!env.CLERK_WEBHOOK_SECRET) {
      res.status(503).send("Webhooks secret is not provided");
      return;
    }

    // Clerk's verifier expects a Web Request with the raw body; Express may give Buffer or string.
    const payload = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

    const request = new Request("http://internal/webhooks/clerk", {
      method: "POST",
      headers: new Headers(req.headers as HeadersInit),
      body: payload,
    });

    // throws if signature is wrong or body was tampered with; only then we trust evt.
    const evt = await verifyWebhook(request, { signingSecret: env.CLERK_WEBHOOK_SECRET });

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;

      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
        u.email_addresses?.[0]?.email_address;

      const displayName =
        [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || null;

      const role = parseRole(u.public_metadata?.role);

      await db
        .insert(users)
        .values({
          clerkUserId: u.id,
          email,
          displayName,
          role,
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, displayName, role, updatedAt: new Date() },
        });

      if (evt.type === "user.created") {
        await sendWelcomeEmail(email, displayName);
      }
    }

    if (evt.type === "user.deleted") {
      const id = evt.data.id;
      if (id) {
        await db.delete(users).where(eq(users.clerkUserId, id));
      }
    }

    res.json({ ok: true });
  } catch (err) {
    // Bad signature, malformed payload, or DB error — do not leak details to the client.
    console.error("Clerk webhook error", err);
    res.status(400).json({ error: "Invalid webhook" });
  }
}
