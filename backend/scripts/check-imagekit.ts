import { db } from "../src/db";
import { products } from "../src/db/schema";
import { like, or } from "drizzle-orm";

async function main() {
  const rows = await db.select().from(products).where(
    or(
      like(products.imageUrl, "%ik.imagekit.io%"),
      like(products.imageUrl, "%imagekit%")
    )
  );
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main().catch(console.error);
