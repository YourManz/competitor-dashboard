"use client"

import { useState, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import ActivityConsole from "./ActivityConsole"
import type { CompanyProfile, Competitor } from "@/lib/types"

const priceTiers = [
  { value: "low", label: "Budget", desc: "Economy pricing" },
  { value: "mid", label: "Mid-market", desc: "Moderate pricing" },
  { value: "premium", label: "Premium", desc: "High-end pricing" },
] as const

export default function IntakeForm() {
  const router = useRouter()
  const { setCompany, setCompetitors, setStatus, log, clearLogs } = useStore()

  const [form, setForm] = useState<Omit<CompanyProfile, "services">>({
    name: "",
    website: "",
    city: "",
    country: "",
    industry: "",
    description: "",
    targetMarket: "",
    priceTier: "mid",
  })
  const [services, setServices] = useState<string[]>([])
  const [serviceInput, setServiceInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addService = () => {
    const s = serviceInput.trim()
    if (s && !services.includes(s)) setServices((prev) => [...prev, s])
    setServiceInput("")
  }

  const handleServiceKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addService()
    }
  }

  const removeService = (s: string) => setServices((prev) => prev.filter((x) => x !== s))

  const handleSubmit = async () => {
    if (!form.name || !form.city || !form.country || !form.industry || !form.description) {
      setError("Please fill in all required fields.")
      return
    }
    setError(null)
    setLoading(true)
    clearLogs()

    const profile: CompanyProfile = { ...form, services }
    setCompany(profile)
    setStatus("analyzing")

    log(`Initializing competitor research for "${profile.name}"`, "dim")
    log(`Industry: ${profile.industry}  ·  Location: ${profile.city}, ${profile.country}`, "dim")
    log("Sending company profile to Claude…", "info")

    try {
      log("Claude is searching the web for competitors…", "info")

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      const text = await res.text()
      let competitors: Competitor[]

      try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          competitors = parsed
        } else if (parsed.error) {
          throw new Error(parsed.error)
        } else {
          throw new Error("Unexpected response format")
        }
      } catch {
        throw new Error("Failed to parse competitor data")
      }

      log(`Claude returned ${competitors.length} competitor${competitors.length !== 1 ? "s" : ""}`, "success")

      const sizeLabel = { startup: "startup", smb: "SMB", enterprise: "enterprise" }
      for (const c of competitors) {
        log(
          `  Found: ${c.name}  (${c.city}, ${c.country})  ·  ${sizeLabel[c.estimatedSize]}  ·  ${Math.round(c.overlapScore * 100)}% overlap`,
          "success"
        )
      }

      setStatus("geocoding")
      setCompetitors(competitors)

      log("─".repeat(48), "dim")
      log("Resolving geolocations via OpenStreetMap…", "info")

      for (const c of competitors) {
        log(`  Geocoding ${c.name}  (${c.city}, ${c.country})…`, "info")
        try {
          const geo = await fetch(
            `/api/geocode?city=${encodeURIComponent(c.city)}&country=${encodeURIComponent(c.country)}`
          )
          const { lat, lng } = await geo.json()
          if (lat && lng) {
            useStore.getState().updateCompetitor(c.id, { lat, lng })
            log(`    ↳ ${lat.toFixed(4)}, ${lng.toFixed(4)}`, "success")
          } else {
            log(`    ↳ no coordinates found`, "warn")
          }
        } catch {
          log(`    ↳ geocode request failed`, "warn")
        }
        await new Promise((r) => setTimeout(r, 1100))
      }

      // Geocode the company itself
      log(`  Geocoding your company  (${profile.city}, ${profile.country})…`, "info")
      try {
        const geo = await fetch(
          `/api/geocode?city=${encodeURIComponent(profile.city)}&country=${encodeURIComponent(profile.country)}`
        )
        const { lat, lng } = await geo.json()
        if (lat && lng) {
          setCompany({ ...profile, lat, lng } as CompanyProfile & { lat?: number; lng?: number })
          log(`    ↳ ${lat.toFixed(4)}, ${lng.toFixed(4)}`, "success")
        }
      } catch {}

      log("─".repeat(48), "dim")
      log(`Analysis complete — ${competitors.length} competitors mapped`, "success")
      log("Launching dashboard…", "dim")

      setStatus("done")
      await new Promise((r) => setTimeout(r, 600))
      router.push("/dashboard")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed"
      log(`Error: ${msg}`, "error")
      setStatus("error", msg)
      setError(msg)
      setLoading(false)
    }
  }

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    opts: { required?: boolean; textarea?: boolean } = {}
  ) => (
    <div>
      <label className="block text-xs text-white/50 mb-1.5">
        {label}
        {opts.required && <span className="text-indigo-400 ml-1">*</span>}
      </label>
      {opts.textarea ? (
        <textarea
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          disabled={loading}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-none disabled:opacity-40"
        />
      ) : (
        <input
          type="text"
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          disabled={loading}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 disabled:opacity-40"
        />
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/30" />
            <span className="text-xs text-indigo-400 uppercase tracking-widest">Competitor Intel</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Tell us about your company</h1>
          <p className="text-sm text-white/40">
            Claude will research real competitors and build your intelligence dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field("name", "Company name", "Acme Inc.", { required: true })}
            {field("website", "Website", "https://acme.com")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field("city", "City", "Vancouver", { required: true })}
            {field("country", "Country", "Canada", { required: true })}
          </div>

          {field("industry", "Industry / niche", "Construction bookkeeping", { required: true })}

          {field("description", "What does your company do?", "We provide specialized bookkeeping for residential construction contractors in BC…", {
            required: true,
            textarea: true,
          })}

          {/* Services */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Services / products</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={handleServiceKey}
                placeholder="Type a service, press Enter"
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 disabled:opacity-40"
              />
              <button
                onClick={addService}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/15 text-sm disabled:opacity-40"
              >
                Add
              </button>
            </div>
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  >
                    {s}
                    <button onClick={() => removeService(s)} className="text-indigo-400 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {field("targetMarket", "Target market", "Small residential construction firms, 1–20 employees")}

          {/* Price tier */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Price tier</label>
            <div className="grid grid-cols-3 gap-2">
              {priceTiers.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm((f) => ({ ...f, priceTier: t.value }))}
                  disabled={loading}
                  className={`p-2.5 rounded-lg border text-left transition-colors disabled:opacity-40 ${
                    form.priceTier === t.value
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{t.label}</div>
                  <div className="text-xs text-white/40">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Analyzing competitors…
              </>
            ) : (
              "Research competitors →"
            )}
          </button>

          {/* Activity console — visible once analysis starts */}
          {loading && (
            <ActivityConsole active className="mt-2" />
          )}
        </div>
      </div>
    </div>
  )
}
