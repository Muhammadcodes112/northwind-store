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

    for (const adminEmail of adminEmails) {
      await resend.emails.send({
        from: "Emporium Corner Orders <onboarding@resend.dev>",
        to: adminEmail,
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
      }).catch(console.error);
    }

    await db
      .update(orders)
      .set({ adminNotifiedAt: new Date() })
      .where(eq(orders.id, order.id));
  }
}

export async function notifyOrderCreated(orderId: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (!user) return;

  const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
  const adminEmails = adminUsers.map((u) => u.email).filter(Boolean);
  if (adminEmails.length === 0) return;

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

  // @ts-ignore
  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  for (const adminEmail of adminEmails) {
    await resend.emails.send({
      from: "Emporium Corner Orders <onboarding@resend.dev>",
      to: adminEmail,
      subject: `New Order Created: #${order.id.slice(0, 8)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Order Received!</h2>
          <p>A new order has been made by a customer.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
            <p><strong>Order Code:</strong> #${order.id.slice(0, 8)}</p>
            <p><strong>Customer Name:</strong> ${user.displayName || "N/A"}</p>
            <p><strong>Customer Email:</strong> ${user.email || "N/A"}</p>
            <p><strong>Customer Phone:</strong> ${user.whatsappNumber || "Not provided"}</p>
            <p><strong>Delivery Location:</strong> ${order.deliveryLocation ?? "Not provided"}</p>
            <p><strong>Total:</strong> ${currencyFromCents(order.totalCents)}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          <p><strong>Products:</strong></p>
          <ul>${lines || "<li>No items</li>"}</ul>
        </div>
      `,
    }).catch(console.error);
  }
}

export async function notifyOrderCompleted(orderId: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (!user) return;

  const itemRows = await db
    .select({
      name: products.name,
      imageUrl: products.imageUrl,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

  // @ts-ignore
  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  // Send to Customer
  if (user.email) {
    const lines = itemRows
      .map(
        (item) => `
        <div style="display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : ''}
          <div>
            <p style="margin: 0; font-weight: bold;">${item.name}</p>
            <p style="margin: 0; color: #666; font-size: 14px;">Qty: ${item.quantity} | Total: ${currencyFromCents(item.unitPriceCents * item.quantity)}</p>
          </div>
        </div>
      `
      )
      .join("");

    await resend.emails.send({
      from: "Emporium Corner Orders <onboarding@resend.dev>",
      to: [user.email],
      subject: `Order Completed: #${order.id.slice(0, 8)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px;">
          <h2 style="color: #4CAF50; text-align: center;">Order Completed!</h2>
          <p>Hello ${user.displayName || "Customer"},</p>
          <p>Your order has been marked as completed successfully. Thank you for patronizing The Emporium Corner!</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.id.slice(0, 8)}</p>
            <p style="margin: 5px 0;"><strong>Total Paid:</strong> ${currencyFromCents(order.totalCents)}</p>
          </div>
          <h3 style="color: #333; margin-top: 20px;">Order Details</h3>
          <div>${lines || "<p>No items</p>"}</div>
          <p style="text-align: center; margin-top: 30px; font-weight: bold; color: #555;">
            Thank you for patronizing The Emporium Corner!
          </p>
        </div>
      `,
    });
  }

  // Send to Admins
  const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
  const adminEmails = adminUsers.map((u) => u.email).filter(Boolean);
  
  if (adminEmails.length > 0) {
    const adminLines = itemRows
      .map(
        (item) =>
          `<li>${item.name} - Qty: ${item.quantity} - Price: ${currencyFromCents(item.unitPriceCents * item.quantity)}</li>`,
      )
      .join("");

    for (const adminEmail of adminEmails) {
      await resend.emails.send({
        from: "Emporium Corner Orders <onboarding@resend.dev>",
        to: adminEmail,
        subject: `Order Completed: #${order.id.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Order Completed</h2>
            <p>An order has been completed by the customer or admin.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
              <p><strong>Order Code:</strong> #${order.id.slice(0, 8)}</p>
              <p><strong>Customer Name:</strong> ${user.displayName || "N/A"}</p>
              <p><strong>Customer Phone:</strong> ${user.whatsappNumber || "Not provided"}</p>
              <p><strong>Total:</strong> ${currencyFromCents(order.totalCents)}</p>
            </div>
            <p><strong>Products:</strong></p>
            <ul>${adminLines || "<li>No items</li>"}</ul>
          </div>
        `,
      }).catch(console.error);
    }
  }
}

