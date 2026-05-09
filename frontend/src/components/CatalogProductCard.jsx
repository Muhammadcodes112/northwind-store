import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { PlusIcon } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl.js";
import { useCart } from "../store/cart.js";

import toast from "react-hot-toast";

export function CatalogProductCard({ product }) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, []);

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
    <article 
      ref={cardRef}
      className={`card group h-full overflow-hidden border border-base-300 bg-base-100 shadow-md transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl reveal ${isVisible ? "active" : ""} duration-700 ease-out fill-mode-both`}
    >
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden">
        <figure className="aspect-[4/3] bg-base-300">
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
      <div className="card-body grow gap-1.5 p-3 sm:gap-2.5 sm:p-5 text-left text-[0.88em] leading-snug relative">
        <Link
          to={`/product/${product.slug}`}
          className="card-title line-clamp-2 text-[13px] sm:text-[15px] font-bold transition group-hover:text-primary leading-tight"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 sm:line-clamp-3 text-[9px] sm:text-[11px] leading-relaxed text-base-content/70">
          {product.description}
        </p>
        <div className="card-actions mt-auto items-center justify-between border-t border-base-200 pt-2 sm:pt-3">
          <div className="flex flex-col">
            {product.discountPriceCents ? (
              <>
                <span className="text-[9px] sm:text-[10px] tabular-nums text-base-content/50 line-through">
                  {formatPrice(product.priceCents, product.currency)}
                </span>
                <span className="text-[14px] sm:text-[17px] font-extrabold tabular-nums text-primary">
                  {formatPrice(product.discountPriceCents, product.currency)}
                </span>
              </>
            ) : (
              <p className="text-[14px] sm:text-[16px] font-bold text-base-content">
                {formatPrice(product.priceCents, product.currency)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm scale-90 sm:scale-100"
          >
            <PlusIcon className="size-3 sm:size-4" aria-hidden />
            <span>Add</span>
          </button>
        </div>

        {product.stock !== undefined && (
          <span className={`absolute bottom-1 right-2 text-[7px] sm:text-[9px] font-black uppercase tracking-tighter opacity-80 ${product.stock > 0 ? 'text-success' : 'text-error'}`}>
            {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
          </span>
        )}
      </div>
    </article>
  );
}
