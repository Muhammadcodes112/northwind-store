import { db } from "../src/db";
import { products } from "../src/db/schema";

async function main() {
  const rows = await db.select().from(products).limit(10);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main().catch(console.error);
