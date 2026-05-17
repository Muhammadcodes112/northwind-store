import { useState } from "react";
import { uploadImageToImageKit } from "../lib/imagekitUpload.js";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl.js";

export function AdminProductForm({ initial, saving, error, getToken, onCancel, onSubmit }) {
  const isEditing = Boolean(initial?.id);
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
    if (!isEditing) {
      setSlug(generateSlug(newName));
    }
  };

  const categories = initial?.availableCategories ?? [];

  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceCents, setPriceCents] = useState(isEditing ? String(initial.priceCents / 100) : "");
  const [discountPriceCents, setDiscountPriceCents] = useState(isEditing && initial.discountPriceCents ? String(initial.discountPriceCents / 100) : "");
  const [stock, setStock] = useState(isEditing ? String(initial.stock ?? 0) : "0");
  const [images, setImages] = useState(() => {
    const urls = [initial?.imageUrl, ...(Array.isArray(initial?.imageUrls) ? initial.imageUrls : [])]
      .filter(Boolean);
    const uniqueUrls = Array.from(new Set(urls)).slice(0, 5);
    const fileIds = [initial?.imageKitFileId, ...(Array.isArray(initial?.imageKitFileIds) ? initial.imageKitFileIds : [])];
    return uniqueUrls.map((url, index) => ({ url, fileId: fileIds[index] ?? "" }));
  });
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
      currency: "ngn",
      imageUrl: images[0]?.url?.trim() || null,
      imageKitFileId: images[0]?.fileId?.trim() || null,
      imageUrls: images.map((image) => image.url.trim()).filter(Boolean).slice(0, 5),
      imageKitFileIds: images.map((image) => image.fileId?.trim()).filter(Boolean).slice(0, 5),
      active,
      discountPriceCents: discountPriceCents ? Math.round(Number.parseFloat(discountPriceCents) * 100) : null,
      stock: Number.parseInt(stock, 10) || 0,
    };

    if (isEditing) {
      const patch = {};
      if (body.name !== initial.name) patch.name = body.name;
      if (body.category !== (initial.category ?? "General")) patch.category = body.category;
      if (body.description !== initial.description) patch.description = body.description;
      if (body.priceCents !== initial.priceCents) patch.priceCents = body.priceCents;
      if ((body.imageUrl ?? "") !== (initial.imageUrl ?? "")) patch.imageUrl = body.imageUrl;
      if (JSON.stringify(body.imageUrls) !== JSON.stringify(initial.imageUrls ?? [])) {
        patch.imageUrls = body.imageUrls;
      }
      if ((body.imageKitFileId ?? null) !== (initial.imageKitFileId ?? null)) {
        patch.imageKitFileId = body.imageKitFileId;
      }
      if (JSON.stringify(body.imageKitFileIds) !== JSON.stringify(initial.imageKitFileIds ?? [])) {
        patch.imageKitFileIds = body.imageKitFileIds;
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

    if (images.length >= 5) {
      setUploadError("You can add up to 5 images per product.");
      return;
    }

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

      setImages((current) => [...current, { url, fileId: fileId ?? "" }].slice(0, 5));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  function updateImageUrl(index, url) {
    setImages((current) =>
      current.map((image, i) => (i === index ? { ...image, url, fileId: url === image.url ? image.fileId : "" } : image)),
    );
  }

  function removeImage(index) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  function addImageField() {
    if (images.length >= 5) {
      setUploadError("You can add up to 5 images per product.");
      return;
    }
    setImages((current) => [...current, { url: "", fileId: "" }]);
  }

  return (
    <form className="mt-4 flex flex-col gap-3 text-[72%] sm:text-[90%]" onSubmit={handleSubmit}>
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
          disabled={isEditing}
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
        <div className="flex gap-3 items-start w-full">
          <label className="form-control flex-1">
            <span className="label-text">Price (NGN)</span>
            <input
              className="input input-bordered w-full"
              type="number"
              step="0.01"
              min="0.01"
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              required
            />
          </label>
          
          <label className="form-control flex-1">
            <span className="label-text">Discount Price (NGN) <span className="text-base-content/50 text-xs">Optional</span></span>
            <input
              className="input input-bordered w-full"
              type="number"
              step="0.01"
              min="0.01"
              value={discountPriceCents}
              onChange={(e) => setDiscountPriceCents(e.target.value)}
            />
          </label>
        </div>

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
      </div>

      <div className="form-control w-full">
        <span className="label-text">Images & Short Videos ({images.length}/5)</span>
        <label className="mb-2 flex cursor-pointer flex-wrap items-center gap-2">
          <span className="btn btn-secondary btn-sm shrink-0">
            {uploadingImage ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Upload to ImageKit"
            )}
          </span>

          <span className="text-xs text-base-content/60">PNG, JPG, WebP, GIF, MP4, WebM, MOV · max 10MB</span>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={uploadingImage || saving || images.length >= 5}
            onChange={handleImageUpload}
          />
        </label>

        <label className="label py-0">
          <span className="label-text-alt text-base-content/60">Media URL (any HTTPS URL)</span>
        </label>

        <div className="space-y-2">
          {images.map((image, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="input input-bordered w-full"
                type="url"
                value={image.url}
                onChange={(e) => updateImageUrl(index, e.target.value)}
                placeholder="https://..."
              />
              <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => removeImage(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        {images.length < 5 ? (
          <button type="button" className="btn btn-ghost btn-sm mt-2 w-fit" onClick={addImageField}>
            Add media URL
          </button>
        ) : null}

        {uploadError ? (
          <span className="mt-1 text-xs text-error" role="alert">
            {uploadError}
          </span>
        ) : null}
        {images.some((image) => image.url) ? (
          <div className="mt-2 grid grid-cols-2 gap-2 overflow-hidden rounded-lg border border-base-300 bg-base-200 p-2 sm:grid-cols-5">
            {images.filter((image) => image.url).map((image, index) => {
              const isVideo = image.url.match(/\.(mp4|webm|mov|ogg)$/i);
              return isVideo ? (
                <video
                  key={`${image.url}-${index}`}
                  src={image.url}
                  className="mx-auto aspect-square max-h-24 w-full rounded-md object-cover bg-black"
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  key={`${image.url}-${index}`}
                  src={imageKitOptimizedUrl(image.url, IK_PRESETS.formPreview)}
                  alt=""
                  className="mx-auto aspect-square max-h-24 w-full rounded-md object-cover"
                  decoding="async"
                />
              );
            })}
          </div>
        ) : null}
      </div>

            {error ? (
        <div role="alert" className="alert alert-error text-sm mt-2">
          {typeof error === "string" ? error : "Save failed. Check the product fields and try again."}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between">
        <label className="label cursor-pointer justify-start gap-2 sm:gap-3 py-0">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm sm:toggle-md"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <span className="label-text text-xs sm:text-sm">Active</span>
        </label>



              <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm sm:btn-md" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm sm:btn-md" disabled={saving || uploadingImage}>
            {saving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
