import { getAuth } from "@clerk/express";
import { Router } from "express";
import { getLocalUser } from "../lib/users";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await getLocalUser(userId);

    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const schema = z.object({
      whatsappNumber: z.string().trim().min(7),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    const user = await getLocalUser(userId);
    if (!user) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const [updated] = await db
      .update(users)
      .set({ whatsappNumber: parsed.data.whatsappNumber, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    res.json({ user: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
