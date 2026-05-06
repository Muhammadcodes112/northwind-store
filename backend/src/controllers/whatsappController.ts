import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../lib/users";
import { isAdmin } from "../lib/roles";

export async function getRandomAdminWhatsApp(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await db
      .select({ whatsappNumber: users.whatsappNumber })
      .from(users)
      .where(sql`${users.role} = 'admin' AND ${users.whatsappNumber} IS NOT NULL AND ${users.whatsappNumber} != ''`);

    if (rows.length === 0) {
      res.json({ whatsappNumber: "08133180063" });
      return;
    }

    const randomIndex = Math.floor(Math.random() * rows.length);
    res.json({ whatsappNumber: rows[randomIndex].whatsappNumber });
  } catch (e) {
    next(e);
  }
}

export async function updateMyWhatsAppNumber(req: Request, res: Response, next: NextFunction) {
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

    const { whatsappNumber } = req.body;
    
    if (typeof whatsappNumber !== "string") {
      res.status(400).json({ error: "whatsappNumber is required and must be a string" });
      return;
    }

    const [updated] = await db
      .update(users)
      .set({ whatsappNumber, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    res.json({ user: updated });
  } catch (e) {
    next(e);
  }
}
