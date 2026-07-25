import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFoundryProject } from "@/lib/foundry";
import { getPool, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMOTIONS = ["Cheer", "Fear", "Buzzy", "Tear", "Zen", "Bubble", "Dozy"];
const clean = (text) => (text ?? "").replace(/【[^】]*】/g, "").trim();

async function askAgent(openai, agentName, message) {
  const r = await openai.responses.create(
    {},
    { body: { input: message, agent_reference: { name: agentName, type: "agent_reference" } } }
  );
  return clean(r.output_text);
}

export async function POST(req) {
  try {
    const session = await auth();
    const { decision, topic, verdictText } = await req.json();

    if (!decision) return NextResponse.json({ error: "Missing decision" }, { status: 400 });

    const project = getFoundryProject();
    const openai = project.getOpenAIClient();

    // Ask Wisey which emotions increase and decrease based on the user's decision
    const prompt =
      `You are Wisey, the wise judge of the Moodling council. ` +
      `Each emotion character represents a feeling — a HIGHER score means the user feels MORE of that emotion: ` +
      `Cheer = happiness/excitement (high = very happy), ` +
      `Fear = anxiety/worry (high = very anxious), ` +
      `Buzzy = restlessness/overstimulation (high = overwhelmed/buzzing), ` +
      `Tear = sadness (high = very sad), ` +
      `Zen = calm/peace (high = very calm), ` +
      `Bubble = playfulness/social energy (high = very playful), ` +
      `Dozy = tiredness/sleepiness (high = very tired). ` +
      `The debate topic was: "${topic}". ` +
      `Your verdict was: "${verdictText}". ` +
      `The user responded with this decision: "${decision}". ` +
      `Based on their decision, pick exactly 2 emotions that are MOST DIRECTLY and OBVIOUSLY affected, ` +
      `and exactly 2 emotions that are MOST DIRECTLY and OBVIOUSLY reduced. ` +
      `Be strict: only choose an emotion if the connection is clear and direct, not speculative or indirect. ` +
      `For example, skipping a hackathon to rest → Zen increases (more calm), Dozy decreases (less tired), Fear decreases (less stressed). ` +
      `Do NOT pick Tear unless the decision clearly and directly causes sadness. ` +
      `Do NOT pick emotions just because they are vaguely possible — only pick the most obvious ones. ` +
      `Think carefully: if the decision leads to rest, Dozy DECREASES (less tired) and Zen INCREASES (more calm). If it leads to stress, Fear INCREASES and Zen DECREASES. ` +
      `Choose only from this list: ${EMOTIONS.join(", ")}. ` +
      `The increase and decrease lists must not overlap. ` +
      `Reply ONLY with this JSON and nothing else: ` +
      `{"increase": ["Name1", "Name2"], "decrease": ["Name1", "Name2"]}`;

    const raw = await askAgent(openai, "Wisey", prompt);

    // Parse JSON from Wisey's response
    let increase = [], decrease = [];
    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        increase = (parsed.increase ?? []).filter(n => EMOTIONS.includes(n)).slice(0, 2);
        decrease = (parsed.decrease ?? []).filter(n => EMOTIONS.includes(n) && !increase.includes(n)).slice(0, 2);
      } catch {}
    }

    // Fallback if Wisey didn't return clean JSON
    if (increase.length < 2 || decrease.length < 2) {
      increase = ["Cheer", "Zen"];
      decrease = ["Buzzy", "Fear"];
    }

    // Save score changes to DB if user is logged in
    if (session?.user?.dbId) {
      try {
        const pool = await getPool();
        const userId = session.user.dbId;

        // Get emochi_types
        const types = await pool.request().query(`SELECT id, name FROM emochi_types`);
        const typeMap = Object.fromEntries(types.recordset.map(r => [r.name, r.id]));

        for (const name of increase) {
          const emochiId = typeMap[name];
          if (!emochiId) continue;
          await pool.request()
            .input("uid", sql.UniqueIdentifier, userId)
            .input("eid", sql.Int, emochiId)
            .input("delta", sql.Int, 3)
            .query(`
              MERGE user_emochi_scores AS t
              USING (SELECT @uid AS user_id, @eid AS emochi_id) AS s
              ON t.user_id = s.user_id AND t.emochi_id = s.emochi_id
              WHEN MATCHED THEN
                UPDATE SET score = LEAST(100, score + @delta)
              WHEN NOT MATCHED THEN
                INSERT (user_id, emochi_id, score) VALUES (@uid, @eid, @delta);
            `);
        }

        for (const name of decrease) {
          const emochiId = typeMap[name];
          if (!emochiId) continue;
          await pool.request()
            .input("uid", sql.UniqueIdentifier, userId)
            .input("eid", sql.Int, emochiId)
            .input("delta", sql.Int, 3)
            .query(`
              MERGE user_emochi_scores AS t
              USING (SELECT @uid AS user_id, @eid AS emochi_id) AS s
              ON t.user_id = s.user_id AND t.emochi_id = s.emochi_id
              WHEN MATCHED THEN
                UPDATE SET score = GREATEST(0, score - @delta)
              WHEN NOT MATCHED THEN
                INSERT (user_id, emochi_id, score) VALUES (@uid, @eid, 0);
            `);
        }

        // Also record in daily_score_history
        const today = new Date().toISOString().split("T")[0];
        for (const name of [...increase, ...decrease]) {
          const emochiId = typeMap[name];
          if (!emochiId) continue;
          const scoreRow = await pool.request()
            .input("uid", sql.UniqueIdentifier, userId)
            .input("eid", sql.Int, emochiId)
            .query(`SELECT score FROM user_emochi_scores WHERE user_id = @uid AND emochi_id = @eid`);
          const score = scoreRow.recordset[0]?.score ?? 0;
          await pool.request()
            .input("uid",  sql.UniqueIdentifier, userId)
            .input("eid",  sql.Int, emochiId)
            .input("score", sql.Int, score)
            .query(`
              MERGE daily_score_history AS t
              USING (SELECT @uid u, @eid e, CAST(SYSDATETIMEOFFSET() AS DATE) d) AS s
              ON t.user_id = s.u AND t.emochi_id = s.e AND CAST(t.recorded_at AS DATE) = s.d
              WHEN MATCHED THEN UPDATE SET score = @score, recorded_at = SYSDATETIMEOFFSET()
              WHEN NOT MATCHED THEN INSERT (user_id, emochi_id, score) VALUES (@uid, @eid, @score);
            `);
        }
      } catch (dbErr) {
        console.error("DB score update failed:", dbErr?.message);
      }
    }

    return NextResponse.json({ increase, decrease });
  } catch (err) {
    console.error("verdict-result error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
