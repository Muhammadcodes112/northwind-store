import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { getLocalUser } from "../lib/users";
import { isAdmin } from "../lib/roles";
import ImageKit from "@imagekit/nodejs";
import { getEnv } from "../lib/env";
import { db } from "../db";
import { orderItems, products, orders } from "../db/schema";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { clerkClient } from "@clerk/express";
import { deleteImageKitAsset } from "../lib/imagekit";
import { users } from "../db/schema";
import {
  insertProductWithImageFallback,
  selectProductByIdWithImageFallback,
  selectProductsWithImageFallback,
  updateProductWithImageFallback,
} from "../lib/productSelect";
import { notifyOrderCompleted } from "../lib/orderNotifications.js";

const env = getEnv();

const trimmedUrl = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().url(),
);

const productCreate = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1).default("General"),
  description: z.string().default(""),
  priceCents: z.number().int().positive(),
  currency: z.string().min(1).default("usd"),
  imageUrl: z
    .union([trimmedUrl, z.literal("")])
    .optional()
    .nullable(),
  imageKitFileId: z.union([z.string().min(1), z.literal(""), z.null()]).optional(),
  imageUrls: z.array(trimmedUrl).max(5).default([]),
  imageKitFileIds: z.array(z.string().min(1)).max(5).default([]),
  active: z.boolean().default(true),
  discountPriceCents: z.union([z.number().int().positive(), z.null()]).optional(),
  stock: z.number().int().min(0).default(0),
});

const productPatch = productCreate.partial();

function buildProductUpdateSet(body: z.infer<typeof productPatch>) {
  const data: Partial<typeof products.$inferInsert> = {};
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.name !== undefined) data.name = body.name;
  if (body.category !== undefined) data.category = body.category;
  if (body.description !== undefined) data.description = body.description;
  if (body.priceCents !== undefined) data.priceCents = body.priceCents;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl === "" ? null : body.imageUrl;
  if (body.imageKitFileId !== undefined) {
    data.imageKitFileId = body.imageKitFileId === "" ? null : body.imageKitFileId;
  }
  if (body.imageUrls !== undefined) data.imageUrls = body.imageUrls.slice(0, 5);
  if (body.imageKitFileIds !== undefined) data.imageKitFileIds = body.imageKitFileIds.slice(0, 5);
  if (body.active !== undefined) data.active = body.active;
  if (body.discountPriceCents !== undefined) data.discountPriceCents = body.discountPriceCents;
  if (body.stock !== undefined) data.stock = body.stock;
  return data;
}

async function hydrateUserContact(user: typeof users.$inferSelect) {
  if (user.email && user.email.trim().length > 0) return user;
  try {
    const clerkUser = await clerkClient.users.getUser(user.clerkUserId);
    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null;

    if (primaryEmail || fullName) {
      const [updated] = await db
        .update(users)
        .set({
          ...(primaryEmail ? { email: primaryEmail } : {}),
          ...(fullName ? { displayName: fullName } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      return updated ?? user;
    }
  } catch {
    // fallback to existing db values
  }
  return user;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await getLocalUser(userId);

    if (!user || !isAdmin(user.role)) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    next();
  } catch (e) {
    next(e);
  }
}

export function getImageKitAuth(_req: Request, res: Response, next: NextFunction) {
  try {
    const client = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });

    const auth = client.helper.getAuthenticationParameters();

    res.json({
      ...auth,
      publicKey: env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    });
  } catch (e) {
    next(e);
  }
}

export async function listAdminProducts(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await selectProductsWithImageFallback();
    res.json({ products: rows });
  } catch (e) {
    next(e);
  }
}

export async function createAdminProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = productCreate.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      return;
    }
    const { imageUrl, imageKitFileId, imageUrls, imageKitFileIds, ...rest } = parsed.data;
    const urls = Array.from(new Set([imageUrl, ...imageUrls].filter(Boolean))).slice(0, 5) as string[];
    const fileIds = Array.from(new Set([imageKitFileId, ...imageKitFileIds].filter(Boolean))).slice(0, 5) as string[];

    const row = await insertProductWithImageFallback({
      ...rest,
      imageUrl: urls[0] || null,
      imageKitFileId: fileIds[0] || null,
      imageUrls: urls,
      imageKitFileIds: fileIds,
    });

    if (row) {
      // Notify all users about the new product
      const allUsers = await db.select({ id: users.id }).from(users);
      const { createNotification } = await import("./notificationController.js");
      
      // Using Promise.all for faster execution, though bulk insert would be even better
      // if createNotification supported it. For now, let's keep it simple.
      Promise.all(allUsers.map(u => 
        createNotification(u.id, {
          title: "Just landed! 🚀",
          message: `${row.name} is now available in our store. Check it out before it's gone!`,
          type: "info",
          link: `/product/${row.slug}`,
        })
      )).catch(err => console.error("Failed to notify users about new product:", err));
    }

    res.status(201).json({ product: row });
  } catch (e: any) {
    if (e?.code === "23505") {
      res.status(400).json({ error: "A product with this name/slug already exists." });
      return;
    }
    if (e?.code === "22003") {
      res.status(400).json({ error: "Price or stock value is too large." });
      return;
    }
    next(e);
  }
}

