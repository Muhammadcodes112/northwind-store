import { db } from "../src/db/index.js";
import { orders, orderItems, products, users, notifications } from "../src/db/schema.js";
import { eq, and, notExists } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function backfill() {
  const completedOrders = await db.select().from(orders).where(eq(orders.status, "completed"));
  console.log(`Found ${completedOrders.length} completed orders.`);

  for (const order of completedOrders) {
    const existing = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, order.userId), eq(notifications.link, `/orders/${order.id}`)))
      .limit(1);

    if (existing.length === 0) {
      const itemRows = await db
        .select({
          name: products.name,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      const itemDetails = itemRows.map(i => `${i.quantity}x ${i.name}`).join(", ");
      
      await db.insert(notifications).values({
        id: uuidv4(),
        userId: order.userId,
        title: "Order Completed",
        message: `Your order #${order.id.slice(0, 8)} containing ${itemDetails || 'items'} has been successfully completed.`,
        type: "order_update",
        link: `/orders/${order.id}`,
        read: true,
      });
      console.log(`Created notification for order ${order.id}`);
    }
  }
  
  console.log("Backfill complete.");
}

backfill().catch(console.error).finally(() => process.exit(0));
