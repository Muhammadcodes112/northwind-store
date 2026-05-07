import { Fragment, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { formatPrice } from "../../utils/format";
import { IK_PRESETS, imageKitOptimizedUrl } from "../../lib/imagekitUrl.js";
import { CheckCircleIcon, ClockIcon } from "lucide-react";
import toast from "react-hot-toast";

export function AdminOrdersTab({ getToken }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => apiFetch("/api/admin/orders", { getToken }),
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      apiFetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        body: { status },
        getToken,
      }),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update order status");
    },
  });

  const orders = ordersData?.orders || [];
  
  // Pending orders include anything not 'completed' or 'failed'
  // But wait, user said "orders should have status as pending and can be marked as completed". 
  // Let's filter pending as 'pending' or 'paid'.
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "paid");
  const completedOrders = orders.filter(o => o.status === "completed");

  const totalSalesCents = completedOrders.reduce((sum, o) => sum + o.totalCents, 0);

  const displayedOrders = statusFilter === "pending" ? pendingOrders : completedOrders;

  const getWhatsAppUrl = (rawPhone) => {
    const digits = (rawPhone ?? "").toString().replace(/[^\d]/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}`;
  };

  const openConfirm = (order, status) => {
    setConfirmDialog({
      order,
      status,
      title: status === "completed" ? "Complete this order?" : "Move order back to pending?",
      description:
        status === "completed"
          ? "This marks the order as fulfilled for operations tracking."
          : "This reopens the order so it appears in pending queue again.",
    });
  };

  return (
    <div className="space-y-6">
      {statusFilter === "completed" && (
        <div className="stats shadow bg-base-100 border border-base-300 w-full md:w-auto">
          <div className="stat">
            <div className="stat-figure text-success">
              <CheckCircleIcon className="size-8" />
            </div>
            <div className="stat-title">Total Completed Sales</div>
            <div className="stat-value text-success">{formatPrice(totalSalesCents, "ngn")}</div>
            <div className="stat-desc">Calculated in real-time</div>
          </div>
        </div>
      )}

      <div className="tabs tabs-bordered w-full">
        <button
          className={`tab tab-lg ${statusFilter === "pending" ? "tab-active font-bold" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          Pending Orders <span className="badge badge-sm ml-2">{pendingOrders.length}</span>
        </button>
        <button
          className={`tab tab-lg ${statusFilter === "completed" ? "tab-active font-bold" : ""}`}
          onClick={() => setStatusFilter("completed")}
        >
          Completed Orders <span className="badge badge-sm ml-2">{completedOrders.length}</span>
        </button>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Location</th>
              <th>Total</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">Loading...</td>
              </tr>
            ) : displayedOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-base-content/50">
                  No {statusFilter} orders found
                </td>
              </tr>
            ) : (
              displayedOrders.map((order) => (
                <Fragment key={order.id}>
                  <tr>
                    <td className="font-mono text-sm">{order.id.slice(0, 8)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="text-xs">{order.user?.email || "No email"}</div>
                      <div className="text-xs opacity-60">{order.user?.whatsappNumber || "No phone"}</div>
                    </td>
                    <td className="max-w-44 truncate" title={order.deliveryLocation || ""}>
                      {order.deliveryLocation || "Not provided"}
                    </td>
                    <td className="font-medium">{formatPrice(order.totalCents, "ngn")}</td>
                    <td>
                      <span
                        className={`badge badge-sm capitalize ${
                          order.status === "completed"
                            ? "badge-success"
                            : order.status === "paid"
                              ? "badge-info"
                              : "badge-warning"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        {order.status !== "completed" ? (
                          <button
                            className="btn btn-sm btn-success gap-1"
                            onClick={() => openConfirm(order, "completed")}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircleIcon className="size-4" /> Complete
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-ghost gap-1"
                            onClick={() => openConfirm(order, "pending")}
                            disabled={updateStatusMutation.isPending}
                          >
                            <ClockIcon className="size-4" /> Revert
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() =>
                            setExpandedOrderId((prev) => (prev === order.id ? null : order.id))
                          }
                        >
                          {expandedOrderId === order.id ? "Hide" : "Read more"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedOrderId === order.id ? (
                    <tr>
                      <td colSpan={7} className="bg-base-200/30 p-4">
                        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="font-mono text-sm opacity-80">
                                Order #{order.id.slice(0, 8)}
                              </div>
                              <div className="mt-1 text-lg font-bold">Order Details</div>
                              <div className="mt-1 text-sm text-base-content/70">
                                {new Date(order.createdAt).toLocaleString()}
                              </div>
                              <div className="mt-2 text-sm">
                                <span className="font-semibold">Location: </span>
                                {order.deliveryLocation || "Not provided"}
                              </div>
                              <div className="mt-1 text-sm">
                                <span className="font-semibold">Total: </span>
                                {formatPrice(order.totalCents, "ngn")}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 items-start sm:items-end">
                              <div className="badge badge-sm capitalize">
                                {order.status}
                              </div>

                              {order.user ? (
                                (() => {
                                  const wa = getWhatsAppUrl(order.user.whatsappNumber);
                                  return wa ? (
                                    <a
                                      href={wa}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-primary btn-sm gap-2"
                                    >
                                      WhatsApp: {order.user.whatsappNumber || "Customer"}
                                    </a>
                                  ) : (
                                    <span className="text-xs text-base-content/60">No phone on record.</span>
                                  );
                                })()
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold">Customer</div>
                              <div className="rounded-lg border border-base-300 bg-base-200/40 p-3">
                                <div className="text-sm">
                                  <span className="font-semibold">Email: </span>
                                  {order.user?.email || "Unknown"}
                                </div>
                                <div className="mt-1 text-sm">
                                  <span className="font-semibold">Phone: </span>
                                  {order.user?.whatsappNumber || "Unknown"}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold">Actions</div>
                              <div className="flex flex-wrap gap-2">
                                {order.status !== "completed" ? (
                                  <button
                                    className="btn btn-success btn-sm gap-1"
                                    onClick={() => openConfirm(order, "completed")}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <CheckCircleIcon className="size-4" /> Complete
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-ghost btn-sm gap-1"
                                    onClick={() => openConfirm(order, "pending")}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <ClockIcon className="size-4" /> Revert
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="mb-3 text-sm font-semibold">Products</div>
                            <div className="space-y-2">
                              {(order.items ?? []).length === 0 ? (
                                <div className="rounded-lg border border-base-300 bg-base-200/40 p-3 text-sm text-base-content/60">
                                  No items found for this order.
                                </div>
                              ) : (
                                (order.items ?? []).map((it) => {
                                  const product = it.product;
                                  const lineTotalCents = (it.unitPriceCents ?? 0) * (it.quantity ?? 0);
                                  return (
                                    <div
                                      key={it.id}
                                      className="flex items-start gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
                                    >
                                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-base-300 bg-base-200/50">
                                        {product?.imageUrl ? (
                                          <img
                                            src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.adminThumb)}
                                            alt={product?.name ?? "Product"}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="h-full w-full" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-semibold truncate">{product?.name || "Item"}</div>
                                        <div className="text-sm opacity-70">Qty: {it.quantity ?? 0}</div>
                                        <div className="text-sm font-medium">{formatPrice(lineTotalCents, "ngn")}</div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmDialog ? (
        <div className="modal modal-open bg-neutral/70 backdrop-blur-sm">
          <div className="modal-box max-w-md">
            <h3 className="text-lg font-bold">{confirmDialog.title}</h3>
            <p className="mt-2 text-sm text-base-content/70">{confirmDialog.description}</p>
            <div className="mt-3 rounded-lg border border-base-300 p-3 text-sm">
              <p className="font-mono">Order #{confirmDialog.order.id.slice(0, 8)}</p>
              <p className="mt-1">{confirmDialog.order.user?.email || "No email"}</p>
              <p className="text-base-content/60">{confirmDialog.order.deliveryLocation || "No location provided"}</p>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button
                className={`btn ${confirmDialog.status === "completed" ? "btn-success" : "btn-warning"}`}
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: confirmDialog.order.id,
                    status: confirmDialog.status,
                  });
                  setConfirmDialog(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