export async function updateAdminProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = productPatch.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const data = buildProductUpdateSet(parsed.data);

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const row = await updateProductWithImageFallback(req.params.id as string, data);

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ product: row });
  } catch (e: any) {
    if (e?.code === "23505") {
      res.status(400).json({ error: "A product with this name/slug already exists." });
      return;
    }
    if (e?.code === "22003") {
      res.status(400).json({ error: "Price or stock value is too large." });
      return;
    }
    next(e);
  }
}

export async function deleteAdminProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const existing = await selectProductByIdWithImageFallback(id);
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [countRow] = await db
      .select({ c: count() })
      .from(orderItems)
      .where(eq(orderItems.productId, id));

    if (Number(countRow?.c ?? 0) > 0) {
      res.status(409).json({
        error:
          "This product is on one or more orders and cannot be deleted. Deactivate it instead.",
      });
      return;
    }

    const imageKitFileIds = Array.from(
      new Set([existing.imageKitFileId, ...(existing.imageKitFileIds ?? [])].filter(Boolean)),
    );
    for (const fileId of imageKitFileIds) {
      await deleteImageKitAsset(env, fileId);
    }
    await db.delete(products).where(eq(products.id, id));

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function getAdminStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [countRow] = await db.select({ c: count() }).from(users);
    res.json({ userCount: Number(countRow?.c ?? 0) });
  } catch (e) {
    next(e);
  }
}

export async function listAdmins(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await db.select().from(users).where(eq(users.role, "admin")).orderBy(desc(users.createdAt));
    const hydrated = await Promise.all(rows.map(hydrateUserContact));
    res.json({ admins: hydrated });
  } catch (e) {
    next(e);
  }
}

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    const hydrated = await Promise.all(rows.map(hydrateUserContact));
    res.json({ users: hydrated });
  } catch (e) {
    next(e);
  }
}

export async function addAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const email = req.body.email;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    // Since Clerk provides emails as the primary identifier sometimes, we search by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      res.status(404).json({ error: "User with this email not found" });
      return;
    }

    if (user.role === "admin") {
      res.status(400).json({ error: "User is already an admin" });
      return;
    }

    const [updated] = await db
      .update(users)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    await clerkClient.users.updateUserMetadata(user.clerkUserId, {
      publicMetadata: { role: "admin" },
    });

    res.json({ admin: updated });
  } catch (e) {
    next(e);
  }
}

export async function removeAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [updated] = await db
      .update(users)
      .set({ role: "customer", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    await clerkClient.users.updateUserMetadata(user.clerkUserId, {
      publicMetadata: { role: "customer" },
    });

    res.json({ admin: updated });
  } catch (e) {
    next(e);
  }
}

export async function listAdminOrders(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await db
      .select({
        order: orders,
        user: users,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    res.json({
      orders: rows.map((row) => ({
        ...row.order,
        user: row.user,
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function getAdminOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);

    const itemRows = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
        productId: products.id,
        productName: products.name,
        productImageUrl: products.imageUrl,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    const items = itemRows.map((r) => ({
      id: r.id,
      quantity: r.quantity,
      unitPriceCents: r.unitPriceCents,
      product: {
        id: r.productId,
        name: r.productName,
        imageUrl: r.productImageUrl,
      },
    }));

    res.json({ order: { ...order, user, items } });
  } catch (e) {
    next(e);
  }
}

export async function updateAdminOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!["pending", "paid", "failed", "completed"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (status === "paid" || status === "completed") {
      const { reduceStockForOrder } = await import("../lib/inventory.js");
      await reduceStockForOrder(updated.id);
    }

    if (status === "completed") {
      notifyOrderCompleted(updated.id).catch(console.error);
    }

    const itemRows = await db
      .select({
        name: products.name,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, updated.id));

    const itemDetails = itemRows.map(i => `${i.quantity}x ${i.name}`).join(", ");

    const { createNotification } = await import("./notificationController.js");
    await createNotification(updated.userId, {
      title: "Order Update",
      message: `Your order #${updated.id.slice(0, 8)} containing ${itemDetails || 'items'} status has been updated to ${status}.`,
      type: "order_update",
      link: `/orders/${updated.id}`,
    });

    res.json({ order: updated });
  } catch (e) {
    next(e);
  }
}
