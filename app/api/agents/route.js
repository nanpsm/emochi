import { getFoundryProject } from "@/lib/foundry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const agents = [];
    for await (const agent of getFoundryProject().agents.list()) {
      agents.push({
        id: agent.id,
        name: agent.name,
        state: agent.state,
        description:
          agent.versions?.latest?.description ??
          agent.versions?.latest?.definition?.description ??
          null,
      });
    }
    return Response.json({ agents });
  } catch (err) {
    console.error("Failed to list Foundry agents:", err);
    return Response.json(
      { error: err.message ?? "Failed to list agents" },
      { status: 500 }
    );
  }
}
