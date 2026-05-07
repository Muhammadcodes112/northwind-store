import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import toast from "react-hot-toast";
import { MailIcon, MapPinIcon, PhoneCallIcon } from "lucide-react";

function AccountPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
  });

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    if (data?.user) {
      setPhone(data.user.whatsappNumber ?? "");
      setEmail(data.user.email ?? "");
      setDeliveryAddress(data.user.deliveryAddress ?? "");
    }
  }, [data]);

  const savePhoneMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/me", {
        method: "PATCH",
        body: { whatsappNumber: phone.trim() },
        getToken,
      }),
    onSuccess: () => {
      toast.success("Phone number updated.");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => toast.error(err.message || "Could not update phone number."),
  });

  const saveEmailMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/me", {
        method: "PATCH",
        body: { email: email.trim() },
        getToken,
      }),
    onSuccess: () => {
      toast.success("Email updated.");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => toast.error(err.message || "Could not update email."),
  });

  const saveAddressMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/me", {
        method: "PATCH",
        body: { deliveryAddress: deliveryAddress.trim() },
        getToken,
      }),
    onSuccess: () => {
      toast.success("Delivery address updated.");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => toast.error(err.message || "Could not update delivery address."),
  });

  const currentPhone = data?.user?.whatsappNumber ?? "";

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <PhoneCallIcon className="size-5 text-primary" /> Manage Account
      </h1>
      <p className="mt-2 text-sm text-base-content/70">
        Add or edit your phone number so payments and order support can proceed smoothly.
      </p>

      <div className="mt-5 space-y-2">
        <label className="label p-0">
          <span className="label-text">Phone / WhatsApp number</span>
        </label>
        <input
          className="input input-bordered w-full"
          placeholder="e.g. 08012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {isLoading ? null : currentPhone ? (
          <p className="text-xs text-base-content/60">Current: {currentPhone}</p>
        ) : (
          <p className="text-xs text-warning">No phone number added yet.</p>
        )}
      </div>

      <button
        className="btn btn-primary mt-5"
        onClick={() => savePhoneMutation.mutate()}
        disabled={savePhoneMutation.isPending || !phone.trim()}
      >
        {savePhoneMutation.isPending ? "Saving..." : "Save number"}
      </button>

      <div className="mt-8 space-y-2">
        <label className="label p-0">
          <span className="label-text flex items-center gap-2">
            <MailIcon className="size-4 text-primary" /> Account email (single email only)
          </span>
        </label>
        <input
          type="email"
          className="input input-bordered w-full"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-base-content/60">
          You can update this email, but only one email is kept on the account.
        </p>
      </div>

      <button
        className="btn btn-secondary mt-4"
        onClick={() => saveEmailMutation.mutate()}
        disabled={saveEmailMutation.isPending || !email.trim()}
      >
        {saveEmailMutation.isPending ? "Saving..." : "Save email"}
      </button>

      <div className="mt-8 space-y-2">
        <label className="label p-0">
          <span className="label-text flex items-center gap-2">
            <MapPinIcon className="size-4 text-primary" /> Delivery address
          </span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full min-h-24"
          placeholder="Enter your delivery address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
        />
      </div>

      <button
        className="btn btn-accent mt-4"
        onClick={() => saveAddressMutation.mutate()}
        disabled={saveAddressMutation.isPending || !deliveryAddress.trim()}
      >
        {saveAddressMutation.isPending ? "Saving..." : "Save delivery address"}
      </button>
    </div>
  );
}

export default AccountPage;

