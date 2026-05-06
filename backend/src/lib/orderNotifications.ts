import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { db } from "../db";
import { orderItems, orders, products, users } from "../db/schema";

function currencyFromCents(cents: number) {
  return `NGN ${(cents / 100).toFixed(2)}`;
}

export async function sendPendingOrderAdminReminders() {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const threshold = new Date(Date.now() - 20 * 60 * 1000);

  const dueOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        lte(orders.createdAt, threshold),
        isNull(orders.adminNotifiedAt),
        inArray(orders.status, ["pending", "paid"]),
      ),
    );

  if (dueOrders.length === 0) return;

  const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
  const adminEmails = adminUsers.map((u) => u.email).filter(Boolean);
  if (adminEmails.length === 0) return;

  // @ts-ignore
  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  for (const order of dueOrders) {
    const itemRows = await db
      .select({
        name: products.name,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    const lines = itemRows
      .map(
        (item) =>
          `<li>${item.name} - Qty: ${item.quantity} - Price: ${currencyFromCents(item.unitPriceCents * item.quantity)}</li>`,
      )
      .join("");

    await resend.emails.send({
      from: "Emporium Corner Orders <onboarding@resend.dev>",
      to: adminEmails,
      subject: `Order Pending Confirmation: #${order.id.slice(0, 8)}`,
      html: `
        <h2>Order Alert</h2>
        <p>The customer has not cancelled this order in 20 minutes.</p>
        <p><strong>Order Code:</strong> #${order.id.slice(0, 8)}</p>
        <p><strong>Delivery Location:</strong> ${order.deliveryLocation ?? "Not provided"}</p>
        <p><strong>Total:</strong> ${currencyFromCents(order.totalCents)}</p>
        <p><strong>Items:</strong></p>
        <ul>${lines || "<li>No items</li>"}</ul>
      `,
    });

    await db
      .update(orders)
      .set({ adminNotifiedAt: new Date() })
      .where(eq(orders.id, order.id));
  }
}

