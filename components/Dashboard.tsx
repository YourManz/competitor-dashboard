"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useStore } from "@/lib/store"
import CompetitorCard from "./CompetitorCard"
import type { Competitor } from "@/lib/types"

const MapView = dynamic(() => import("./MapView"), { ssr: false })
const WebDiagram = dynamic(() => import("./WebDiagram"), { ssr: false })

export default function Dashboard() {
  const router = useRouter()
  const { company, competitors, status, error, activeCompetitorId, activeView, setActiveCompetitor, setActiveView, reset, hydrateFromStorage } = useStore()
  const [detailCompetitor, setDetailCompetitor] = useState<Competitor | null>(null)
  const cardStripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!company) {
      const hydrated = hydrateFromStorage()
      if (!hydrated) router.replace("/")
    }
  }, [])

  useEffect(() => {
    if (activeCompetitorId) {
      setDetailCompetitor(competitors.find((c) => c.id === activeCompetitorId) ?? null)
      // Scroll card strip to active card
      const el = cardStripRef.current?.querySelector(`[data-id="${activeCompetitorId}"]`)
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    } else {
      setDetailCompetitor(null)
    }
  }, [activeCompetitorId, competitors])

  if (!company) return null

  const companyWithGeo = {
    ...company,
    lat: (competitors[0]?.lat != null) ? (company as typeof company & { lat?: number }).lat : undefined,
    lng: (company as typeof company & { lng?: number }).lng,
  }

  const handleSelect = (id: string) => {
    setActiveCompetitor(activeCompetitorId === id ? null : id)
  }

  const handleNewCompany = () => {
    reset()
    router.push("/")
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/30" />
          <h1 className="font-semibold text-white">{company.name}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">{company.industry}</span>
          <span className="text-xs text-white/30">{company.city}, {company.country}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "done" && (
            <span className="text-xs text-white/30">{competitors.length} competitors</span>
          )}
          <button
            onClick={handleNewCompany}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
          >
            New company
          </button>
        </div>
      </header>

      {/* Status banners */}
      {(status === "analyzing" || status === "geocoding") && (
        <div className="flex items-center gap-3 px-6 py-2.5 bg-indigo-600/20 border-b border-indigo-500/20 flex-shrink-0">
          <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          <span className="text-sm text-indigo-300">
            {status === "analyzing" ? "Claude is researching competitors…" : "Resolving locations on map…"}
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="px-6 py-2.5 bg-red-600/20 border-b border-red-500/20 flex-shrink-0">
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex items-center gap-1 px-6 pt-3 pb-0 flex-shrink-0">
        {(["map", "web"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              activeView === v
                ? "bg-indigo-600 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {v === "map" ? "Map View" : "Web Diagram"}
          </button>
        ))}
      </div>

      {/* Main visualization */}
      <div className="flex-1 px-6 pt-3 pb-2 min-h-0">
        {competitors.length > 0 ? (
          <div className="w-full h-full rounded-xl overflow-hidden border border-white/10">
            {activeView === "map" ? (
              <MapView
                company={companyWithGeo}
                competitors={competitors}
                activeId={activeCompetitorId}
                onSelect={handleSelect}
              />
            ) : (
              <WebDiagram
                company={company}
                competitors={competitors}
                activeId={activeCompetitorId}
                onSelect={handleSelect}
              />
            )}
          </div>
        ) : (
          <div className="w-full h-full rounded-xl border border-white/10 flex items-center justify-center">
            <p className="text-white/20 text-sm">
              {status === "analyzing" ? "Building competitor map…" : "No data yet"}
            </p>
          </div>
        )}
      </div>

      {/* Detail panel for active competitor */}
      {detailCompetitor && (
        <div className="px-6 pb-2 flex-shrink-0">
          <div className="relative">
            <CompetitorCard competitor={detailCompetitor} active />
            <button
              onClick={() => setActiveCompetitor(null)}
              className="absolute top-3 right-3 text-white/30 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Card strip */}
      {competitors.length > 0 && (
        <div
          ref={cardStripRef}
          className="flex gap-2 overflow-x-auto px-6 pb-4 flex-shrink-0 scrollbar-hide"
        >
          {competitors.map((c) => (
            <div key={c.id} data-id={c.id}>
              <CompetitorCard
                competitor={c}
                compact
                active={c.id === activeCompetitorId}
                onClick={() => handleSelect(c.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
