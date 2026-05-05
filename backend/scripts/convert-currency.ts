import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { products } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  console.log("Updating existing products from usd to ngn...");
  
  await db.update(products).set({ currency: "ngn" }).where(eq(products.currency, "usd"));
  
  console.log("Done!");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
