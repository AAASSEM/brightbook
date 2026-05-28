import { create } from "zustand";

// Counter for ensuring unique IDs
let toastIdCounter = 0;

const generateUniqueId = () => {
  const timestamp = Date.now();
  const counter = toastIdCounter++;
  return `${timestamp}-${counter}`;
};

export const useUIStore = create((set) => ({
  toasts: [],
  modals: {},
  isLoading: false,

  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: generateUniqueId(), ...toast },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  openModal: (name, data = {}) =>
    set((state) => ({
      modals: { ...state.modals, [name]: { open: true, data } },
    })),

  closeModal: (name) =>
    set((state) => ({
      modals: { ...state.modals, [name]: { open: false, data: {} } },
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}));

// Helper to add toasts easily
export const toast = {
  success: (message) => useUIStore.getState().addToast({ type: "success", message }),
  error: (message) => useUIStore.getState().addToast({ type: "error", message }),
  info: (message) => useUIStore.getState().addToast({ type: "info", message }),
  warning: (message) => useUIStore.getState().addToast({ type: "warning", message }),
};
