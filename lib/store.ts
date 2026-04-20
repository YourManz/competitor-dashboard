"use client"

import { create } from "zustand"
import type { AppState, CompanyProfile, Competitor } from "./types"
import { saveToStorage, loadFromStorage, clearStorage } from "./storage"

interface Store extends AppState {
  setCompany: (company: CompanyProfile) => void
  setCompetitors: (competitors: Competitor[]) => void
  updateCompetitor: (id: string, patch: Partial<Competitor>) => void
  setStatus: (status: AppState["status"], error?: string) => void

  setActiveCompetitor: (id: string | null) => void
  setActiveView: (view: AppState["activeView"]) => void
  reset: () => void
  hydrateFromStorage: () => boolean
}

const defaults: AppState = {
  company: null,
  competitors: [],
  status: "idle",
  error: null,
  activeCompetitorId: null,
  activeView: "map",
}

export const useStore = create<Store>((set, get) => ({
  ...defaults,

  setCompany: (company) => set({ company }),

  setCompetitors: (competitors) => {
    set({ competitors })
    const { company } = get()
    if (company) saveToStorage({ company, competitors })
  },

  updateCompetitor: (id, patch) => {
    const competitors = get().competitors.map((c) => (c.id === id ? { ...c, ...patch } : c))
    set({ competitors })
    const { company } = get()
    if (company) saveToStorage({ company, competitors })
  },

  setStatus: (status, error?: string) => set({ status, error: error ?? null }),

  setActiveCompetitor: (activeCompetitorId) => set({ activeCompetitorId }),

  setActiveView: (activeView) => set({ activeView }),

  reset: () => {
    clearStorage()
    set(defaults)
  },

  hydrateFromStorage: () => {
    const saved = loadFromStorage()
    if (!saved?.company || !saved.competitors.length) return false
    set({ ...saved, status: "done" })
    return true
  },
}))
