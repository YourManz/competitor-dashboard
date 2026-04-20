export interface CompanyProfile {
  name: string
  website: string
  city: string
  country: string
  industry: string
  description: string
  services: string[]
  targetMarket: string
  priceTier: "low" | "mid" | "premium"
}

export interface Competitor {
  id: string
  name: string
  website: string
  city: string
  country: string
  description: string
  services: string[]
  advantages: string[]
  positioning: string
  estimatedSize: "startup" | "smb" | "enterprise"
  overlapScore: number
  lat?: number
  lng?: number
}

export type LogLevel = "info" | "success" | "warn" | "error" | "dim"

export interface LogEntry {
  id: number
  ts: string
  level: LogLevel
  message: string
}

export interface AppState {
  company: CompanyProfile | null
  competitors: Competitor[]
  status: "idle" | "analyzing" | "geocoding" | "done" | "error"
  error: string | null
  activeCompetitorId: string | null
  activeView: "map" | "web"
  logs: LogEntry[]
}
