import { getAuth } from "@clerk/express";
import type { NextFunction, Response, Request } from "express";
import { getLocalUser } from "../lib/users";
import { isStaff } from "../lib/roles";
import { db } from "../db";
import { orderItems, orders, products } from "../db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { notifyOrderCompleted } from "../lib/orderNotifications";

export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const rows = isStaff(localUser.role)
      ? await db.select().from(orders).orderBy(desc(orders.createdAt))
      : await db
          .select()
          .from(orders)
          .where(eq(orders.userId, localUser.id))
          .orderBy(desc(orders.createdAt));

    const orderIds = rows.map((r) => r.id);
    const previewByOrder = new Map();

    if (orderIds.length > 0) {
      const itemRows = await db
        .select({
          orderId: orderItems.orderId,
          quantity: orderItems.quantity,
          name: products.name,
          slug: products.slug,
          imageUrl: products.imageUrl,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds))
        .orderBy(asc(orderItems.id));

      for (const row of itemRows) {
        const list = previewByOrder.get(row.orderId) ?? [];
        list.push({
          name: row.name,
          slug: row.slug,
          imageUrl: row.imageUrl,
          quantity: row.quantity,
        });
        previewByOrder.set(row.orderId, list);
      }
    }

    const ordersPayload = rows.map((o) => ({
      ...o,
      previewItems: previewByOrder.get(o.id) ?? [],
    }));

    res.json({ orders: ordersPayload });
  } catch (e) {
    next(e);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, req.params.id as string))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const canAccess = order.userId === localUser.id || isStaff(localUser.role);
    if (!canAccess) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    res.json({ order, items });
  } catch (e) {
    next(e);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, req.params.id as string))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Only the order owner can cancel it
    if (order.userId !== localUser.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Can only cancel pending orders
    if (order.status !== "pending") {
      res.status(400).json({ error: "Only pending orders can be cancelled." });
      return;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, order.id))
      .returning();

    res.json({ order: updatedOrder });
  } catch (e) {
    next(e);
  }
}

export async function completeOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, req.params.id as string))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Customers can only complete their own order.
    if (order.userId !== localUser.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Avoid invalid state changes from cancelled/failed.
    if (!["pending", "paid"].includes(order.status)) {
      res.status(400).json({ error: "Only pending or paid orders can be completed." });
      return;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(orders.id, order.id))
      .returning();

    notifyOrderCompleted(updatedOrder.id).catch(console.error);

    res.json({ order: updatedOrder });
  } catch (e) {
    next(e);
  }
}
