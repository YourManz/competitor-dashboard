"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { useStore } from "@/lib/store"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  streaming?: boolean
}

const SUGGESTIONS = [
  "Where should I focus to win against my biggest threat?",
  "What's my clearest competitive advantage right now?",
  "Which market gap should I prioritize?",
  "How should I price relative to my competitors?",
  "Who should I not bother competing with directly?",
]

let _msgId = 0

interface Props {
  onClose: () => void
}

export default function ChatPanel({ onClose }: Props) {
  const { company, competitors, intel } = useStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = async (text: string) => {
    if (!text.trim() || loading || !company) return
    setInput("")
    setLoading(true)

    const userMsg: Message = { id: ++_msgId, role: "user", content: text.trim() }
    const assistantId = ++_msgId
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true }

    setMessages((prev) => [...prev, userMsg, assistantMsg])

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, company, competitors, intel }),
      })

      if (!res.body) throw new Error("No stream")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated, streaming: true } : m
          )
        )
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated, streaming: false } : m
        )
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Something went wrong. Try again.", streaming: false }
            : m
        )
      )
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d16] border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/30" />
          <span className="text-sm font-medium text-white">Positioning Chat</span>
          {company && (
            <span className="text-xs text-white/30">· {company.name}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-xs text-white/30 text-center">
              Ask anything about your competitive position.<br />
              Claude knows your company, all {competitors.length} competitors{intel ? ", and the full intel report" : ""}.
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 border border-white/10 text-white/85"
              }`}
            >
              {msg.content ? (
                <FormattedMessage content={msg.content} />
              ) : (
                <span className="inline-block w-1 h-4 bg-white/40 animate-[blink_1s_step-end_infinite] align-middle" />
              )}
              {msg.streaming && msg.content && (
                <span className="inline-block w-1 h-3.5 bg-white/40 animate-[blink_1s_step-end_infinite] align-middle ml-0.5" />
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/10">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about positioning, threats, gaps…"
            rows={1}
            disabled={loading}
            style={{ resize: "none" }}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 leading-relaxed"
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = "auto"
              el.style.height = Math.min(el.scrollHeight, 120) + "px"
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/20 text-white flex items-center justify-center transition-colors"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-white/20 mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  )
}

function FormattedMessage({ content }: { content: string }) {
  // Simple markdown-lite: bold, bullet lists, line breaks
  const lines = content.split("\n")
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        const isBullet = /^[-•*]\s/.test(line)
        const text = line.replace(/^[-•*]\s/, "")
        const formatted = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code class='bg-white/10 px-1 rounded text-[11px]'>$1</code>")
        return (
          <div key={i} className={`flex gap-1.5 ${isBullet ? "items-start" : ""}`}>
            {isBullet && <span className="text-indigo-400 flex-shrink-0 mt-0.5">›</span>}
            <span dangerouslySetInnerHTML={{ __html: formatted }} />
          </div>
        )
      })}
    </div>
  )
}
