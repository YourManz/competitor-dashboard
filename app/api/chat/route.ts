import Anthropic from "@anthropic-ai/sdk"
import type { CompanyProfile, Competitor, Intel } from "@/lib/types"

const client = new Anthropic()

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  company: CompanyProfile
  competitors: Competitor[]
  intel: Intel | null
}

function buildSystemPrompt(company: CompanyProfile, competitors: Competitor[], intel: Intel | null) {
  const compList = competitors
    .map(
      (c) =>
        `- ${c.name} (${c.city}, ${c.country}): ${c.positioning}. Size: ${c.estimatedSize}. Price: ${Math.round(c.priceScore * 100)}th percentile. Specialization: ${Math.round((1 - c.specializationScore) * 100)}% niche. Tech: ${Math.round(c.techScore * 100)}th percentile. Overlap with ${company.name}: ${Math.round(c.overlapScore * 100)}%. Advantages: ${c.advantages.join("; ")}.`
    )
    .join("\n")

  const intelSection = intel
    ? `
STRATEGIC INTEL:
Summary: ${intel.summary}

Positioning recommendation: ${intel.positioningRec}

Threat ranking:
${intel.threats.map((t) => `- ${t.name}: ${t.level} threat — ${t.reason}`).join("\n")}

Market gaps:
${intel.gaps.map((g) => `- ${g}`).join("\n")}
`
    : ""

  return `You are a sharp, direct business strategist advising ${company.name}. You have deep knowledge of their competitive landscape and give specific, actionable advice — not generic consulting speak.

OUR COMPANY:
- Name: ${company.name}
- Location: ${company.city}, ${company.country}
- Industry: ${company.industry}
- Description: ${company.description}
- Services: ${company.services.join(", ")}
- Target market: ${company.targetMarket}
- Price tier: ${company.priceTier}

COMPETITORS (${competitors.length} total):
${compList}
${intelSection}
INSTRUCTIONS:
- Be concise and direct. No fluff, no preamble.
- When asked about positioning, be specific to this company and these competitors — never give generic advice.
- Use competitor names and specific details when making recommendations.
- If asked something outside competitive positioning, gently redirect to what you know about.
- Format responses clearly: use short paragraphs, bullet points where helpful. Keep responses under 300 words unless the question genuinely needs more.`
}

export async function POST(request: Request) {
  const { messages, company, competitors, intel }: RequestBody = await request.json()

  const systemPrompt = buildSystemPrompt(company, competitors, intel)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        })

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }

        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Chat failed"
        controller.enqueue(encoder.encode(`\n\n_Error: ${msg}_`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
