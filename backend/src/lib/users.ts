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
