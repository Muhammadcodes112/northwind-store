import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Trash2Icon, UserPlusIcon, UsersIcon, ShieldAlertIcon } from "lucide-react";
import toast from "react-hot-toast";

export function AdminUsersTab({ getToken }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch("/api/admin/stats", { getToken }),
    refetchInterval: 5000,
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiFetch("/api/admin/users", { getToken }),
  });

  const addAdminMutation = useMutation({
    mutationFn: (emailArg) =>
      apiFetch("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify({ email: emailArg }),
        getToken,
      }),
    onSuccess: () => {
      toast.success("Admin role granted successfully");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
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
      toast.success("Admin role removed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
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

  const allUsers = usersData?.users || [];

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
          <h2 className="card-title text-xl mb-4">Manage Users & Roles</h2>
          
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="email"
              placeholder="User's email address"
              className="input input-bordered w-full sm:max-w-xs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={addAdminMutation.isPending || !email}
            >
              {addAdminMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <ShieldAlertIcon className="size-4" />
              )}
              Make Admin
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4">Loading...</td>
                  </tr>
                ) : allUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-base-content/50">No users found</td>
                  </tr>
                ) : (
                  allUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge badge-sm capitalize ${user.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="text-right">
                        {user.role === "admin" ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1"
                            onClick={() => {
                              if (window.confirm(`Remove admin rights from ${user.email}?`)) {
                                removeAdminMutation.mutate(user.id);
                              }
                            }}
                            disabled={removeAdminMutation.isPending && removeAdminMutation.variables === user.id}
                          >
                            {removeAdminMutation.isPending && removeAdminMutation.variables === user.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <Trash2Icon className="size-3" />
                            )}
                            Remove Admin
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 gap-1"
                            onClick={() => {
                              if (window.confirm(`Grant admin rights to ${user.email}?`)) {
                                addAdminMutation.mutate(user.email);
                              }
                            }}
                            disabled={addAdminMutation.isPending && addAdminMutation.variables === user.email}
                          >
                            {addAdminMutation.isPending && addAdminMutation.variables === user.email ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <UserPlusIcon className="size-3" />
                            )}
                            Make Admin
                          </button>
                        )}
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
