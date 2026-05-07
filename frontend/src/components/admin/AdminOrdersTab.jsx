import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { formatPrice } from "../../utils/format";
import { CheckCircleIcon, ClockIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router";

export function AdminOrdersTab({ getToken }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [confirmDialog, setConfirmDialog] = useState(null);

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
    <div className="space-y-6 text-[13px] sm:text-base">
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
              <th className="text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">Loading...</td>
              </tr>
            ) : displayedOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-base-content/50">
                  No {statusFilter} orders found
                </td>
              </tr>
            ) : (
              displayedOrders.map((order) => (
                <tr key={order.id}>
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
                  </td>
                  <td className="text-right">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="btn btn-sm btn-outline btn-primary rounded-full"
                    >
                      Read more
                    </Link>
                  </td>
                </tr>
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
