import { Router } from "express";
import { getRandomAdminWhatsApp, updateMyWhatsAppNumber } from "../controllers/whatsappController";

const router = Router();

router.get("/random-admin", getRandomAdminWhatsApp);
router.patch("/me", updateMyWhatsAppNumber);

export default router;
