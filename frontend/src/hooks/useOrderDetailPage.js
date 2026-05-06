import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { apiFetch } from "../lib/api.js";

export function useOrderDetailPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch(`/api/orders/${id}`, { getToken }),
    enabled: Boolean(id),
  });

  const { data: whatsappData, isLoading: isLoadingWhatsapp } = useQuery({
    queryKey: ["whatsapp"],
    queryFn: () => apiFetch(`/api/whatsapp/random-admin`, { getToken }),
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/orders/${id}/cancel`, {
        method: "POST",
        getToken,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/orders/${id}/complete`, {
        method: "POST",
        getToken,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  const order = data?.order ?? null;
  const items = data?.items ?? [];
  const paid = order?.status === "paid";
  const whatsappNumber = whatsappData?.whatsappNumber ?? "08133180063";

  return {
    id,
    order,
    items,
    paid,
    isLoading,
    error,
    whatsappNumber,
    isLoadingWhatsapp,
    cancelOrder: () => cancelOrderMutation.mutate(),
    isCancelling: cancelOrderMutation.isPending,
    completeOrder: () => completeOrderMutation.mutateAsync(),
    isCompleting: completeOrderMutation.isPending,
  };
}
