import { HeartIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { CatalogProductCard } from "../components/CatalogProductCard";
import { PageError } from "../components/PageError";
import { apiFetch } from "../lib/api";
import { useCart } from "../store/cart";
import { useFavorites } from "../store/favorites";

function FavoritesPage() {
  const favoriteIds = useFavorites((s) => s.productIds);
  const removeFavorite = useFavorites((s) => s.removeFavorite);
  const addItem = useCart((s) => s.addItem);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch("/api/products"),
  });

  const products = data?.products ?? [];
  const favoriteProducts = products.filter((product) => favoriteIds.includes(product.id));

  const handleAddToCart = (product) => {
    addItem(product.id);
    toast.success(`${product.name} added to cart`);
  };

  if (isLoading) {
    return (
      <div className="text-left">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <HeartIcon className="size-7 text-primary" aria-hidden />
          Favorites
        </h1>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i}>
              <div className="skeleton h-64 sm:h-96 w-full rounded-box" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error) {
    return <PageError message="Could not load favorites." action={{ to: "/", label: "Back to shop" }} />;
  }

  return (
    <div className="text-left">
      <h1 className="mb-2 flex items-center gap-2 text-2xl sm:text-3xl font-bold text-base-content">
        <HeartIcon className="size-8 text-primary fill-primary" aria-hidden />
        Favorites
      </h1>
      <p className="mb-6 text-xs sm:text-sm text-base-content/70">
        Products you saved for later.
      </p>

      {favoriteProducts.length === 0 ? (
        <div className="rounded-box border border-base-300 bg-base-100 py-14 text-center">
          <p className="text-base-content/70">No favorites yet.</p>
          <Link to="/" className="btn btn-primary btn-sm mt-4">
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {favoriteProducts.map((product) => (
            <li key={product.id} className="space-y-2">
              <CatalogProductCard product={product} />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-xs sm:btn-sm gap-1"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCartIcon className="size-3.5" aria-hidden />
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs sm:btn-sm gap-1 text-error hover:bg-error/10"
                  onClick={() => removeFavorite(product.id)}
                >
                  <Trash2Icon className="size-3.5" aria-hidden />
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FavoritesPage;
