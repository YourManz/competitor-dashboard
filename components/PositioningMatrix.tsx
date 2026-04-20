"use client"

import { useState, useRef, useEffect } from "react"
import type { Competitor, CompanyProfile, Intel } from "@/lib/types"

type Axis = "priceScore" | "specializationScore" | "techScore" | "reachScore"

const AXIS_META: Record<Axis, { label: string; low: string; high: string }> = {
  priceScore:          { label: "Price",          low: "Budget",      high: "Premium"    },
  specializationScore: { label: "Specialization", low: "Niche",       high: "Generalist" },
  techScore:           { label: "Tech Level",     low: "Traditional", high: "Digital"    },
  reachScore:          { label: "Market Reach",   low: "Local",       high: "National"   },
}

const SIZE_R = { startup: 10, smb: 15, enterprise: 21 }

interface Props {
  company: CompanyProfile
  competitors: Competitor[]
  intel: Intel | null
  activeId: string | null
  onSelect: (id: string) => void
}

export default function PositioningMatrix({ company, competitors, intel, activeId, onSelect }: Props) {
  const [xAxis, setXAxis] = useState<Axis>("priceScore")
  const [yAxis, setYAxis] = useState<Axis>("specializationScore")
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; desc: string } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dims, setDims] = useState({ w: 600, h: 440 })

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const r = svgRef.current.getBoundingClientRect()
        setDims({ w: r.width, h: r.height })
      }
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const PAD = { top: 40, right: 40, bottom: 56, left: 56 }
  const plotW = dims.w - PAD.left - PAD.right
  const plotH = dims.h - PAD.top - PAD.bottom

  const px = (v: number) => PAD.left + v * plotW
  const py = (v: number) => PAD.top + (1 - v) * plotH

  const companyNode = intel
    ? { id: "you", ...intel.companyScores, name: company.name, isYou: true }
    : null

  type MatrixNode = {
    id: string; name: string; isYou: boolean
    priceScore: number; specializationScore: number; techScore: number; reachScore: number
    estimatedSize?: "startup" | "smb" | "enterprise"
    overlapScore?: number; positioning?: string
  }

  const nodes: MatrixNode[] = [
    ...competitors.map((c): MatrixNode => ({
      id: c.id, name: c.name, isYou: false,
      priceScore: c.priceScore, specializationScore: c.specializationScore,
      techScore: c.techScore, reachScore: c.reachScore,
      estimatedSize: c.estimatedSize, overlapScore: c.overlapScore, positioning: c.positioning,
    })),
    ...(companyNode ? [companyNode] : []),
  ]

  const overlapOf = (id: string) => competitors.find((c) => c.id === id)?.overlapScore ?? 0
  const sizeOf = (id: string): keyof typeof SIZE_R =>
    (competitors.find((c) => c.id === id)?.estimatedSize ?? "smb") as keyof typeof SIZE_R

  const axisOptions = (Object.keys(AXIS_META) as Axis[]).filter((a) => a !== xAxis || a === yAxis)

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Axis selectors */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-xs text-white/30">Axes</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40">X:</span>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value as Axis)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500/50"
          >
            {(Object.keys(AXIS_META) as Axis[]).filter((a) => a !== yAxis).map((a) => (
              <option key={a} value={a} className="bg-[#1a1a2e]">{AXIS_META[a].label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40">Y:</span>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value as Axis)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500/50"
          >
            {(Object.keys(AXIS_META) as Axis[]).filter((a) => a !== xAxis).map((a) => (
              <option key={a} value={a} className="bg-[#1a1a2e]">{AXIS_META[a].label}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-white/30">
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" /> You</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400/80" /> High overlap</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400/80" /> Low overlap</span>
        </div>
      </div>

      {/* SVG plot */}
      <div className="flex-1 min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" onMouseLeave={() => setTooltip(null)}>
          {/* Quadrant shading */}
          <rect x={PAD.left} y={PAD.top} width={plotW / 2} height={plotH / 2} fill="white" fillOpacity={0.012} />
          <rect x={PAD.left + plotW / 2} y={PAD.top + plotH / 2} width={plotW / 2} height={plotH / 2} fill="white" fillOpacity={0.012} />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((t) => (
            <g key={t}>
              <line x1={px(t)} y1={PAD.top} x2={px(t)} y2={PAD.top + plotH} stroke="white" strokeOpacity={0.05} strokeDasharray="4 4" />
              <line x1={PAD.left} y1={py(t)} x2={PAD.left + plotW} y2={py(t)} stroke="white" strokeOpacity={0.05} strokeDasharray="4 4" />
            </g>
          ))}

          {/* Center crosshair */}
          <line x1={px(0.5)} y1={PAD.top} x2={px(0.5)} y2={PAD.top + plotH} stroke="white" strokeOpacity={0.12} />
          <line x1={PAD.left} y1={py(0.5)} x2={PAD.left + plotW} y2={py(0.5)} stroke="white" strokeOpacity={0.12} />

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="white" strokeOpacity={0.2} />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="white" strokeOpacity={0.2} />

          {/* Axis labels */}
          <text x={PAD.left} y={PAD.top + plotH + 22} fill="white" fillOpacity={0.35} fontSize={11} textAnchor="start">{AXIS_META[xAxis].low}</text>
          <text x={PAD.left + plotW} y={PAD.top + plotH + 22} fill="white" fillOpacity={0.35} fontSize={11} textAnchor="end">{AXIS_META[xAxis].high}</text>
          <text x={PAD.left + plotW / 2} y={PAD.top + plotH + 38} fill="white" fillOpacity={0.5} fontSize={11} textAnchor="middle" fontWeight="500">{AXIS_META[xAxis].label} →</text>

          <text x={PAD.left - 12} y={PAD.top + plotH} fill="white" fillOpacity={0.35} fontSize={11} textAnchor="end">{AXIS_META[yAxis].low}</text>
          <text x={PAD.left - 12} y={PAD.top + 4} fill="white" fillOpacity={0.35} fontSize={11} textAnchor="end">{AXIS_META[yAxis].high}</text>
          <text
            x={PAD.left - 38}
            y={PAD.top + plotH / 2}
            fill="white"
            fillOpacity={0.5}
            fontSize={11}
            textAnchor="middle"
            fontWeight="500"
            transform={`rotate(-90, ${PAD.left - 38}, ${PAD.top + plotH / 2})`}
          >↑ {AXIS_META[yAxis].label}</text>

          {/* Nodes */}
          {nodes.map((n) => {
            const xVal = (n[xAxis] as number) ?? 0.5
            const yVal = (n[yAxis] as number) ?? 0.5
            const cx = px(xVal)
            const cy = py(yVal)
            const r = n.isYou ? 14 : SIZE_R[sizeOf(n.id)]
            const overlap = n.isYou ? 1 : overlapOf(n.id)
            const hue = Math.round((1 - overlap) * 120)
            const fill = n.isYou ? "#6366f1" : `hsl(${hue},65%,52%)`
            const isActive = n.id === activeId

            return (
              <g key={n.id}>
                {/* Glow ring for active */}
                {isActive && (
                  <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="white" strokeOpacity={0.3} strokeWidth={1.5} />
                )}
                {/* You star shape via polygon */}
                {n.isYou ? (
                  <polygon
                    points={starPoints(cx, cy, 14, 7, 5)}
                    fill={fill}
                    stroke="white"
                    strokeOpacity={isActive ? 1 : 0.4}
                    strokeWidth={isActive ? 2 : 1}
                    style={{ filter: `drop-shadow(0 0 6px ${fill}88)` }}
                  />
                ) : (
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill={fill}
                    fillOpacity={0.85}
                    stroke="white"
                    strokeOpacity={isActive ? 0.9 : 0.2}
                    strokeWidth={isActive ? 2 : 1}
                    style={{ filter: isActive ? `drop-shadow(0 0 8px ${fill})` : undefined, cursor: "pointer" }}
                    onClick={() => !n.isYou && onSelect(n.id)}
                    onMouseEnter={(e) => {
                      const c = competitors.find((x) => x.id === n.id)
                      setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        name: n.name,
                        desc: c?.positioning ?? "",
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )}
                {/* Label */}
                <text
                  x={cx}
                  y={cy + r + 13}
                  textAnchor="middle"
                  fill="white"
                  fillOpacity={isActive ? 0.9 : 0.55}
                  fontSize={10}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none bg-black/90 border border-white/10 rounded-lg px-3 py-2 max-w-[200px]"
            style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
          >
            <p className="text-xs font-medium text-white">{tooltip.name}</p>
            {tooltip.desc && <p className="text-[11px] text-white/50 mt-0.5">{tooltip.desc}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number) {
  const step = Math.PI / points
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = i * step - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(" ")
}
