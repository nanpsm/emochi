import { getFoundryProject } from "@/lib/foundry";

export const dynamic = "force-dynamic";

const clean = (text) => (text ?? "").replace(/【[^】]*】/g, "").trim();

// Wisey's own Foundry persona tends to tack on a second "suggestion" line no
// matter what the calling prompt asks for — enforce brevity here instead of
// relying on instruction-following alone.
function firstSentence(text) {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

// Split the agent's reply into individual suggestions (one per line, or one
// per numbered/bulleted item), then clamp each to a single clean sentence.
function parseSuggestions(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*•]\s*|^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
  return lines
    .map((l) => stripPercentages(firstSentence(l)))
    .filter(Boolean)
    .slice(0, 4);
}

// Same story as above: the agent doesn't reliably drop raw percentages just
// because the prompt asks it to, so strip them here as a guarantee.
function stripPercentages(text) {
  return text
    .replace(/\s*\(\s*\d{1,3}%[^)]*\)/g, "")
    .replace(/\d{1,3}%/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function describeDeltas(deltas) {
  const entries = Object.entries(deltas ?? {}).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries
    .map(([name, v]) => `${name} ${v > 0 ? `+${v} (trending up)` : `${v} (trending down)`}`)
    .join(", ");
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userName, sleep, work, mood, deltas } = payload;
  if (!sleep || !work || !mood) {
    return Response.json({ error: "Missing sleep/work/mood data" }, { status: 400 });
  }

  const deltasLine = describeDeltas(deltas);
  const name = userName?.trim() || "friend";

  const prompt =
    `You are Wisey, giving ${name} several short, warm, personalized check-in insights based ` +
    `on their real data from today's check-in.\n\n` +
    `Sleep: ${sleep.label ?? sleep.short} (${sleep.pct}% of a healthy range)\n` +
    `Work/study: ${work.label ?? work.short} (${work.pct}% intensity)\n` +
    `Mood: ${mood.emoji} at ${mood.pct}%\n` +
    (deltasLine ? `Emotional shifts today: ${deltasLine}\n` : "") +
    `\nWrite 2 to 4 SEPARATE suggestions, one per line, each covering a DIFFERENT data point ` +
    `above (don't repeat the same trend twice) — only include a data point if it's actually ` +
    `worth flagging (skip anything that's just normal/healthy). Each line must be its own ` +
    `single sentence, under 22 words, and must do TWO things at once: name that trend in ` +
    `PLAIN WORDS (e.g. "very low", "well above healthy", "trending up strongly") — NEVER ` +
    `write the raw percentage number itself — AND tell ${name} a specific, concrete action ` +
    `to take about it right now (e.g. "you're very low on sleep — get to bed early tonight", ` +
    `not just "you're low on sleep"). No "Recommendation:" or "Small suggestion:" labels, no ` +
    `numbering, no bullets, no blank lines between them — just one plain sentence per line. ` +
    `Speak directly to ${name}. Do not prefix any line with your name.`;

  try {
    const project = getFoundryProject();
    const openai = project.getOpenAIClient();
    const r = await openai.responses.create(
      {},
      {
        body: {
          input: prompt,
          agent_reference: { name: "Wisey", type: "agent_reference" },
        },
      }
    );
    const replies = parseSuggestions(clean(r.output_text));
    return Response.json({ replies });
  } catch (err) {
    console.error("Wisey tip failed:", err);
    return Response.json({ error: err.message ?? "Wisey tip failed" }, { status: 500 });
  }
}
