"use client";

import { create } from "zustand";
import type { FilterState, JobStatus } from "@/types";

interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: "system",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));

const defaultFilters: FilterState = {
  search: "",
  locationTypes: [],
  contractTypes: [],
  experienceLevels: [],
  salaryMin: null,
  salaryMax: null,
  technologies: [],
  sources: [],
  statuses: [],
  fitLabels: [],
  dateRange: [null, null],
  sortBy: "date",
  sortOrder: "desc",
};

interface FilterStateStore {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStateStore>((set) => ({
  filters: defaultFilters,
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

interface QuickStatusStore {
  updating: Record<string, boolean>;
  setUpdating: (id: string, val: boolean) => void;
}

export const useQuickStatusStore = create<QuickStatusStore>((set) => ({
  updating: {},
  setUpdating: (id, val) =>
    set((s) => ({ updating: { ...s.updating, [id]: val } })),
}));
