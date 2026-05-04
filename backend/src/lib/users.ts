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
    return newUser;
  } catch (e) {
    console.error("Failed to auto-create user:", e);
    return undefined;
  }
}
