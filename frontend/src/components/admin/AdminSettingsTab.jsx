import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import toast from "react-hot-toast";

// eslint-disable-next-line react/prop-types
export function AdminSettingsTab({ getToken }) {
  const queryClient = useQueryClient();
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const { data: meData, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
  });

  useEffect(() => {
    if (meData?.user?.whatsappNumber) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWhatsappNumber(meData.user.whatsappNumber);
    }
  }, [meData]);

  const updateWhatsAppMutation = useMutation({
    mutationFn: async (number) => {
      return apiFetch("/api/whatsapp/me", {
        method: "PATCH",
        getToken,
        body: { whatsappNumber: number },
      });
    },
    onSuccess: () => {
      toast.success("WhatsApp number updated successfully");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update WhatsApp number");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateWhatsAppMutation.mutate(whatsappNumber);
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Personal Admin Settings</h2>
          <p className="text-sm text-base-content/70">
            Set your WhatsApp number to receive payment receipts from customers.
            If multiple admins set their numbers, the system will randomly select one for each customer.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">WhatsApp Number</span>
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 08133180063 or 2348133180063"
                className="input input-bordered w-full"
                required
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Include country code for best results (e.g. 234)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={updateWhatsAppMutation.isPending}
              className="btn btn-primary"
            >
              {updateWhatsAppMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
