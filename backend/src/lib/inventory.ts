import { db } from "../db";
import { orderItems, orders, products } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export async function reduceStockForOrder(orderId: string) {
  await db.transaction(async (tx) => {
    // 1. Get the order and check if stock was already reduced
    const [order] = await tx
      .select({ id: orders.id, stockReduced: orders.stockReduced })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order || order.stockReduced) return;

    // 2. Get all items for the order
    const items = await tx
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // 3. Reduce stock for each product
    for (const item of items) {
      await tx
        .update(products)
        .set({
          stock: sql`GREATEST(stock - ${item.quantity}, 0)`,
        })
        .where(eq(products.id, item.productId));
    }

    // 4. Mark order as stock reduced
    await tx
      .update(orders)
      .set({ stockReduced: true })
      .where(eq(orders.id, orderId));
  });
}
