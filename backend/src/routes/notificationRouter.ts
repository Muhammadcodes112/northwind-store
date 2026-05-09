import { Router } from "express";
import { listNotifications, markAllAsRead, markAsRead } from "../controllers/notificationController";

const router = Router();

router.get("/", listNotifications);
router.post("/read-all", markAllAsRead);
router.post("/:id/read", markAsRead);

export default router;
