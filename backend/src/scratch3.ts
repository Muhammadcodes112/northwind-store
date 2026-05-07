import { clerkClient } from "@clerk/express";
import { config } from "dotenv";
config();

async function main() {
  const users = await clerkClient.users.getUserList();
  for (const u of users.data) {
    if (u.emailAddresses.some(e => e.emailAddress === "funguyallen@gmail.com")) {
      console.log(`Clerk ID: ${u.id}, Email: funguyallen@gmail.com`);
    }
  }
}
main();
