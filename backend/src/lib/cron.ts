import { CronJob } from "cron";
import http from "node:http";
import https from "node:https";
import { sendPendingOrderAdminReminders } from "./orderNotifications";

// every 14 minutes send a GET request to the health endpoint
const job = new CronJob("*/14 * * * *", function () {
  const base = process.env.FRONTEND_URL;
  if (!base) return;
  const url = new URL("/health", base).href;
  const client = url.startsWith("https:") ? https : http;

  client
    .get(url, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

const adminReminderJob = new CronJob("*/1 * * * *", function () {
  void sendPendingOrderAdminReminders().catch((e) =>
    console.error("Admin reminder cron failed", e),
  );
});

adminReminderJob.start();

export default job;
