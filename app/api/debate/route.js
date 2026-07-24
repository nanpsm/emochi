import { getFoundryProject } from "@/lib/foundry";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JUDGE = "Wisey";
const MAX_SPEECHES = 8; // hard cap on emotion turns before Wisey's verdict

const clean = (text) => (text ?? "").replace(/【[^】]*】/g, "").trim();

async function askAgent(openai, agentName, message) {
  const r = await openai.responses.create(
    {},
    {
      body: {
        input: message,
        agent_reference: { name: agentName, type: "agent_reference" },
      },
    }
  );
  return clean(r.output_text);
}

// The director is a plain model call (no persona) so it reliably returns JSON.
let cachedDirectorModel = null;
async function getDirectorModel(project) {
  if (cachedDirectorModel) return cachedDirectorModel;
  for await (const d of project.deployments.list()) {
    const name = d.name ?? d.modelName ?? "";
    if (name && !/embed|whisper|tts|dall-e/i.test(name)) {
      cachedDirectorModel = d.name;
      return cachedDirectorModel;
    }
  }
  return null;
}

// The agent roster (names + enabled state) rarely changes, so cache it across
// requests instead of re-listing it from Azure on every debate.
let cachedAgentNames = null;
async function getAgentNames(project) {
  if (cachedAgentNames) return cachedAgentNames;
  const names = [];
  for await (const a of project.agents.list()) {
    if (a.state === "enabled") names.push(a.name);
  }
  cachedAgentNames = names;
  return names;
}

