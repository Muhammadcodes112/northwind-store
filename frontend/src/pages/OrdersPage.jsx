import { ChevronRightIcon, PackageIcon } from "lucide-react";
import { OrdersListSkeleton } from "../components/LoadingSkeletons";
import { PageError } from "../components/PageError";
import useOrdersPage from "../hooks/useOrdersPage";
import { Link } from "react-router";
import { OrderPreview } from "../components/OrderPreview";
import { formatOrderWhen, formatPrice } from "../utils/format";

function OrdersPage() {
  const { isLoading, error, orders, staff } = useOrdersPage();
  const pendingOrders = orders.filter((o) => o.status !== "completed");
  const completedOrders = orders.filter((o) => o.status === "completed");

  const renderOrders = (list) => (
    <ul className="space-y-4">
      {list.map((o) => {
        const previewItems = o.previewItems ?? [];
        const totalUnits = previewItems.reduce((sum, row) => sum + row.quantity, 0);
        const lineCount = previewItems.length;
        const summary =
          lineCount === 0
            ? "No line items"
            : lineCount === 1
              ? `${totalUnits} ${totalUnits === 1 ? "item" : "items"}`
              : `${lineCount} products · ${totalUnits} items`;

        return (
          <li key={o.id}>
            <Link
              to={`/orders/${o.id}`}
              className="group card border border-base-300 bg-base-100 shadow-sm transition hover:border-primary/45 hover:shadow-md"
            >
              <div className="card-body flex-row flex-wrap items-center gap-4 py-4 sm:py-5 sm:gap-5">
                <OrderPreview items={previewItems} />

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-base-content/55 sm:text-sm">
                      {o.id.slice(0, 8)}…
                    </span>

                    <span
                      className={`badge badge-sm capitalize ${
                        o.status === "completed" || o.status === "paid"
                          ? "badge-success"
                          : o.status === "pending"
                            ? "badge-warning"
                            : "badge-error"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>

                  <p className="mt-1 text-xs sm:text-sm text-base-content/60">
                    {formatOrderWhen(o.createdAt)}
                  </p>

                  <p className="mt-2 text-xs sm:text-sm text-base-content/75">{summary}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-base-content/50">
                      Total
                    </p>
                    <p className="text-base sm:text-xl font-bold tabular-nums text-base-content">
                      {formatPrice(o.totalCents, "usd")}
                    </p>
                  </div>
                  <ChevronRightIcon
                    className="size-5 shrink-0 text-base-content/40 transition group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (isLoading) {
    return (
      <div className="text-left">
        <div className="skeleton mb-2 h-10 w-64 max-w-full" />
        <div className="skeleton mb-8 h-4 w-96 max-w-full" />
        <OrdersListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <PageError message="Could not load orders." action={{ to: "/", label: "Back to shop" }} />
    );
  }

  return (
    <div className="text-left">
      <h1 className="mb-2 flex items-center gap-2 text-2xl sm:text-3xl font-bold text-base-content">
        <PackageIcon className="size-8 text-primary" aria-hidden />
        {staff ? "Orders" : "Your orders"}
      </h1>

      <p className="mb-6 sm:mb-8 text-xs sm:text-sm text-base-content/70">
        {staff
          ? "All store orders. Open one for customer support chat."
          : "Open an order to track payment and support updates."}
      </p>

      {orders.length === 0 ? (
        <p className="text-base-content/70">
          No orders yet.{" "}
          <Link to="/" className="link link-primary">
            Browse the shop
          </Link>
        </p>
      ) : staff ? (
        renderOrders(orders)
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-base-content">Pending Orders</h2>
              <span className="badge badge-warning badge-sm">{pendingOrders.length}</span>
            </div>
            {pendingOrders.length > 0 ? (
              renderOrders(pendingOrders)
            ) : (
              <p className="text-xs sm:text-sm text-base-content/60">No pending orders.</p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-base-content">Completed Orders</h2>
              <span className="badge badge-success badge-sm">{completedOrders.length}</span>
            </div>
            {completedOrders.length > 0 ? (
              renderOrders(completedOrders)
            ) : (
              <p className="text-xs sm:text-sm text-base-content/60">No completed orders yet.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
export default OrdersPage;
