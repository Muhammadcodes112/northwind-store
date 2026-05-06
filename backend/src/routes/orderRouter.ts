import { Router } from "express";
import { getOrder, listOrders, cancelOrder, completeOrder } from "../controllers/orderController";

const router = Router();

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/:id/cancel", cancelOrder);
router.post("/:id/complete", completeOrder);

export default router;
