import { create } from "zustand"
import type { HuntListItem } from "../types/artifact"

interface HuntListState {
  items: HuntListItem[]
  editingId: string | null
  modalOpen: boolean
  addItem: (item: HuntListItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, item: HuntListItem) => void
  openModal: (editId?: string) => void
  closeModal: () => void
}

export const useHuntList = create<HuntListState>((set) => ({
  items: [],
  editingId: null,
  modalOpen: false,

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  updateItem: (id, item) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? item : i)),
    })),

  openModal: (editId) =>
    set({ modalOpen: true, editingId: editId ?? null }),

  closeModal: () =>
    set({ modalOpen: false, editingId: null }),
}))
