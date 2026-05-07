import pkg from "pg";
const { Client } = pkg;
import { config } from "dotenv";
config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    const res = await client.query("UPDATE users SET role = 'admin' WHERE email = 'funguyallen@gmail.com' RETURNING id, email, role");
    console.log("Updated via DB email exact:", res.rows);
    
    if (res.rows.length === 0) {
      // maybe we need to update it by clerk id if we can find it
      console.log("No user with exact email 'funguyallen@gmail.com'.");
      const res2 = await client.query("UPDATE users SET role = 'admin', email = 'funguyallen@gmail.com' WHERE clerk_user_id = 'user_2faYgI0x2E6T30vM6x2XmU6sF1I' RETURNING id, email, role");
      console.log("Tried updating known clerk id:", res2.rows);
    }
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
main();
