"use client"

import { useEffect, useRef } from "react"
import type { Competitor, CompanyProfile } from "@/lib/types"

interface Props {
  company: CompanyProfile
  competitors: Competitor[]
  activeId: string | null
  onSelect: (id: string) => void
}

interface Node {
  id: string
  label: string
  isYou: boolean
  size: "startup" | "smb" | "enterprise"
  overlapScore: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Link {
  source: string | Node
  target: string | Node
  overlap: number
}

const nodeSizes = { startup: 20, smb: 30, enterprise: 42 }

export default function WebDiagram({ company, competitors, activeId, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !competitors.length) return

    const run = async () => {
      const d3 = await import("d3")
      const svg = d3.select(svgRef.current!)
      svg.selectAll("*").remove()

      const rect = svgRef.current!.getBoundingClientRect()
      const W = rect.width || 600
      const H = rect.height || 500

      const youNode: Node = {
        id: "you",
        label: company.name,
        isYou: true,
        size: "smb",
        overlapScore: 1,
        fx: W / 2,
        fy: H / 2,
      }

      const nodes: Node[] = [
        youNode,
        ...competitors.map((c) => ({
          id: c.id,
          label: c.name,
          isYou: false,
          size: c.estimatedSize,
          overlapScore: c.overlapScore,
        })),
      ]

      const links: Link[] = competitors.map((c) => ({
        source: "you",
        target: c.id,
        overlap: c.overlapScore,
      }))

      const simulation = d3
        .forceSimulation(nodes as d3.SimulationNodeDatum[])
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => (d as Node).id)
            .distance((l) => 180 - (l as Link).overlap * 100)
        )
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(W / 2, H / 2))
        .force("collision", d3.forceCollide().radius((d) => nodeSizes[(d as Node).size] + 10))

      const g = svg.append("g")

      // Zoom
      svg.call(
        d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 3]).on("zoom", (e) => {
          g.attr("transform", e.transform)
        })
      )

      // Links
      const link = g
        .append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#ffffff18")
        .attr("stroke-width", (l) => 1 + (l as Link).overlap * 5)

      // Nodes
      const node = g
        .append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("cursor", (d) => (d.isYou ? "default" : "pointer"))
        .on("click", (_, d) => {
          if (!d.isYou) onSelect(d.id)
        })
        .call(
          d3
            .drag<SVGGElement, Node>()
            .on("start", (e, d) => {
              if (!e.active) simulation.alphaTarget(0.3).restart()
              d.fx = d.x
              d.fy = d.y
            })
            .on("drag", (e, d) => {
              d.fx = e.x
              d.fy = e.y
            })
            .on("end", (e, d) => {
              if (!e.active) simulation.alphaTarget(0)
              if (!d.isYou) {
                d.fx = null
                d.fy = null
              }
            }) as unknown as (selection: d3.Selection<d3.BaseType | SVGGElement, Node, SVGGElement, unknown>) => void
        )

      node
        .append("circle")
        .attr("r", (d) => nodeSizes[d.size])
        .attr("fill", (d) => {
          if (d.isYou) return "#6366f1"
          const hue = Math.round((1 - d.overlapScore) * 120)
          return `hsl(${hue},60%,50%)`
        })
        .attr("stroke", (d) => (d.id === activeId ? "#ffffff" : "#ffffff22"))
        .attr("stroke-width", (d) => (d.id === activeId ? 3 : 1))
        .attr("opacity", 0.85)

      node
        .append("text")
        .text((d) => d.label)
        .attr("text-anchor", "middle")
        .attr("dy", (d) => nodeSizes[d.size] + 14)
        .attr("fill", "#ffffff99")
        .attr("font-size", 11)
        .attr("font-family", "sans-serif")
        .attr("pointer-events", "none")

      node
        .filter((d) => d.isYou)
        .append("text")
        .text("YOU")
        .attr("text-anchor", "middle")
        .attr("dy", 4)
        .attr("fill", "#ffffff")
        .attr("font-size", 9)
        .attr("font-weight", "bold")
        .attr("font-family", "sans-serif")
        .attr("pointer-events", "none")

      simulation.on("tick", () => {
        link
          .attr("x1", (l) => (l.source as Node).x ?? 0)
          .attr("y1", (l) => (l.source as Node).y ?? 0)
          .attr("x2", (l) => (l.target as Node).x ?? 0)
          .attr("y2", (l) => (l.target as Node).y ?? 0)

        node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

      // Re-highlight active node
      node
        .selectAll("circle")
        .attr("stroke", (d) => ((d as Node).id === activeId ? "#ffffff" : "#ffffff22"))
        .attr("stroke-width", (d) => ((d as Node).id === activeId ? 3 : 1))
    }

    run()
  }, [company, competitors, activeId])

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 text-xs pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-white/50">
          Drag to reposition · Scroll to zoom · Click to select
        </div>
      </div>
      <div className="absolute top-3 right-3 flex flex-col gap-1 text-xs pointer-events-none">
        {(["startup", "smb", "enterprise"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
            <div
              className="rounded-full bg-white/30"
              style={{ width: nodeSizes[s] / 2.5, height: nodeSizes[s] / 2.5 }}
            />
            <span className="text-white/50 capitalize">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
