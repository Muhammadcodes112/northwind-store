import { CatalogProductCard } from "../components/CatalogProductCard";
import { HomeHero } from "../components/HomeHero";
import { PageError } from "../components/PageError";
import { TrustStrip } from "../components/TrustStrip";
import { useHomeCatalog } from "../hooks/useHomeCatalog";

function HomePage() {
  const {
    products,
    categoryChipsLoading,
    categoryFilter,
    error,
    loadingList,
    setCategory,
  } = useHomeCatalog();

  return (
    <div className="space-y-12">
      {/* CATALOG CHIPS ABOVE SLIDER */}
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-4 sm:px-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-base-content md:text-2xl uppercase font-mono">
            All Categories
          </h2>
        </div>

        <div className="flex flex-col sm:items-end gap-3 w-full max-w-[100vw] sm:max-w-[70%]">
          <div
            className="flex gap-4 overflow-x-auto whitespace-nowrap pb-2 w-full
            [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categoryChipsLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className="skeleton h-6 w-24 rounded-full"
                  aria-hidden
                />
              ))
            ) : (
              <>
                <button
                  type="button"
                  className={`text-[10.5px] sm:text-[12px] font-medium uppercase ${
                    !categoryFilter
                      ? "text-primary underline decoration-primary underline-offset-4"
                      : "text-base-content/70"
                  }`}
                  onClick={() => setCategory("")}
                >
                  ALL
                </button>

                {[
                  "PHARMACEUTICAL DRUGS",
                  "COSMETICS",
                  "BOUTIQUES",
                  "ACCESSORIES",
                  "KITCHEN UTENSILS",
                  "PHONES",
                  "CARS",
                  "INTERIOR DECORATION",
                  "OTHERS"
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`text-[10.5px] sm:text-[12px] font-medium uppercase ${
                      categoryFilter?.toUpperCase() === c
                        ? "text-primary underline decoration-primary underline-offset-4"
                        : "text-base-content/70"
                    }`}
                    onClick={() => setCategory(c.toLowerCase())}
                  >
                    {c}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <HomeHero products={products} loading={loadingList} />

      <section id="catolag" className="scroll-mt-24">

        {loadingList ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i}>
                <div className="skeleton h-64 sm:h-96 w-full rounded-box" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <PageError message="We couldn't load products. Please try again in a moment." />
        ) : products.length === 0 ? (
          <div className="rounded-box border border-base-300 bg-base-100 py-16 text-center text-base-content/60">
            No products in this category yet.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => (
              <li key={p.id}>
                <CatalogProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <TrustStrip />
    </div>
  );
}
export default HomePage;
