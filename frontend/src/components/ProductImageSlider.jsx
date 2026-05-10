import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import { IK_PRESETS, imageKitOptimizedUrl, imageKitWatermarkedUrl } from "../lib/imagekitUrl";

export function getProductImages(product) {
  const images = Array.isArray(product?.imageUrls) ? product.imageUrls : [];
  const merged = [product?.imageUrl, ...images].filter(Boolean);
  return Array.from(new Set(merged)).slice(0, 5);
}

export function ProductImageSlider({ product }) {
  const images = useMemo(() => getProductImages(product), [product]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [product?.id]);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [images.length]);

  const move = (direction) => {
    setActive((current) => {
      if (direction === "left") return (current - 1 + images.length) % images.length;
      return (current + 1) % images.length;
    });
  };

  const currentImage = images[active];
  const watermarkedFullUrl = currentImage
    ? imageKitWatermarkedUrl(currentImage, IK_PRESETS.productHero)
    : null;

  return (
    <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-lg mx-auto w-[60%] sm:w-full">
      <div className="relative aspect-square overflow-hidden bg-base-300 group">
        {images.length > 0 ? (
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {images.map((image, index) => (
              <figure key={`${image}-${index}`} className="h-full min-w-full">
                <img
                  src={imageKitOptimizedUrl(image, IK_PRESETS.productHero)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  fetchPriority={index === 0 ? "high" : undefined}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </figure>
            ))}
          </div>
        ) : (
          <div className="h-full w-full" />
        )}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => move("left")}
              className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45 sm:size-11"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="size-5 sm:size-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => move("right")}
              className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45 sm:size-11"
              aria-label="Next image"
            >
              <ChevronRightIcon className="size-5 sm:size-6" aria-hidden />
            </button>
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
              {images.map((image, index) => (
                <button
                  key={`${image}-dot`}
                  type="button"
                  className={`h-1.5 rounded-full transition-all ${index === active ? "w-5 bg-primary" : "w-1.5 bg-white/80"}`}
                  onClick={() => setActive(index)}
                  aria-label={`Show image ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {watermarkedFullUrl ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-base-300 bg-base-200/40 px-3 py-2">
          <a
            className="btn btn-ghost btn-xs gap-1"
            href={watermarkedFullUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLinkIcon className="size-3.5" aria-hidden />
            Open full size
          </a>
        </div>
      ) : null}
    </div>
  );
}
