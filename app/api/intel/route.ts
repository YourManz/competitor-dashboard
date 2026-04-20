import Anthropic from "@anthropic-ai/sdk"
import type { CompanyProfile, Competitor } from "@/lib/types"

const client = new Anthropic()

interface RequestBody {
  company: CompanyProfile
  competitors: Competitor[]
}

export async function POST(request: Request) {
  const { company, competitors }: RequestBody = await request.json()

  const competitorSummaries = competitors
    .map(
      (c) =>
        `- ${c.name} (${c.city}, ${c.country}): ${c.positioning}. Advantages: ${c.advantages.join("; ")}. Services: ${c.services.join(", ")}. Size: ${c.estimatedSize}. Overlap: ${Math.round(c.overlapScore * 100)}%.`
    )
    .join("\n")

  const prompt = `You are a senior business strategist. Analyze this company and its competitive landscape to produce actionable strategic intelligence.

OUR COMPANY:
- Name: ${company.name}
- Location: ${company.city}, ${company.country}
- Industry: ${company.industry}
- Description: ${company.description}
- Services: ${company.services.join(", ")}
- Target market: ${company.targetMarket}
- Price tier: ${company.priceTier}

COMPETITORS:
${competitorSummaries}

Return ONLY a valid JSON object with this exact schema — no markdown, no explanation:
{
  "summary": "2–3 sentence executive summary of the competitive landscape and ${company.name}'s position in it",
  "companyScores": {
    "priceScore": 0.0,
    "specializationScore": 0.0,
    "techScore": 0.0,
    "reachScore": 0.0
  },
  "threats": [
    {
      "id": "competitor-id-matching-the-list",
      "name": "Competitor Name",
      "level": "high" | "medium" | "low",
      "reason": "1–2 sentences explaining exactly why this competitor is a threat and what makes them dangerous"
    }
  ],
  "gaps": [
    "Specific underserved market segment or unmet need that no competitor is strongly addressing — actionable opportunity for ${company.name}",
    "..."
  ],
  "attackVectors": [
    {
      "id": "competitor-id",
      "name": "Competitor Name",
      "tactics": [
        "Specific, concrete tactic to win business from this competitor — not generic advice",
        "Another specific tactic",
        "A third tactic"
      ]
    }
  ],
  "positioningRec": "2–3 sentence recommendation for how ${company.name} should position itself to win — specific to this competitive landscape, not generic"
}

Score definitions for companyScores (0.0–1.0):
- priceScore: 0.0=budget, 1.0=premium (based on ${company.priceTier} tier)
- specializationScore: 0.0=highly niche/specialized, 1.0=broad generalist
- techScore: 0.0=traditional/manual, 1.0=tech-forward/digital
- reachScore: 0.0=local, 1.0=national/global

Threats must be sorted high → medium → low. Include all ${competitors.length} competitors in threats.
Include all ${competitors.length} competitors in attackVectors.
Gaps should be 3–5 concrete opportunities.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        })

        let jsonText = ""
        for (const block of response.content) {
          if (block.type === "text") {
            jsonText += block.text
          }
        }

        jsonText = jsonText.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
        controller.enqueue(encoder.encode(jsonText))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Intel generation failed"
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: { "Content-Type": "application/json" } })
}
