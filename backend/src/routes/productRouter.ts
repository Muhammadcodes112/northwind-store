import { Router } from "express";
import { getCategories, getProductBySlug, listProducts } from "../controllers/productController";
import { createProductReview, listProductReviews } from "../controllers/reviewController";

const router = Router();

router.get("/", listProducts);
router.get("/categories", getCategories);
router.get("/:slug", getProductBySlug);
router.get("/:slug/reviews", listProductReviews);
router.post("/:slug/reviews", createProductReview);

export default router;
