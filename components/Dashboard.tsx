"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useStore } from "@/lib/store"
import CompetitorCard from "./CompetitorCard"
import ActivityConsole from "./ActivityConsole"
import IntelPanel from "./IntelPanel"
import ChatPanel from "./ChatPanel"
import type { Competitor } from "@/lib/types"

const WebDiagram = dynamic(() => import("./WebDiagram"), { ssr: false })
const PositioningMatrix = dynamic(() => import("./PositioningMatrix"), { ssr: false })

const TABS = [
  { id: "matrix", label: "Positioning Matrix" },
  { id: "web",    label: "Web Diagram" },
  { id: "intel",  label: "Intel" },
] as const

export default function Dashboard() {
  const router = useRouter()
  const {
    company, competitors, intel, status, error,
    activeCompetitorId, activeView,
    setActiveCompetitor, setActiveView, reset, hydrateFromStorage,
  } = useStore()

  const [detailCompetitor, setDetailCompetitor] = useState<Competitor | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const cardStripRef = useRef<HTMLDivElement>(null)
  const isActive = status === "analyzing" || status === "geocoding" || status === "intel"

  useEffect(() => {
    if (!company) {
      const hydrated = hydrateFromStorage()
      if (!hydrated) router.replace("/")
    }
  }, [])

  useEffect(() => {
    if (activeCompetitorId) {
      setDetailCompetitor(competitors.find((c) => c.id === activeCompetitorId) ?? null)
      const el = cardStripRef.current?.querySelector(`[data-id="${activeCompetitorId}"]`)
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    } else {
      setDetailCompetitor(null)
    }
  }, [activeCompetitorId, competitors])

  if (!company) return null

  const handleSelect = (id: string) => {
    setActiveCompetitor(activeCompetitorId === id ? null : id)
  }

  const handleNewCompany = () => {
    reset()
    router.push("/")
  }

  const showCardStrip = activeView !== "intel" && competitors.length > 0
  const showDetailPanel = activeView !== "intel" && !!detailCompetitor

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ring-2 ${isActive ? "bg-indigo-400 ring-indigo-400/30 animate-pulse" : "bg-indigo-500 ring-indigo-500/30"}`} />
          <h1 className="font-semibold text-white">{company.name}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">{company.industry}</span>
          <span className="text-xs text-white/30">{company.city}, {company.country}</span>
        </div>
        <div className="flex items-center gap-3">
          {status === "done" && (
            <>
              <span className="text-xs text-white/25">{competitors.length} competitors</span>
              {intel && <span className="text-xs text-emerald-400/60">· intel ready</span>}
            </>
          )}
          {competitors.length > 0 && (
            <button
              onClick={() => setChatOpen((o) => !o)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                chatOpen
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                  : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1h10v7H6.5L4 10.5V8H1V1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Chat
            </button>
          )}
          <button
            onClick={handleNewCompany}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
          >
            New company
          </button>
        </div>
      </header>

      {/* Error banner */}
      {status === "error" && (
        <div className="px-6 py-2.5 bg-red-600/20 border-b border-red-500/20 flex-shrink-0">
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Activity console during analysis */}
      {isActive && (
        <div className="px-6 pt-3 flex-shrink-0">
          <ActivityConsole active />
        </div>
      )}

      {/* Body row: viz column + chat panel */}
      <div className="flex flex-1 min-h-0">
        {/* Left: tabs + viz + card strip */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 pb-0 flex-shrink-0">
            {TABS.map((tab) => {
              const disabled = tab.id === "intel" && !intel
              return (
                <button
                  key={tab.id}
                  onClick={() => !disabled && setActiveView(tab.id)}
                  disabled={disabled}
                  className={`px-4 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    activeView === tab.id
                      ? "bg-indigo-600 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab.label}
                  {tab.id === "intel" && !intel && status !== "intel" && (
                    <span className="ml-1.5 text-[10px] text-white/25">loading…</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Main content area */}
          <div className={`flex-1 min-h-0 ${activeView === "intel" ? "" : "px-6 pt-3 pb-2"}`}>
            {activeView === "intel" ? (
              intel ? (
                <IntelPanel
                  intel={intel}
                  competitors={competitors}
                  activeId={activeCompetitorId}
                  onSelect={handleSelect}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto mb-3" />
                    <p className="text-white/30 text-sm">Generating strategic intelligence…</p>
                  </div>
                </div>
              )
            ) : competitors.length > 0 ? (
              <div className="w-full h-full rounded-xl overflow-hidden border border-white/10">
                {activeView === "matrix" ? (
                  <PositioningMatrix
                    company={company}
                    competitors={competitors}
                    intel={intel}
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
                  {isActive ? "Researching competitors…" : "No data yet"}
                </p>
              </div>
            )}
          </div>{/* end main content area */}

          {/* Detail panel */}
          {showDetailPanel && (
            <div className="px-6 pb-2 flex-shrink-0">
              <div className="relative">
                <CompetitorCard competitor={detailCompetitor!} active />
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
          {showCardStrip && (
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
        </div>{/* end left column */}

        {/* Right: chat panel */}
        {chatOpen && (
          <div className="w-80 flex-shrink-0 border-l border-white/10">
            <ChatPanel onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>{/* end body row */}
    </div>
  )
}
