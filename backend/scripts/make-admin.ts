import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "../src/db/schema.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  console.log("Updating all current users to 'admin' role...");
  
  // Set all existing users to have the admin role
  await db.update(users).set({ role: "admin" });
  
  console.log("Success! You are now an admin.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
