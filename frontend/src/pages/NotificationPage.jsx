import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { BellIcon, CheckCheckIcon, InboxIcon, Trash2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

function NotificationPage() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications", { getToken }),
    enabled: isSignedIn,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiFetch("/api/notifications/read-all", { method: "POST", getToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All marked as read");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/notifications/${id}/read`, { method: "POST", getToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [perm, setPerm] = useState(() => typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied');

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPerm(result);
        if (result === 'granted') {
          toast.success("Desktop & Mobile notifications enabled!");
        } else {
          toast.error("Notification permission " + result);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-10 px-4">
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-left">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BellIcon className="size-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            {unreadCount} unread updates
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
            className="btn btn-ghost btn-sm gap-2 text-primary hover:bg-primary/10"
          >
            <CheckCheckIcon className="size-4" />
            Mark all as read
          </button>
        )}
      </div>

      {perm === 'default' && (
        <div className="mb-6 alert alert-info bg-primary/10 border border-primary/20 text-base-content rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base">Get instant order updates</h3>
            <p className="text-xs sm:text-sm text-base-content/80 mt-0.5">Enable push notifications to receive updates in your notification center just like WhatsApp messages.</p>
          </div>
          <button onClick={requestNotificationPermission} className="btn btn-primary btn-sm shrink-0">
            Enable Notifications
          </button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <InboxIcon className="size-16 mb-4" />
            <p className="text-lg font-medium">Your inbox is empty</p>
            <p className="text-sm">We'll notify you when something important happens.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) markReadMutation.mutate(n.id);
                if (n.link) navigate(n.link);
              }}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
                n.read
                  ? "bg-base-100 border-base-200 opacity-70"
                  : "bg-base-100 border-primary/30 shadow-md ring-1 ring-primary/10"
              }`}
            >
              {!n.read && (
                <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
              )}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-sm sm:text-base ${!n.read ? 'text-primary' : ''}`}>
                      {n.title}
                    </h3>
                    <p className="mt-1 text-[13px] sm:text-sm text-base-content/80 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[11px] font-medium opacity-50 uppercase tracking-wider">
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  {!n.read && (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationPage;
