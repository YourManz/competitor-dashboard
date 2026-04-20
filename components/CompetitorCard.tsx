"use client"

import type { Competitor } from "@/lib/types"

const sizeLabel = { startup: "Startup", smb: "SMB", enterprise: "Enterprise" }
const sizeColor = {
  startup: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  smb: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  enterprise: "bg-purple-500/20 text-purple-300 border-purple-500/30",
}

interface Props {
  competitor: Competitor
  active?: boolean
  onClick?: () => void
  compact?: boolean
}

export default function CompetitorCard({ competitor: c, active, onClick, compact }: Props) {
  const overlapPct = Math.round(c.overlapScore * 100)

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex-shrink-0 w-52 text-left rounded-xl border p-3 transition-all cursor-pointer ${
          active
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm text-white truncate">{c.name}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${sizeColor[c.estimatedSize]}`}
          >
            {sizeLabel[c.estimatedSize]}
          </span>
        </div>
        <p className="text-xs text-white/50 truncate">{c.city}, {c.country}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex-1 h-1 rounded-full bg-white/10">
            <div
              className="h-1 rounded-full bg-indigo-400"
              style={{ width: `${overlapPct}%` }}
            />
          </div>
          <span className="text-[10px] text-white/40">{overlapPct}%</span>
        </div>
      </button>
    )
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        active ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-white">{c.name}</h3>
          <p className="text-xs text-white/50">{c.city}, {c.country}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${sizeColor[c.estimatedSize]}`}
        >
          {sizeLabel[c.estimatedSize]}
        </span>
      </div>

      <p className="text-sm text-white/70 mb-3">{c.positioning}</p>

      {c.website && (
        <a
          href={c.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 mb-3 block truncate"
        >
          {c.website.replace(/^https?:\/\//, "")}
        </a>
      )}

      <div className="mb-3">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Advantages</p>
        <ul className="space-y-0.5">
          {c.advantages.map((a, i) => (
            <li key={i} className="text-xs text-white/70 flex gap-1.5">
              <span className="text-indigo-400 flex-shrink-0">›</span>
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">Overlap</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-indigo-400 transition-all"
            style={{ width: `${overlapPct}%` }}
          />
        </div>
        <span className="text-xs text-white/50">{overlapPct}%</span>
      </div>
    </div>
  )
}
