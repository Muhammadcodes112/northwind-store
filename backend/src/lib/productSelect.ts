import { desc, eq, type SQL } from "drizzle-orm";
import { db } from "../db";
import { products } from "../db/schema";

export const baseProductColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  category: products.category,
  description: products.description,
  priceCents: products.priceCents,
  currency: products.currency,
  imageUrl: products.imageUrl,
  imageKitFileId: products.imageKitFileId,
  active: products.active,
  discountPriceCents: products.discountPriceCents,
  stock: products.stock,
  createdAt: products.createdAt,
};

function isMissingMultiImageColumn(error: unknown) {
  const err = error as { code?: string; message?: string };
  return (
    err?.code === "42703" ||
    err?.message?.includes("image_urls") ||
    err?.message?.includes("image_kit_file_ids")
  );
}

export function hydrateLegacyImages<T extends { imageUrl: string | null; imageKitFileId?: string | null }>(
  row: T,
) {
  return {
    ...row,
    imageUrls: row.imageUrl ? [row.imageUrl] : [],
    imageKitFileIds: row.imageKitFileId ? [row.imageKitFileId] : [],
  };
}

export async function selectProductsWithImageFallback(whereClause?: SQL) {
  try {
    const query = db.select().from(products);
    const rows = whereClause
      ? await query.where(whereClause).orderBy(desc(products.createdAt))
      : await query.orderBy(desc(products.createdAt));
    return rows;
  } catch (error) {
    if (!isMissingMultiImageColumn(error)) throw error;
    const query = db.select(baseProductColumns).from(products);
    const rows = whereClause
      ? await query.where(whereClause).orderBy(desc(products.createdAt))
      : await query.orderBy(desc(products.createdAt));
    return rows.map(hydrateLegacyImages);
  }
}

export async function selectProductBySlugWithImageFallback(slug: string) {
  try {
    const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return row ?? null;
  } catch (error) {
    if (!isMissingMultiImageColumn(error)) throw error;
    const [row] = await db
      .select(baseProductColumns)
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return row ? hydrateLegacyImages(row) : null;
  }
}

export async function selectProductByIdWithImageFallback(id: string) {
  try {
    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return row ?? null;
  } catch (error) {
    if (!isMissingMultiImageColumn(error)) throw error;
    const [row] = await db.select(baseProductColumns).from(products).where(eq(products.id, id)).limit(1);
    return row ? hydrateLegacyImages(row) : null;
  }
}

export async function insertProductWithImageFallback(values: typeof products.$inferInsert) {
  try {
    const [row] = await db.insert(products).values(values).returning();
    return row;
  } catch (error) {
    if (!isMissingMultiImageColumn(error)) throw error;
    const { imageUrls: _imageUrls, imageKitFileIds: _imageKitFileIds, ...legacyValues } = values;
    const [row] = await db.insert(products).values(legacyValues).returning(baseProductColumns);
    return hydrateLegacyImages(row);
  }
}

export async function updateProductWithImageFallback(
  id: string,
  values: Partial<typeof products.$inferInsert>,
) {
  try {
    const [row] = await db.update(products).set(values).where(eq(products.id, id)).returning();
    return row ?? null;
  } catch (error) {
    if (!isMissingMultiImageColumn(error)) throw error;
    const { imageUrls: _imageUrls, imageKitFileIds: _imageKitFileIds, ...legacyValues } = values;
    const [row] = await db
      .update(products)
      .set(legacyValues)
      .where(eq(products.id, id))
      .returning(baseProductColumns);
    return row ? hydrateLegacyImages(row) : null;
  }
}
