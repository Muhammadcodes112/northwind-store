import { useSearchParams } from "react-router";
import { apiFetch } from "../lib/api.js";
import { useQuery } from "@tanstack/react-query";

export function useHomeCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category")?.trim() ?? "";

  const setCategory = (category) => {
    const next = new URLSearchParams(searchParams);

    if (!category) next.delete("category");
    else next.set("category", category);

    setSearchParams(next, { replace: true });
  };

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => apiFetch("/api/products/categories"),
  });

  const {
    data: productsData,
    isLoading: loadingList,
    error,
  } = useQuery({
    queryKey: ["products", categoryFilter],
    queryFn: () =>
      apiFetch(
        categoryFilter
          ? `/api/products?category=${encodeURIComponent(categoryFilter)}`
          : "/api/products",
      ),
  });

  const categories = categoriesData?.categories ?? [];
  let products = productsData?.products ?? [];
  const categoryChipsLoading = loadingCategories && categories.length === 0;

  const searchQuery = searchParams.get("q")?.trim() ?? "";

  const setSearchQuery = (q) => {
    const next = new URLSearchParams(searchParams);
    if (!q) next.delete("q");
    else next.set("q", q);
    setSearchParams(next, { replace: true });
  };

  if (searchQuery) {
    const lowerQ = searchQuery.toLowerCase();
    products = products.filter((p) => 
      p.name.toLowerCase().includes(lowerQ) || 
      (p.description && p.description.toLowerCase().includes(lowerQ)) ||
      (p.category && p.category.toLowerCase().includes(lowerQ))
    );
  }

  return {
    categoryFilter,
    setCategory,
    searchQuery,
    setSearchQuery,
    categories,
    products,
    categoryChipsLoading,
    loadingCategories,
    loadingList,
    error,
  };
}
