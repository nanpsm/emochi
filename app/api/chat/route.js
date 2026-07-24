import { getFoundryProject } from "@/lib/foundry";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agent, message, previousResponseId } = payload;

  if (!agent || typeof agent !== "string") {
    return Response.json({ error: "Missing 'agent' name" }, { status: 400 });
  }
  if (!message || typeof message !== "string") {
    return Response.json({ error: "Missing 'message'" }, { status: 400 });
  }

  try {
    const openai = getFoundryProject().getOpenAIClient();

    // The Foundry Responses API routes the request to a hosted prompt agent
    // via the non-standard `agent` body field, so the whole payload goes
    // through the raw-body escape hatch (options.body replaces the params).
    const response = await openai.responses.create(
      {},
      {
        body: {
          input: message,
          ...(previousResponseId
            ? { previous_response_id: previousResponseId }
            : {}),
          agent_reference: { name: agent, type: "agent_reference" },
        },
      }
    );

    // Agents with file-search tools can leak raw citation markers like
    // 【6:6†source】 into output_text — strip them for display.
    const reply = (response.output_text ?? "").replace(/【[^】]*】/g, "").trim();

    return Response.json({
      reply,
      responseId: response.id,
    });
  } catch (err) {
    console.error(`Chat with agent '${agent}' failed:`, err);
    return Response.json(
      { error: err.message ?? "Agent request failed" },
      { status: err.status ?? 500 }
    );
  }
}
