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
  listUsers,
  addAdmin,
  removeAdmin,
  listAdminOrders,
  updateAdminOrderStatus,
} from "../controllers/adminController";

const router = Router();

router.use(requireAdmin);

router.get("/imagekit/auth", getImageKitAuth);
router.get("/products", listAdminProducts);
router.post("/products", createAdminProduct);
router.patch("/products/:id", updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);

router.get("/stats", getAdminStats);
router.get("/users", listUsers);
router.get("/admins", listAdmins);
router.post("/admins", addAdmin);
router.delete("/admins/:id", removeAdmin);

router.get("/orders", listAdminOrders);
router.patch("/orders/:id/status", updateAdminOrderStatus);

export default router;
