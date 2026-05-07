import pkg from "pg";
const { Client } = pkg;
import { config } from "dotenv";
config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    const res = await client.query("SELECT * FROM users");
    console.log("All users:", res.rows);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
main();
