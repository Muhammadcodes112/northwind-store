import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export async function getLocalUser(clerkUserId: string) {
  const [row] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (row) return row;

  // If user doesn't exist (e.g. webhook failed or running locally), create them automatically
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        clerkUserId,
      })
      .returning();

    if (newUser) {
      const { createNotification } = await import("../controllers/notificationController.js");
      await createNotification(newUser.id, {
        title: "Welcome to The Emporium Corner! 🛍️",
        message: "We're glad to have you here. Explore our wide range of premium products and enjoy a seamless shopping experience!",
        type: "info",
        link: "/",
      });
    }
    return newUser;
  } catch (e) {
    console.error("Failed to auto-create user:", e);
    return undefined;
  }
}

export async function hydrateUserContact(user: typeof users.$inferSelect) {
  if (user.email && user.email.trim().length > 0) return user;
  try {
    const { clerkClient } = await import("@clerk/express");
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
