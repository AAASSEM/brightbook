import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useChildStore } from "./childStore";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,

      login: (userData, accessToken, refreshToken) =>
        set({ user: userData, accessToken, refreshToken, role: userData.role }),

      updateUser: (data) =>
        set((state) => ({ user: { ...state.user, ...data } })),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, role: null });
        useChildStore.getState().clearChildren();
      },

      isAuthenticated: () => !!get().accessToken,
      isParent: () => get().role === "parent",
      isAdmin: () => get().role === "admin",
      isChild: () => get().role === "child",
    }),
    {
      name: "brightbook-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        role: state.role,
      }),
    }
  )
);
