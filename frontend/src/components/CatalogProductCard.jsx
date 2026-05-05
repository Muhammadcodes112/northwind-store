import { Link } from "react-router";
import { PlusIcon } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl.js";
import { useCart } from "../store/cart.js";

import toast from "react-hot-toast";

export function CatalogProductCard({ product }) {
  const addItem = useCart((s) => s.addItem);

  const handleAdd = () => {
    addItem(product.id);
    toast.success(`item have been added to cart`, {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  return (
    <article className="card group h-full overflow-hidden border border-base-300 bg-base-100 shadow-md transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl">
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden">
        <figure className="aspect-4/3 bg-base-300">
          {product.imageUrl ? (
            <img
              src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.catalogCard)}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </figure>
        <span className="badge badge-sm absolute left-3 top-3 border-0 bg-base-100/90 text-xs font-medium text-base-content/80 backdrop-blur">
          {product.category ?? "General"}
        </span>
      </Link>
      <div className="card-body grow gap-2 p-3 sm:gap-3 sm:p-5 text-left">
        <Link
          to={`/product/${product.slug}`}
          className="card-title line-clamp-2 text-sm sm:text-lg transition group-hover:text-primary"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 sm:line-clamp-3 text-[10px] sm:text-xs leading-relaxed text-base-content/70">
          {product.description}
        </p>
        <div className="card-actions mt-auto items-center justify-between border-t border-base-200 pt-2 sm:pt-4">
          <span className="text-sm sm:text-lg font-bold tabular-nums text-base-content">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            className="btn btn-primary btn-xs sm:btn-sm gap-1 shadow"
          >
            <PlusIcon className="size-3 sm:size-4" aria-hidden />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
