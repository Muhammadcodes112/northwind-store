import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFavorites = create(
  persist(
    (set, get) => ({
      productIds: [],

      isFavorite(productId) {
        return get().productIds.includes(productId);
      },

      addFavorite(productId) {
        if (get().productIds.includes(productId)) return;
        set({ productIds: [...get().productIds, productId] });
      },

      removeFavorite(productId) {
        set({ productIds: get().productIds.filter((id) => id !== productId) });
      },

      toggleFavorite(productId) {
        if (get().productIds.includes(productId)) {
          set({ productIds: get().productIds.filter((id) => id !== productId) });
          return false;
        }
        set({ productIds: [...get().productIds, productId] });
        return true;
      },
    }),
    { name: "emporium-favorites" },
  ),
);
