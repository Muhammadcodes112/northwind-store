import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { getLocalUser } from "../lib/users";
import { db } from "../db";
import { notifications } from "../db/schema";
import { desc, eq, and } from "drizzle-orm";

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await getLocalUser(userId);
    if (!user) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt));

    res.json({ notifications: rows });
  } catch (e) {
    next(e);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await getLocalUser(userId);
    if (!user) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, user.id));

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await getLocalUser(userId);
    if (!user) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, req.params.id as string),
          eq(notifications.userId, user.id)
        )
      );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function createNotification(userId: string, data: { title: string; message: string; type?: string; link?: string }) {
  try {
    await db.insert(notifications).values({
      userId,
      title: data.title,
      message: data.message,
      type: data.type ?? "info",
      link: data.link,
    });
  } catch (e) {
    console.error("Failed to create notification", e);
  }
}
