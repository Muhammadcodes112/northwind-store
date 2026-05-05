import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api.js";
import { Navigate } from "react-router";
import { LayoutDashboardIcon, PackageIcon, ShoppingCartIcon, UsersIcon } from "lucide-react";
import { AdminProductsTab } from "../components/admin/AdminProductsTab.jsx";
import { AdminUsersTab } from "../components/admin/AdminUsersTab.jsx";
import { AdminOrdersTab } from "../components/admin/AdminOrdersTab.jsx";

function AdminProductsPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("products");

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
  });

  if (meData && meData.user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="text-left space-y-6">
      <div className="flex items-center gap-3 border-b border-base-300 pb-4">
        <LayoutDashboardIcon className="size-8 text-secondary" />
        <div>
          <h1 className="text-2xl font-bold text-base-content">Admin Dashboard</h1>
          <p className="text-sm text-base-content/60">Manage Emporium Corner store</p>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-boxed bg-base-200/50 w-fit">
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "products" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <PackageIcon className="size-4" /> Products
        </button>
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <UsersIcon className="size-4" /> Users & Admins
        </button>
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "orders" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingCartIcon className="size-4" /> Orders
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "products" && <AdminProductsTab getToken={getToken} />}
        {activeTab === "users" && <AdminUsersTab getToken={getToken} />}
        {activeTab === "orders" && <AdminOrdersTab getToken={getToken} />}
      </div>
    </div>
  );
}

export default AdminProductsPage;
