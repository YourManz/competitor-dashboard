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
  // Positioning matrix axes (0–1)
  priceScore: number          // 0=budget → 1=premium
  specializationScore: number // 0=niche → 1=broad generalist
  techScore: number           // 0=traditional → 1=tech-forward
  reachScore: number          // 0=local → 1=national/global
  lat?: number
  lng?: number
}

export interface ThreatEntry {
  id: string
  name: string
  level: "high" | "medium" | "low"
  reason: string
}

export interface AttackVector {
  id: string
  name: string
  tactics: string[]
}

export interface Intel {
  summary: string
  companyScores: {
    priceScore: number
    specializationScore: number
    techScore: number
    reachScore: number
  }
  threats: ThreatEntry[]
  gaps: string[]
  attackVectors: AttackVector[]
  positioningRec: string
}

export type LogLevel = "info" | "success" | "warn" | "error" | "dim"

export interface LogEntry {
  id: number
  ts: string
  level: LogLevel
  message: string
}

export type ActiveView = "matrix" | "web" | "intel"

export interface AppState {
  company: CompanyProfile | null
  competitors: Competitor[]
  intel: Intel | null
  status: "idle" | "analyzing" | "geocoding" | "intel" | "done" | "error"
  error: string | null
  activeCompetitorId: string | null
  activeView: ActiveView
  logs: LogEntry[]
}
