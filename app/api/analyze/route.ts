import Anthropic from "@anthropic-ai/sdk"
import type { CompanyProfile } from "@/lib/types"

const client = new Anthropic()

export async function POST(request: Request) {
  const company: CompanyProfile = await request.json()

  const prompt = `You are a competitive intelligence researcher. Analyze this company and find 5–8 real, existing competitors.

Company profile:
- Name: ${company.name}
- Location: ${company.city}, ${company.country}
- Industry: ${company.industry}
- Description: ${company.description}
- Services: ${company.services.join(", ")}
- Target market: ${company.targetMarket}
- Price tier: ${company.priceTier}

Use web search to find real competitors in the same industry and geographic region (prioritize local/regional competitors, then national ones).

Return ONLY a valid JSON array — no markdown, no explanation, just the raw JSON. Each competitor must follow this exact schema:
{
  "id": "unique-slug",
  "name": "Company Name",
  "website": "https://...",
  "city": "City Name",
  "country": "Country Name",
  "description": "1–2 sentence description",
  "services": ["service1", "service2"],
  "advantages": ["advantage1", "advantage2", "advantage3"],
  "positioning": "One-line market positioning statement",
  "estimatedSize": "startup" | "smb" | "enterprise",
  "overlapScore": 0.0
}

overlapScore is 0.0–1.0: how much this competitor overlaps with ${company.name}'s services/market (1.0 = direct competitor).
estimatedSize: startup = <10 employees or early stage, smb = 10–200 employees, enterprise = 200+ or well-known brand.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        })

        // Extract the text content from the response
        let jsonText = ""
        for (const block of response.content) {
          if (block.type === "text") {
            jsonText += block.text
          }
        }

        // Strip markdown fences if present
        jsonText = jsonText.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()

        controller.enqueue(encoder.encode(jsonText))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Analysis failed"
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "application/json" },
  })
}
