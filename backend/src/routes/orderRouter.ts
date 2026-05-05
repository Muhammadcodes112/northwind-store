import { Router } from "express";
import { getOrder, listOrders } from "../controllers/orderController";

const router = Router();

router.get("/", listOrders);
router.get("/:id", getOrder);

export default router;
