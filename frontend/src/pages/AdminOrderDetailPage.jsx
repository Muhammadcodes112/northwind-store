import { useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { formatPrice } from "../utils/format";
import { CheckCircleIcon, ClockIcon, PackageIcon, AlertTriangleIcon } from "lucide-react";
import toast from "react-hot-toast";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { PageError } from "../components/PageError";

function AdminOrderDetailPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
  });

  const role = meData?.user?.role;

  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminOrder", id],
    queryFn: () => apiFetch(`/api/admin/orders/${id}`, { getToken }),
    enabled: Boolean(id),
  });

  const order = orderData?.order;

  const [confirmDialog, setConfirmDialog] = useState(null);

  const openConfirm = (status) => {
    setConfirmDialog({
      status,
      title: status === "completed" ? "Complete this order?" : "Revert order to pending?",
      description:
        status === "completed"
          ? "This marks the order as fulfilled. This action will also reduce product stock if not already done."
          : "This reopens the order and moves it back to the pending queue.",
    });
  };

  const updateStatusMutation = useMutation({
    mutationFn: (status) =>
      apiFetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        body: { status },
        getToken,
      }),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["adminOrder", id] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update order status");
    },
  });

  const statusBadgeClass = useMemo(() => {
    if (!order?.status) return "badge-warning";
    if (order.status === "completed") return "badge-success";
    if (order.status === "paid") return "badge-info";
    return "badge-warning";
  }, [order?.status]);

  if (role && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="text-left">
        <div className="skeleton mb-4 h-10 w-56" />
        <div className="skeleton mb-2 h-6 w-full" />
        <div className="skeleton mb-2 h-6 w-full" />
        <div className="skeleton mt-6 h-44 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return <PageError message="Order not found." action={{ to: "/admin", label: "Back" }} />;
  }

  const whatsappDigits = (order.user?.whatsappNumber ?? "")
    .toString()
    .replace(/[^\d]/g, "");
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null;

  return (
    <div className="text-left text-[13px] sm:text-base space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-base-300 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <PackageIcon className="size-6 text-primary" aria-hidden />
            <h1 className="text-xl sm:text-2xl font-bold">Order Details</h1>
          </div>
          <p className="mt-1 text-sm text-base-content/60">
            #{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge badge-lg capitalize ${statusBadgeClass}`}>{order.status}</span>

          <Link to="/admin" className="btn btn-ghost btn-sm">
            Back
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-base-300 pb-3 mb-4">
            <span className="font-mono text-sm opacity-80">Delivery Location</span>
          </div>
          <div className="text-sm leading-relaxed">{order.deliveryLocation || "Not provided"}</div>

          <div className="mt-6">
            <div className="flex items-center gap-2 border-b border-base-300 pb-3 mb-4">
              <span className="font-mono text-sm opacity-80">Products</span>
            </div>

            <div className="space-y-3">
              {(order.items ?? []).map((it) => {
                const product = it.product;
                const lineTotal = (it.unitPriceCents ?? 0) * (it.quantity ?? 0);
                return (
                  <div
                    key={it.id}
                    className="flex items-start gap-3 rounded-xl border border-base-300 bg-base-200/20 p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-base-300 bg-base-200/60">
                      {product?.imageUrl ? (
                        <img
                          src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.orderLineThumb)}
                          alt={product?.name ?? "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{product?.name || "Item"}</div>
                      <div className="mt-1 text-sm opacity-70">Qty: {it.quantity ?? 0}</div>
                      <div className="mt-1 text-sm font-medium">{formatPrice(lineTotal, "ngn")}</div>
                    </div>
                  </div>
                );
              })}
              {(order.items ?? []).length === 0 ? (
                <div className="rounded-xl border border-base-300 bg-base-200/20 p-4 text-sm text-base-content/60">
                  No products for this order.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-base-300 pb-3 mb-4">
              <div className="font-semibold">Customer</div>
              <div className="text-xs text-base-content/60">{order.user?.email || "No email"}</div>
            </div>

            <div className="text-sm opacity-80">
              <div>
                <span className="font-semibold">Email: </span>
                {order.user?.email || "Unknown"}
              </div>
              <div className="mt-2">
                <span className="font-semibold">Phone: </span>
                {order.user?.whatsappNumber || "Unknown"}
              </div>
            </div>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm w-full mt-4"
              >
                WhatsApp: {order.user?.whatsappNumber}
              </a>
            ) : null}
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-base-300 pb-3 mb-4">
              <div className="font-semibold">Total</div>
              <div className="text-lg font-bold tabular-nums">{formatPrice(order.totalCents, "ngn")}</div>
            </div>

            <div className="space-y-2">
              {order.status !== "completed" ? (
                <button
                  className="btn btn-success w-full gap-2 shadow-sm"
                  onClick={() => openConfirm("completed")}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircleIcon className="size-4" /> Complete Order
                </button>
              ) : (
                <button
                  className="btn btn-ghost w-full gap-2 border border-base-300 hover:bg-base-200"
                  onClick={() => openConfirm("pending")}
                  disabled={updateStatusMutation.isPending}
                >
                  <ClockIcon className="size-4" /> Revert to Pending
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmDialog && (
        <div className="modal modal-open bg-neutral/60 backdrop-blur-sm transition-all duration-300">
          <div className="modal-box max-w-md border border-base-300 shadow-2xl scale-in-center">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${confirmDialog.status === 'completed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                {confirmDialog.status === 'completed' ? <CheckCircleIcon className="size-6" /> : <ClockIcon className="size-6" />}
              </div>
              <h3 className="text-xl font-bold">{confirmDialog.title}</h3>
            </div>
            
            <p className="text-base-content/70 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="mt-6 flex flex-col gap-2 rounded-xl bg-base-200/50 p-4 border border-base-300/50">
              <div className="flex justify-between text-xs opacity-60 font-mono uppercase tracking-widest">
                <span>Order Summary</span>
                <span>ID: {order.id.slice(0, 8)}</span>
              </div>
              <div className="font-semibold text-lg">{formatPrice(order.totalCents, "ngn")}</div>
              <div className="text-sm opacity-80">{order.user?.email}</div>
            </div>

            <div className="modal-action gap-2">
              <button 
                className="btn btn-ghost flex-1" 
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                className={`btn flex-[1.5] ${confirmDialog.status === "completed" ? "btn-success" : "btn-warning"} shadow-lg`}
                onClick={() => {
                  updateStatusMutation.mutate(confirmDialog.status);
                  setConfirmDialog(null);
                }}
              >
                Confirm {confirmDialog.status === "completed" ? "Completion" : "Reversion"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setConfirmDialog(null)} />
        </div>
      )}
    </div>
  );
}

export default AdminOrderDetailPage;