async function askDirector(openai, model, prompt) {
  // The director only ever picks a name or writes one short JSON line — no
  // real reasoning needed, so keep GPT-5-mini's reasoning effort minimal to
  // cut its latency (it defaults to spending real "thinking" time otherwise).
  const r = await openai.responses.create({
    model,
    input: prompt,
    reasoning: { effort: "minimal" },
  });
  const m = clean(r.output_text).match(/\{[\s\S]*?\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { message, history = [] } = payload;
  if (!message || typeof message !== "string") {
    return Response.json({ error: "Missing 'message'" }, { status: 400 });
  }

  let project, openai, agentNames;
  try {
    project = getFoundryProject();
    openai = project.getOpenAIClient();
    agentNames = await getAgentNames(project);
  } catch (err) {
    console.error("Debate setup failed:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }

  const emotions = agentNames.filter(
    (n) => n.toLowerCase() !== JUDGE.toLowerCase()
  );
  const judge = agentNames.find(
    (n) => n.toLowerCase() === JUDGE.toLowerCase()
  );
  if (emotions.length === 0) {
    return Response.json({ error: "No debate agents found" }, { status: 500 });
  }

  const directorModel = await getDirectorModel(project).catch(() => null);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      const transcript = history
        .filter((t) => t?.speaker && t?.text)
        .map((t) => ({ speaker: t.speaker, text: t.text }));
      transcript.push({ speaker: "User", text: message });
      const lines = () =>
        transcript
          .slice(-30)
          .map((t) => `${t.speaker}: ${t.text}`)
          .join("\n");

      try {
        // ── 1. Director picks who's in the room and who opens ──
        // (or flags the message as not actually debate-worthy — see below)
        let participants = emotions;
        let current = emotions[0];
        let summary = message;
        if (directorModel) {
          const plan = await askDirector(
            openai,
            directorModel,
            `You are directing an Inside Out-style debate between a user's emotion characters.\n` +
              `Conversation so far:\n${lines()}\n\n` +
              `Available characters and their emotions: ${emotions.join(", ")} ` +
              `(Cheer=joy/optimism, Fear=caution, Buzzy=urgency/stress, Tear=sadness/empathy, ` +
              `Zen=calm, Bubble=social connection, Dozy=rest/recovery).\n` +
              `First check: is the user's latest message actually something to debate — a real ` +
              `question, situation, or topic with room for different emotional takes? If it is ` +
              `instead just a greeting, introduction, their name, or other small talk with nothing ` +
              `to debate, respond with ONLY this JSON: {"direct": true, "summary": "..."} ` +
              `(summary: neutral, no more than 12 words).\n` +
              `Otherwise, pick the 3-5 characters whose perspectives are MOST relevant to the user's ` +
              `message, favoring characters likely to DISAGREE with each other, and choose who speaks ` +
              `first. Also summarize the user's current topic neutrally in no more than 12 words.\n` +
              `Respond with ONLY this JSON, nothing else: ` +
              `{"participants": ["Name", ...], "first": "Name", "summary": "..."}`
          ).catch(() => null);

          if (plan?.direct) {
            // Not debate-worthy — Wisey answers directly, no cast, no debate.
            summary = typeof plan.summary === "string" && plan.summary.trim() ? plan.summary.trim() : message;
            emit({ type: "cast", participants: [], judge: judge ?? null, summary, direct: true });
            if (judge) {
              emit({ type: "turn_start", agent: judge });
              const reply = await askAgent(
                openai,
                judge,
                `You are ${judge}, the warm host of the Moodling council. The user just said: ` +
                  `"${message}" — this isn't something to debate, it's a greeting, introduction, or ` +
                  `small talk. Reply naturally and briefly (one short sentence) as yourself, relevant ` +
                  `to what they said. Do not prefix your reply with your name.`
              );
              transcript.push({ speaker: judge, text: reply });
              emit({ type: "turn", agent: judge, text: reply });
            }
            emit({ type: "done" });
            return;
          }

          if (Array.isArray(plan?.participants)) {
            const chosen = plan.participants.filter((n) => emotions.includes(n));
            if (chosen.length >= 2) participants = chosen;
          }
          if (participants.includes(plan?.first)) current = plan.first;
          else current = participants[0];
          if (typeof plan?.summary === "string" && plan.summary.trim()) {
            summary = plan.summary.trim();
          }
        }
        emit({ type: "cast", participants, judge: judge ?? null, summary });

        // ── 2. Debate loop: speak, then director picks next or stops ──
        let speeches = 0;
        const speechCounts = Object.fromEntries(participants.map((n) => [n, 0]));
        const speakerHistory = []; // order of actual emotion speakers, for ping-pong detection

        // Only 2 unique speakers should never carry more than 3 exchanges in a
        // row — if that happens (director keeps ping-ponging), force in a
        // fresh voice so quieter cast members aren't frozen out forever.
        function dePingPong(candidate) {
          if (!candidate || participants.length <= 2) return candidate;
          const recent = [...speakerHistory.slice(-3), candidate];
          const uniq = new Set(recent);
          if (uniq.size > 2) return candidate;
          const notYetSpoken = participants.filter((n) => speechCounts[n] === 0);
          const fresh =
            notYetSpoken.find((n) => !uniq.has(n)) ??
            participants.find((n) => !uniq.has(n));
          return fresh ?? candidate;
        }

        while (current && speeches < MAX_SPEECHES) {
          emit({ type: "turn_start", agent: current });
          // Only mention Moodlings who have ACTUALLY spoken already — telling
          // a speaker the full cast roster up front makes them address
          // characters who haven't said anything yet.
          const spokenSoFar = speakerHistory.filter((n) => n !== current);
          const reactionNote =
            spokenSoFar.length > 0
              ? `React directly to what ${[...new Set(spokenSoFar)].join(" and ")} already said in the ` +
                `transcript above — call them out BY NAME when you disagree, or back them up if you agree. ` +
                `Only reference Moodlings who have actually spoken already; do not address anyone who hasn't spoken yet.`
              : `You are the first to speak — take a clear stance without addressing anyone by name yet.`;
          const text = await askAgent(
            openai,
            current,
            `You are ${current} in the Moodling council debate about the user's situation. ` +
              `The debate so far:\n${lines()}\n\n` +
              `Speak as ${current}, fully in character, in 1-2 punchy sentences. Take a clear stance ` +
              `from your emotion's point of view. ${reactionNote} Never repeat a point already made. ` +
              `Do not prefix your reply with your name.`
          );
          transcript.push({ speaker: current, text });
          speakerHistory.push(current);
          speechCounts[current]++;
          emit({ type: "turn", agent: current, text });
          speeches++;

          if (speeches >= MAX_SPEECHES || !directorModel) {
            // No director: simple fixed order, one speech each.
            if (!directorModel) {
              const idx = participants.indexOf(current);
              current = participants[idx + 1] ?? null;
              continue;
            }
            break;
          }

          const notYetSpoken = participants.filter((n) => speechCounts[n] === 0);
          const countsLine = participants
            .map((n) => `${n}: ${speechCounts[n]}`)
            .join(", ");
          const decision = await askDirector(
            openai,
            directorModel,
            `You are directing a debate between: ${participants.join(", ")}.\n` +
              `Debate so far:\n${lines()}\n\n` +
              `Turns spoken so far — ${countsLine}.\n` +
              (notYetSpoken.length > 0
                ? `These haven't spoken yet and should be prioritized for variety: ${notYetSpoken.join(", ")}.\n`
                : "") +
              `Decide who should respond NEXT to keep the debate lively — prefer someone who would ` +
              `push back on the last speaker, and never pick the same character twice in a row ` +
              `(a character MAY speak again later to rebut). Avoid letting only two characters ` +
              `ping-pong back and forth for the whole debate — bring in a fresh voice if the same ` +
              `pair keeps trading turns. If every useful point has been made or the debate is ` +
              `repeating itself, stop it.\n` +
              `Respond with ONLY this JSON, nothing else: {"next": "Name"} or {"next": "STOP"}`
          ).catch(() => null);

          const next = decision?.next;
          if (!next || next === "STOP" || next === current || !participants.includes(next)) {
            current = null;
          } else {
            current = dePingPong(next);
          }
        }

        // ── 3. Wisey always closes with the verdict ──
        if (judge) {
          emit({ type: "turn_start", agent: judge });
          const verdict = await askAgent(
            openai,
            judge,
            `You are ${judge}, the judge and moderator of the Moodling council. ` +
              `The debate so far:\n${lines()}\n\n` +
              `Deliver your verdict: in 2-3 sentences, weigh the strongest points made ` +
              `(mention at least two Moodlings by name), then give the user ONE balanced next step. ` +
              `Do not prefix your reply with your name.`
          );
          transcript.push({ speaker: judge, text: verdict });
          emit({ type: "turn", agent: judge, text: verdict });
        }

        emit({ type: "done" });
      } catch (err) {
        console.error("Debate stream failed:", err);
        emit({ type: "error", message: err.message ?? "Debate failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
