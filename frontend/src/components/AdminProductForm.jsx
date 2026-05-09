import { useState } from "react";
import { uploadImageToImageKit } from "../lib/imagekitUpload.js";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl.js";

export function AdminProductForm({ initial, saving, error, getToken, onCancel, onSubmit }) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "General");

  // Helper to generate slug
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Auto-slug effect
  const handleNameChange = (newName) => {
    setName(newName);
    // Only auto-update slug if we are creating a new product
    if (!initial) {
      setSlug(generateSlug(newName));
    }
  };

  const categories = initial?.availableCategories ?? [];

  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceCents, setPriceCents] = useState(initial ? String(initial.priceCents / 100) : "");
  const [discountPriceCents, setDiscountPriceCents] = useState(initial && initial.discountPriceCents ? String(initial.discountPriceCents / 100) : "");
  const [stock, setStock] = useState(initial ? String(initial.stock ?? 0) : "0");
  const [currency, setCurrency] = useState(initial?.currency ?? "ngn");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [imageKitFileId, setImageKitFileId] = useState(initial?.imageKitFileId ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const dollars = Number.parseFloat(priceCents);
    if (Number.isNaN(dollars) || dollars <= 0) return;

    const body = {
      slug: slug.trim(),
      name: name.trim(),
      category: category.trim() || "General",
      description: description.trim(),
      priceCents: Math.round(dollars * 100),
      currency: currency.trim().toLowerCase(),
      imageUrl: imageUrl.trim() || null,
      imageKitFileId: imageKitFileId.trim() || null,
      active,
      discountPriceCents: discountPriceCents ? Math.round(Number.parseFloat(discountPriceCents) * 100) : null,
      stock: Number.parseInt(stock, 10) || 0,
    };

    if (initial) {
      const patch = {};
      if (body.name !== initial.name) patch.name = body.name;
      if (body.category !== (initial.category ?? "General")) patch.category = body.category;
      if (body.description !== initial.description) patch.description = body.description;
      if (body.priceCents !== initial.priceCents) patch.priceCents = body.priceCents;
      if (body.currency !== initial.currency) patch.currency = body.currency;
      if ((body.imageUrl ?? "") !== (initial.imageUrl ?? "")) patch.imageUrl = body.imageUrl;
      if ((body.imageKitFileId ?? null) !== (initial.imageKitFileId ?? null)) {
        patch.imageKitFileId = body.imageKitFileId;
      }
      if (body.active !== initial.active) patch.active = body.active;
      if (body.discountPriceCents !== (initial.discountPriceCents ?? null)) patch.discountPriceCents = body.discountPriceCents;
      if (body.stock !== (initial.stock ?? 0)) patch.stock = body.stock;
      if (Object.keys(patch).length === 0) {
        onCancel();
        return;
      }
      onSubmit(patch);
    } else {
      onSubmit(body);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large (max 10MB).");
      return;
    }

    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".jpg";
    const base = (slug.trim() || "product").replace(/[^\w-]+/g, "-").slice(0, 80);

    setUploadingImage(true);

    try {
      const { url, fileId } = await uploadImageToImageKit(file, getToken, {
        fileName: `${base}-${Date.now()}${ext}`,
      });

      setImageUrl(url);
      setImageKitFileId(fileId ?? "");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
      <label className="form-control w-full">
        <span className="label-text">Name</span>
        <input
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </label>

      <label className="form-control w-full">
        <span className="label-text">Slug</span>
        <input
          className="input input-bordered w-full"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          disabled={Boolean(initial)}
        />
      </label>

      <label className="form-control w-full">
        <span className="label-text">Category</span>
        <input
          className="input input-bordered w-full"
          list="category-list"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Select or type category..."
          required
        />
        <datalist id="category-list">
          {categories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </label>

      <label className="form-control w-full">
        <span className="label-text">Description</span>
        <textarea
          className="textarea textarea-bordered h-24 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="form-control">
          <span className="label-text">Price (NGN)</span>
          <input
            className="input input-bordered"
            type="number"
            step="0.01"
            min="0.01"
            value={priceCents}
            onChange={(e) => setPriceCents(e.target.value)}
            required
          />
        </label>
        
        <label className="form-control">
          <span className="label-text">Discount Price (NGN) <span className="text-base-content/50 text-xs">Optional</span></span>
          <input
            className="input input-bordered"
            type="number"
            step="0.01"
            min="0.01"
            value={discountPriceCents}
            onChange={(e) => setDiscountPriceCents(e.target.value)}
          />
        </label>

        <label className="form-control">
          <span className="label-text">Stock</span>
          <input
            className="input input-bordered"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </label>

        <label className="form-control">
          <span className="label-text">Currency</span>
          <input
            className="input input-bordered"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-control w-full">
        <span className="label-text">Image</span>
        <label className="mb-2 flex cursor-pointer flex-wrap items-center gap-2">
          <span className="btn btn-secondary btn-sm shrink-0">
            {uploadingImage ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Upload to ImageKit"
            )}
          </span>

          <span className="text-xs text-base-content/60">PNG, JPG, WebP, GIF · max 10MB</span>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={uploadingImage || saving}
            onChange={handleImageUpload}
          />
        </label>

        <label className="label py-0">
          <span className="label-text-alt text-base-content/60">Image URL (any HTTPS URL)</span>
        </label>

        <input
          className="input input-bordered w-full"
          type="url"
          value={imageUrl}
          onChange={(e) => {
            const v = e.target.value;
            if (v !== imageUrl) setImageKitFileId("");
            setImageUrl(v);
          }}
          placeholder="https://..."
        />

        {uploadError ? (
          <span className="mt-1 text-xs text-error" role="alert">
            {uploadError}
          </span>
        ) : null}
        {imageUrl ? (
          <div className="mt-2 overflow-hidden rounded-lg border border-base-300 bg-base-200 p-2">
            <img
              src={imageKitOptimizedUrl(imageUrl, IK_PRESETS.formPreview)}
              alt=""
              className="mx-auto max-h-32 w-auto object-contain"
              decoding="async"
            />
          </div>
        ) : null}
      </div>

      <label className="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        <span className="label-text">Active in store</span>
      </label>

      {error ? (
        <div role="alert" className="alert alert-error text-sm">
          Save failed (check slug unique &amp; fields).
        </div>
      ) : null}

      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || uploadingImage}>
          {saving ? <span className="loading loading-spinner loading-sm" /> : "Save"}
        </button>
      </div>
    </form>
  );
}
