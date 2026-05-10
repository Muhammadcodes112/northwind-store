import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../lib/users";
import { db } from "../db";
import { reviews } from "../db/schema";
import { desc, eq, and } from "drizzle-orm";
import { z } from "zod";
import { selectProductBySlugWithImageFallback } from "../lib/productSelect";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(""),
});

export async function listProductReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;

    const product = await selectProductBySlugWithImageFallback(slug);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const rows = await db.query.reviews.findMany({
      where: eq(reviews.productId, product.id),
      orderBy: [desc(reviews.createdAt)],
      with: {
        user: true,
      },
    });

    res.json({ reviews: rows });
  } catch (e) {
    next(e);
  }
}

export async function createProductReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(401).json({ error: "User not synced" });
      return;
    }

    const slug = req.params.slug as string;
    const product = await selectProductBySlugWithImageFallback(slug);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid review data", details: parsed.error.flatten() });
      return;
    }

    // Ensure user hasn't already reviewed this product
    const [existing] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, product.id), eq(reviews.userId, localUser.id)))
      .limit(1);

    if (existing) {
      res.status(400).json({ error: "You have already reviewed this product." });
      return;
    }

    const [newReview] = await db
      .insert(reviews)
      .values({
        productId: product.id,
        userId: localUser.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      })
      .returning();

    res.status(201).json({ review: newReview });
  } catch (e) {
    next(e);
  }
}
