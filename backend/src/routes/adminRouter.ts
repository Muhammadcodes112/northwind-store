import { Router } from "express";
import {
  createAdminProduct,
  deleteAdminProduct,
  getImageKitAuth,
  listAdminProducts,
  requireAdmin,
  updateAdminProduct,
  getAdminStats,
  listAdmins,
  addAdmin,
  removeAdmin,
} from "../controllers/adminController";

const router = Router();

router.use(requireAdmin);

router.get("/imagekit/auth", getImageKitAuth);
router.get("/products", listAdminProducts);
router.post("/products", createAdminProduct);
router.patch("/products/:id", updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);

router.get("/stats", getAdminStats);
router.get("/admins", listAdmins);
router.post("/admins", addAdmin);
router.delete("/admins/:id", removeAdmin);

export default router;
