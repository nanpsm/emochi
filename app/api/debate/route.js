import { getFoundryProject } from "@/lib/foundry";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JUDGE = "Wisey";
const MAX_SPEECHES = 8; // hard cap on emotion turns before Wisey's verdict
const MIN_SPEECHES = 4; // director can't call an early stop before this many turns

const clean = (text) => (text ?? "").replace(/【[^】]*】/g, "").trim();

// Streams a persona agent's reply token-by-token via onDelta, and returns the
// full cleaned text once the response completes. Much snappier perceived
// latency than waiting for the whole reply before showing anything.
async function askAgentStream(openai, agentName, message, onDelta) {
  const stream = await openai.responses.create(
    { stream: true },
    {
      body: {
        input: message,
        agent_reference: { name: agentName, type: "agent_reference" },
        stream: true,
      },
    }
  );
  let full = "";
  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      full += event.delta;
      onDelta(event.delta);
    }
  }
  return clean(full);
}

// The director is a plain model call (no persona) so it reliably returns
// JSON. This project only has one non-embedding deployment available, so
// there's no faster alternative to pick here — but if more are ever added,
// prefer anything that looks like a lighter/faster tier.
let cachedDirectorModel = null;
async function getDirectorModel(project) {
  if (cachedDirectorModel) return cachedDirectorModel;
  const candidates = [];
  for await (const d of project.deployments.list()) {
    const name = d.name ?? d.modelName ?? "";
    if (name && !/embed|whisper|tts|dall-e/i.test(name)) candidates.push(name);
  }
  const fast = candidates.find((n) => /mini|nano|flash|lite|small|fast/i.test(n));
  cachedDirectorModel = fast ?? candidates[0] ?? null;
  return cachedDirectorModel;
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
  const { message, history = [], compact = false } = payload;
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
            `You are directing an Inside Out-style DEBATE between a user's emotion characters — ` +
              `the whole point is real disagreement and friction, not a group of characters agreeing ` +
              `with each other and piling on compliments.\n` +
              `Conversation so far:\n${lines()}\n\n` +
              `Available characters and their emotions: ${emotions.join(", ")} ` +
              `(Cheer=joy/optimism, Fear=caution, Buzzy=urgency/stress, Tear=sadness/empathy, ` +
              `Zen=calm, Bubble=social connection, Dozy=rest/recovery).\n` +
              `First check: is the user's latest message actually something to debate — a real ` +
              `question, situation, or topic with room for different emotional takes? If it is ` +
              `instead just a greeting, introduction, their name, or other small talk with nothing ` +
              `to debate, respond with ONLY this JSON: {"direct": true, "summary": "..."} ` +
              `(summary: neutral, no more than 12 words).\n` +
              `Otherwise, pick 3-5 characters. EVEN IF the news sounds purely good or purely bad, ` +
              `there is still real tension: you MUST include at least one upbeat/eager voice (Cheer, ` +
              `Buzzy, or Bubble) AND at least one cautious/reflective voice (Fear, Dozy, Zen, or Tear) ` +
              `— never cast a set that would just agree with each other start to finish. Choose who ` +
              `speaks first, and summarize the user's current topic neutrally in no more than 12 words.\n` +
              `Respond with ONLY this JSON, nothing else: ` +
              `{"participants": ["Name", ...], "first": "Name", "summary": "..."}`
          ).catch(() => null);

          if (plan?.direct) {
            // Not debate-worthy — Wisey answers directly, no cast, no debate.
            summary = typeof plan.summary === "string" && plan.summary.trim() ? plan.summary.trim() : message;
            emit({ type: "cast", participants: [], judge: judge ?? null, summary, direct: true });
            if (judge) {
              emit({ type: "turn_start", agent: judge });
              const reply = await askAgentStream(
                openai,
                judge,
                `You are ${judge}, the warm host of the Moodling council. The user just said: ` +
                  `"${message}" — this isn't something to debate, it's a greeting, introduction, or ` +
                  `small talk. Reply naturally and briefly (one short sentence) as yourself, relevant ` +
                  `to what they said. Do not prefix your reply with your name.`,
                (delta) => emit({ type: "turn_delta", agent: judge, delta })
              );
              transcript.push({ speaker: judge, text: reply });
              emit({ type: "turn_end", agent: judge, text: reply });
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

        // Director now plans TWO speakers ahead per call instead of one,
        // roughly halving the number of planning round-trips in the debate.
        let speakerQueue = [];
        let directorStopped = false;
        async function refillQueue() {
          if (directorStopped) return;
          const notYetSpoken = participants.filter((n) => speechCounts[n] === 0);
          const countsLine = participants
            .map((n) => `${n}: ${speechCounts[n]}`)
            .join(", ");
          const canStopEarly = speeches >= MIN_SPEECHES;
          const decision = await askDirector(
            openai,
            directorModel,
            `You are directing a DEBATE between: ${participants.join(", ")} — the goal is genuine ` +
              `disagreement and friction between them, not everyone agreeing and complimenting the user.\n` +
              `Debate so far:\n${lines()}\n\n` +
              `Turns spoken so far — ${countsLine}.\n` +
              (notYetSpoken.length > 0
                ? `These haven't spoken yet and should be prioritized for variety: ${notYetSpoken.join(", ")}.\n`
                : "") +
              `Plan the NEXT TWO speakers (in order) to keep the debate lively — prefer speakers who ` +
              `would push back on whoever spoke most recently, and never repeat the same character back ` +
              `to back. If the last couple of speakers were just agreeing with each other, your TOP ` +
              `priority is pulling in someone with a different angle to create real tension, not ending ` +
              `the debate. Avoid letting only two characters ping-pong for the whole debate — bring in a ` +
              `fresh voice if the same pair keeps trading turns.` +
              (canStopEarly
                ? ` Only stop early if there's genuinely been real back-and-forth already and it's now ` +
                  `just repeating itself — it's fine to return just one name, or none.\n`
                : ` Do NOT stop yet — the debate has barely started, keep it going.\n`) +
              `Respond with ONLY this JSON, nothing else: {"next": ["Name", "Name"]} or {"next": "STOP"}`
          ).catch(() => null);

          const raw = canStopEarly ? decision?.next : decision?.next ?? [];
          if (!canStopEarly && (!raw || raw === "STOP" || (Array.isArray(raw) && raw.length === 0))) {
            // Force continuation: pick whoever hasn't spoken yet (or anyone else).
            const fallback = notYetSpoken[0] ?? participants.find((n) => n !== current);
            if (fallback) speakerQueue.push(fallback);
            return;
          }
          if (!raw || raw === "STOP" || (Array.isArray(raw) && raw.length === 0)) {
            directorStopped = true;
            return;
          }
          const arr = Array.isArray(raw) ? raw : [raw];
          speakerQueue.push(...arr.filter((n) => participants.includes(n)));
        }

        while (current && speeches < MAX_SPEECHES) {
          emit({ type: "turn_start", agent: current });
          // Only mention Moodlings who have ACTUALLY spoken already — telling
          // a speaker the full cast roster up front makes them address
          // characters who haven't said anything yet.
          const spokenSoFar = speakerHistory.filter((n) => n !== current);
          const reactionNote =
            spokenSoFar.length > 0
              ? `${[...new Set(spokenSoFar)].join(" and ")} already spoke — this is a DEBATE, so look ` +
                `hard for a reason to push back or add friction from your own emotion's specific angle, ` +
                `even on good news (e.g. caution about getting complacent, a cost to moving too fast, a ` +
                `feeling being skipped over). Call them out BY NAME when you disagree. Only agree outright ` +
                `if you genuinely have zero pushback to offer. Only reference Moodlings who have actually ` +
                `spoken already; do not address anyone who hasn't spoken yet.`
              : `You are the first to speak — take a clear stance from your emotion's specific angle, ` +
                `without addressing anyone by name yet.`;
          const text = await askAgentStream(
            openai,
            current,
            `You are ${current} in the Moodling council DEBATE about the user's situation — the group ` +
              `is meant to genuinely disagree, not take turns agreeing and complimenting the user. ` +
              `The debate so far:\n${lines()}\n\n` +
              `Speak as ${current}, fully in character, in ${compact ? "ONE short punchy sentence (under 14 words)" : "1-2 punchy sentences"}. ` +
              `Take a clear stance from your emotion's point of view. ${reactionNote} Never repeat a ` +
              `point already made. Do not prefix your reply with your name.`,
            (delta) => emit({ type: "turn_delta", agent: current, delta })
          );
          transcript.push({ speaker: current, text });
          speakerHistory.push(current);
          speechCounts[current]++;
          emit({ type: "turn_end", agent: current, text });
          speeches++;

          if (speeches >= MAX_SPEECHES) {
            current = null;
            break;
          }
          if (!directorModel) {
            // No director: simple fixed order, one speech each.
            const idx = participants.indexOf(current);
            current = participants[idx + 1] ?? null;
            continue;
          }

          if (speakerQueue.length === 0 && !directorStopped) await refillQueue();

          let next = null;
          while (speakerQueue.length > 0) {
            const candidate = speakerQueue.shift();
            if (candidate && candidate !== current) {
              next = candidate;
              break;
            }
          }
          // The director's plan can legitimately have nothing usable left
          // (e.g. it only suggested repeating the current speaker) — if
          // we're still under the minimum turn count, force a fresh voice
          // in rather than letting the debate end prematurely.
          if (!next && speeches < MIN_SPEECHES) {
            next =
              participants.find((n) => speechCounts[n] === 0 && n !== current) ??
              participants.find((n) => n !== current);
          }
          current = next ? dePingPong(next) : null;
        }

        // ── 3. Wisey always closes with the verdict ──
        if (judge) {
          emit({ type: "turn_start", agent: judge });
          const verdict = await askAgentStream(
            openai,
            judge,
            `You are ${judge}, the judge and moderator of the Moodling council. ` +
              `The debate so far:\n${lines()}\n\n` +
              (compact
                ? `Deliver your verdict in ONE short sentence (under 18 words): weigh the debate and ` +
                  `give the user one balanced next step. Do not prefix your reply with your name.`
                : `Deliver your verdict: in 2-3 sentences, weigh the strongest points made ` +
                  `(mention at least two Moodlings by name), then give the user ONE balanced next step. ` +
                  `Do not prefix your reply with your name.`),
            (delta) => emit({ type: "turn_delta", agent: judge, delta })
          );
          transcript.push({ speaker: judge, text: verdict });
          emit({ type: "turn_end", agent: judge, text: verdict });
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
