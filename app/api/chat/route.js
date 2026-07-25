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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const openai = getFoundryProject().getOpenAIClient();

        // The Foundry Responses API routes the request to a hosted prompt
        // agent via the non-standard `agent_reference` body field, so the
        // whole payload goes through the raw-body escape hatch (options.body
        // replaces the params). Passing `{stream:true}` as the first arg
        // (rather than the payload) is what makes the SDK actually treat
        // this as a streaming call — the streaming flag is read from that
        // first argument internally, not from options.body.
        const agentStream = await openai.responses.create(
          { stream: true },
          {
            body: {
              input: message,
              ...(previousResponseId
                ? { previous_response_id: previousResponseId }
                : {}),
              agent_reference: { name: agent, type: "agent_reference" },
              stream: true,
            },
          }
        );

        let responseId = null;
        for await (const event of agentStream) {
          if (event.type === "response.output_text.delta") {
            emit({ type: "delta", text: event.delta });
          } else if (event.type === "response.completed") {
            responseId = event.response.id;
          }
        }
        emit({ type: "done", responseId });
      } catch (err) {
        console.error(`Chat with agent '${agent}' failed:`, err);
        emit({ type: "error", message: err.message ?? "Agent request failed" });
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
