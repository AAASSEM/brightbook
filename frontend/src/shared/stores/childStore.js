import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useChildStore = create(
  persist(
    (set, get) => ({
      selectedChild: null,
      children: [],
      isChildLockActive: false,

      setChildren: (children) => set({ children }),

      setSelectedChild: (child) => set({ selectedChild: child }),

      setChildLock: (active) => set({ isChildLockActive: active }),

      // Add new child and automatically select them
      addChildAndSelect: (child) => set((state) => ({
        children: [...state.children, child],
        selectedChild: child
      })),

      // Update a child in the list and maintain selection if it's the selected child
      updateChild: (updatedChild) => set((state) => ({
        children: state.children.map(c => c.Child_ID === updatedChild.Child_ID ? updatedChild : c),
        selectedChild: state.selectedChild?.Child_ID === updatedChild.Child_ID ? updatedChild : state.selectedChild
      })),

      // Refresh children list from API and maintain current selection
      refreshChildren: async (api) => {
        try {
          const response = await api.get("/api/children/");
          const children = response.data;
          const currentSelectedId = get().selectedChild?.Child_ID;

          set({ children });

          // Keep the same child selected if they still exist, otherwise select first child
          if (currentSelectedId) {
            const stillExists = children.find(c => c.Child_ID === currentSelectedId);
            if (stillExists) {
              set({ selectedChild: stillExists });
            } else if (children.length > 0) {
              set({ selectedChild: children[0] });
            }
          } else if (children.length > 0) {
            set({ selectedChild: children[0] });
          }
        } catch (error) {
          console.error("Failed to refresh children:", error);
        }
      },

      clearChildren: () => set({ selectedChild: null, children: [] }),
    }),
    {
      name: "brightbook-children",
      partialize: (state) => ({
        selectedChild: state.selectedChild,
        children: state.children,
        isChildLockActive: state.isChildLockActive,
      }),
    }
  )
);
