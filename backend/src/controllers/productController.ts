import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { products } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";
import {
  selectProductBySlugWithImageFallback,
  selectProductsWithImageFallback,
} from "../lib/productSelect";

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const cat = typeof req.query.category === "string" ? req.query.category.trim() : "";

    const activeOnly = eq(products.active, true);
    const whereClause = cat 
      ? and(activeOnly, sql`lower(${products.category}) = lower(${cat})`) 
      : activeOnly;

    const rows = await selectProductsWithImageFallback(whereClause);

    res.json({ products: rows });
  } catch (e) {
    next(e);
  }
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await db
      .select({ category: products.category })
      .from(products)
      .where(eq(products.active, true));

    const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) => a.localeCompare(b));

    res.json({ categories });
  } catch (e) {
    next(e);
  }
}

export async function getProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await selectProductBySlugWithImageFallback(req.params.slug as string);

    if (!row || !row.active) return res.status(404).json({ error: "Not found" });

    res.json({ product: row });
  } catch (e) {
    next(e);
  }
}
