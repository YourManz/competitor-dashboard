"use client"

import { useEffect, useRef } from "react"
import type { Competitor, CompanyProfile } from "@/lib/types"

interface Props {
  company: CompanyProfile & { lat?: number; lng?: number }
  competitors: Competitor[]
  activeId: string | null
  onSelect: (id: string) => void
}

export default function MapView({ company, competitors, activeId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let L: typeof import("leaflet")

    const init = async () => {
      L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(containerRef.current!, { zoomControl: true, scrollWheelZoom: true })
      mapRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      const bounds: [number, number][] = []

      // Your company pin (green)
      const youIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(34,197,94,0.8)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const compLat = company.lat ?? 49.2827
      const compLng = company.lng ?? -123.1207
      bounds.push([compLat, compLng])
      L.marker([compLat, compLng], { icon: youIcon })
        .addTo(map)
        .bindPopup(`<b>${company.name}</b><br/><span style="color:#6b7280">You</span>`)

      // Competitor pins
      competitors.forEach((c) => {
        if (c.lat == null || c.lng == null) return
        bounds.push([c.lat, c.lng])

        const overlapPct = Math.round(c.overlapScore * 100)
        const hue = Math.round((1 - c.overlapScore) * 120)
        const color = `hsl(${hue},70%,55%)`

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:12px;height:12px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px ${color}88"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })

        L.marker([c.lat, c.lng], { icon })
          .addTo(map)
          .on("click", () => onSelect(c.id))
          .bindPopup(
            `<b>${c.name}</b><br/><span style="color:#6b7280">${c.city} · ${overlapPct}% overlap</span>`
          )
      })

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] })
      } else {
        map.setView([compLat, compLng], 8)
      }
    }

    init()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Highlight active marker
  useEffect(() => {
    // Re-render happens via parent; map state managed imperatively above
  }, [activeId])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-1 ring-white" />
          <span className="text-white/70">You</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 ring-1 ring-white" />
          <span className="text-white/70">High overlap</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 ring-1 ring-white" />
          <span className="text-white/70">Low overlap</span>
        </div>
      </div>
    </div>
  )
}
