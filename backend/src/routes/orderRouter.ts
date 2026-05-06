import { Router } from "express";
import { getOrder, listOrders, cancelOrder } from "../controllers/orderController";

const router = Router();

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/:id/cancel", cancelOrder);

export default router;
