import { Link } from "react-router";
import { ProductPageSkeleton } from "../components/LoadingSkeletons";
import { PageError } from "../components/PageError";
import { ProductImageSlider, getProductImages } from "../components/ProductImageSlider";
import { useProductPage } from "../hooks/useProductPage";
import { useCart } from "../store/cart";
import { useFavorites } from "../store/favorites";
import { ArrowLeftIcon, CheckIcon, HeartIcon, Share2Icon, ShoppingCartIcon } from "lucide-react";
import { formatPrice } from "../utils/format";
import { ProductReviews } from "../components/ProductReviews";

import toast from "react-hot-toast";

const HIGHLIGHTS = [
  "Secure checkout",
  "Support from your order after payment",
  "Specs listed for this catalog",
];

function ProductDetailPage() {
  const addItem = useCart((s) => s.addItem);
  const isFavorite = useFavorites((s) => s.isFavorite);
  const toggleFavorite = useFavorites((s) => s.toggleFavorite);
  const { product, isLoading, error } = useProductPage();

  const handleAdd = (product) => {
    addItem(product.id);
    toast.success(`Added ${product.name} to cart!`, {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const handleFavorite = (product) => {
    const added = toggleFavorite(product.id);
    toast.success(added ? "Product added to favorites" : "Product removed from favorites");
  };

  const handleShare = async (product) => {
    const images = getProductImages(product);
    const price = formatPrice(product.discountPriceCents || product.priceCents, product.currency);
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    const text = [
      product.name,
      `Price: ${price}`,
      images[0] ? `Image: ${images[0]}` : null,
      `Product link: ${productUrl}`,
      "Visit  https://the-emporium-corner.vercel.app/",
      "No. 116 Zaria Road, Rigasa Kaduna.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text,
          url: productUrl,
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Product details copied for sharing");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        toast.error("Could not share product");
      }
    }
  };

  if (isLoading) return <ProductPageSkeleton />;

  if (error || !product) {
    return <PageError message="Product not found." action={{ to: "/", label: "Back to shop" }} />;
  }

  const p = product;
  const category = p.category ?? "General";
  const favorite = isFavorite(p.id);

  return (
    <div className="product-detail-page">
      <nav className="breadcrumbs text-sm text-base-content/60">
        <ul>
          <li>
            <Link to="/">Shop</Link>
          </li>
          <li>
            <Link to={`/?category=${encodeURIComponent(category)}`}>{category}</Link>
          </li>
          <li className="text-base-content">{p.name}</li>
        </ul>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductImageSlider product={p} />

        <div className="flex flex-col text-left text-[70%] sm:text-base">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-primary badge-outline">{category}</span>
            <span className="text-xs font-mono text-base-content/45">{p.slug}</span>
            <button
              type="button"
              className={`btn btn-ghost btn-circle btn-xs ${favorite ? "text-primary" : "text-base-content/60"}`}
              onClick={() => handleFavorite(p)}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              title={favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <HeartIcon className={`size-4 ${favorite ? "fill-primary" : ""}`} aria-hidden />
            </button>
            {p.stock !== undefined && (
              <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-error'} text-white`}>
                {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-[1.3rem] font-bold tracking-tight text-base-content sm:text-3xl md:text-4xl">
            {p.name}
          </h1>

          {p.discountPriceCents ? (
            <div className="mt-3 flex flex-col">
              <span className="text-sm sm:text-xl font-bold tabular-nums text-base-content/50 line-through">
                {formatPrice(p.priceCents, p.currency)}
              </span>
              <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold tabular-nums text-primary">
                {formatPrice(p.discountPriceCents, p.currency)}
              </span>
            </div>
          ) : (
            <p className="mt-3 text-2xl sm:text-3xl font-bold tabular-nums text-primary md:text-4xl">
              {formatPrice(p.priceCents, p.currency)}
            </p>
          )}

          <p className="mt-6 text-[0.7rem] leading-relaxed text-base-content/85 sm:text-base">{p.description}</p>

          <ul className="mt-6 space-y-2 rounded-box border border-base-300 bg-base-200/50 p-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-base-content/80">
                <CheckIcon className="size-4 shrink-0 text-success" aria-hidden />
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleAdd(p)}
              className="btn btn-primary btn-sm sm:btn-lg gap-2 shadow-lg"
            >
              <ShoppingCartIcon className="size-5" aria-hidden />
              Add to cart
            </button>

            <button
              type="button"
              onClick={() => handleShare(p)}
              className="btn btn-outline btn-primary btn-sm sm:btn-lg gap-2"
            >
              <Share2Icon className="size-4" aria-hidden />
              Share
            </button>

            <Link to="/" className="btn btn-ghost btn-sm sm:btn-lg gap-2 border border-base-300">
              <ArrowLeftIcon className="size-4" aria-hidden />
              Continue shopping
            </Link>
          </div>
        </div>
      </div>

      <ProductReviews productSlug={p.slug} />
    </div>
  );
}

export default ProductDetailPage;
