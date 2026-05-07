import { listOrders } from "./controllers/orderController.js";

const req = {
  auth: { userId: "user_3DGqzF3zz7GfT0Weov7YqoaibcK" }
};
const res = {
  status: (code) => { console.log("Status:", code); return res; },
  json: (data) => console.log("JSON:", data)
};
const next = (err) => console.error("Next Error:", err);

// Need to mock getAuth
import * as clerkExpress from "@clerk/express";
clerkExpress.getAuth = () => ({ userId: "user_3DGqzF3zz7GfT0Weov7YqoaibcK", isAuthenticated: true });

listOrders(req, res, next).catch(console.error);
