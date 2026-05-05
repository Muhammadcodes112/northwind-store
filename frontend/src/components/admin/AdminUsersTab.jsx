import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Trash2Icon, UserPlusIcon, UsersIcon } from "lucide-react";
import toast from "react-hot-toast";

export function AdminUsersTab({ getToken }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch("/api/admin/stats", { getToken }),
    refetchInterval: 5000,
  });

  const { data: adminsData, isLoading } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: () => apiFetch("/api/admin/admins", { getToken }),
  });

  const addAdminMutation = useMutation({
    mutationFn: (email) =>
      apiFetch("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify({ email }),
        getToken,
      }),
    onSuccess: () => {
      toast.success("Admin added successfully");
      setEmail("");
      queryClient.invalidateQueries(["admin", "admins"]);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add admin");
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: (id) =>
      apiFetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
        getToken,
      }),
    onSuccess: () => {
      toast.success("Admin removed successfully");
      queryClient.invalidateQueries(["admin", "admins"]);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove admin");
    },
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!email) return;
    addAdminMutation.mutate(email);
  };

  const admins = adminsData?.admins || [];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="stats shadow bg-base-100 border border-base-300 w-full md:w-auto">
        <div className="stat">
          <div className="stat-figure text-primary">
            <UsersIcon className="size-8" />
          </div>
          <div className="stat-title">Total Registered Users</div>
          <div className="stat-value text-primary">{stats?.userCount || 0}</div>
          <div className="stat-desc">Updates in real-time</div>
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Manage Admins</h2>
          
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="email"
              placeholder="User's email address"
              className="input input-bordered w-full sm:max-w-xs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={addAdminMutation.isPending}
            >
              {addAdminMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <UserPlusIcon className="size-4" />
              )}
              Add Admin
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">Loading...</td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-base-content/50">No admins found</td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className="font-medium">{admin.displayName || "-"}</td>
                      <td>{admin.email}</td>
                      <td>
                        <span className="badge badge-primary badge-sm capitalize">{admin.role}</span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1"
                          onClick={() => {
                            if (window.confirm(`Remove admin rights from ${admin.email}?`)) {
                              removeAdminMutation.mutate(admin.id);
                            }
                          }}
                          disabled={removeAdminMutation.isPending && removeAdminMutation.variables === admin.id}
                        >
                          {removeAdminMutation.isPending && removeAdminMutation.variables === admin.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <Trash2Icon className="size-3" />
                          )}
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
