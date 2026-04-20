"use client"

import { useEffect, useRef } from "react"
import { useStore } from "@/lib/store"
import type { LogLevel } from "@/lib/types"

const levelStyles: Record<LogLevel, string> = {
  info:    "text-blue-400",
  success: "text-emerald-400",
  warn:    "text-yellow-400",
  error:   "text-red-400",
  dim:     "text-white/30",
}

const levelPrefix: Record<LogLevel, string> = {
  info:    "›",
  success: "✓",
  warn:    "⚠",
  error:   "✗",
  dim:     " ",
}

interface Props {
  /** Show a blinking cursor on the last line while active */
  active?: boolean
  className?: string
}

export default function ActivityConsole({ active, className = "" }: Props) {
  const logs = useStore((s) => s.logs)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs.length])

  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/60 backdrop-blur-sm overflow-hidden font-mono text-xs ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 text-white/30 text-[11px] tracking-wide">competitor-intel — activity</span>
        {active && (
          <span className="ml-auto flex items-center gap-1 text-indigo-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            running
          </span>
        )}
      </div>

      {/* Log lines */}
      <div className="p-3 space-y-0.5 max-h-64 overflow-y-auto scrollbar-hide">
        {logs.length === 0 && (
          <div className="text-white/20">Waiting for input…</div>
        )}
        {logs.map((entry, i) => {
          const isLast = i === logs.length - 1
          return (
            <div key={entry.id} className="flex gap-2 leading-5">
              <span className="text-white/20 flex-shrink-0 select-none">{entry.ts}</span>
              <span className={`flex-shrink-0 select-none ${levelStyles[entry.level]}`}>
                {levelPrefix[entry.level]}
              </span>
              <span className={levelStyles[entry.level]}>
                {entry.message}
                {active && isLast && (
                  <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
                )}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
