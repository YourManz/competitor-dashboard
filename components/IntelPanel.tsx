"use client"

import type { Intel, Competitor } from "@/lib/types"

const threatColors = {
  high:   { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    dot: "bg-red-400"    },
  medium: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-400" },
  low:    { bg: "bg-emerald-500/10",border: "border-emerald-500/30",text: "text-emerald-400",dot: "bg-emerald-400"},
}

interface Props {
  intel: Intel
  competitors: Competitor[]
  activeId: string | null
  onSelect: (id: string) => void
}

export default function IntelPanel({ intel, competitors, activeId, onSelect }: Props) {
  const activeAttack = intel.attackVectors.find((v) => v.id === activeId)

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 py-4 space-y-6">

      {/* Summary */}
      <section>
        <h2 className="text-xs text-white/30 uppercase tracking-widest mb-2">Market Overview</h2>
        <p className="text-sm text-white/80 leading-relaxed">{intel.summary}</p>
      </section>

      {/* Positioning recommendation */}
      <section className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
        <h2 className="text-xs text-indigo-400 uppercase tracking-widest mb-2">Positioning Recommendation</h2>
        <p className="text-sm text-white/85 leading-relaxed">{intel.positioningRec}</p>
      </section>

      <div className="grid grid-cols-2 gap-6">
        {/* Threat radar */}
        <section>
          <h2 className="text-xs text-white/30 uppercase tracking-widest mb-3">Threat Radar</h2>
          <div className="space-y-2">
            {intel.threats.map((t) => {
              const style = threatColors[t.level]
              const comp = competitors.find((c) => c.id === t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${style.bg} ${style.border} ${
                    activeId === t.id ? "ring-1 ring-white/20" : "hover:ring-1 hover:ring-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                    <span className="text-xs font-medium text-white">{t.name}</span>
                    <span className={`ml-auto text-[10px] uppercase tracking-wide ${style.text}`}>{t.level}</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed pl-3.5">{t.reason}</p>
                  {comp && (
                    <p className="text-[10px] text-white/25 mt-1 pl-3.5">{comp.city} · {Math.round(comp.overlapScore * 100)}% overlap</p>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* Market gaps */}
        <section>
          <h2 className="text-xs text-white/30 uppercase tracking-widest mb-3">Market Gaps</h2>
          <div className="space-y-2">
            {intel.gaps.map((gap, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <div className="flex gap-2">
                  <span className="text-emerald-400 flex-shrink-0 mt-0.5">◆</span>
                  <p className="text-xs text-white/70 leading-relaxed">{gap}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Attack vectors */}
      <section>
        <h2 className="text-xs text-white/30 uppercase tracking-widest mb-3">
          How to Beat Each Competitor
          {activeAttack && (
            <span className="ml-2 text-indigo-400 normal-case">— showing {activeAttack.name}</span>
          )}
        </h2>

        {/* Active competitor first, then the rest */}
        {(() => {
          const sorted = activeId
            ? [
                ...intel.attackVectors.filter((v) => v.id === activeId),
                ...intel.attackVectors.filter((v) => v.id !== activeId),
              ]
            : intel.attackVectors
          return (
            <div className="grid grid-cols-2 gap-3">
              {sorted.map((v) => {
                const comp = competitors.find((c) => c.id === v.id)
                const threat = intel.threats.find((t) => t.id === v.id)
                const isActive = v.id === activeId
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelect(v.id)}
                    className={`text-left rounded-xl border p-3 transition-all ${
                      isActive
                        ? "border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/20"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {threat && (
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${threatColors[threat.level].dot}`} />
                      )}
                      <span className="text-xs font-medium text-white">{v.name}</span>
                      {comp && (
                        <span className="ml-auto text-[10px] text-white/25">{comp.city}</span>
                      )}
                    </div>
                    <ul className="space-y-1.5">
                      {v.tactics.map((tactic, i) => (
                        <li key={i} className="flex gap-1.5 text-[11px] text-white/60 leading-relaxed">
                          <span className="text-indigo-400 flex-shrink-0 mt-0.5">›</span>
                          {tactic}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          )
        })()}
      </section>
    </div>
  )
}
