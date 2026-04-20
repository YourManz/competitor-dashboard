import type { AppState } from "./types"

const KEY = "competitor-intel-last"

export function saveToStorage(state: Pick<AppState, "company" | "competitors">) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

export function loadFromStorage(): Pick<AppState, "company" | "competitors"> | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
