// app/api/tickets/[id]/claim/route.js
import { claimTicket } from "@/lib/db";
import { withChaos } from "@/lib/chaos";

export const POST = withChaos(async (request, { params }) => {
  const { id } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch {
    // optional body if query param or header passed
  }

  const agent_id = body.agent_id || new URL(request.url).searchParams.get("agent_id") || "agent-1";

  const result = claimTicket(id, agent_id);

  if (!result.success) {
    return Response.json({ error: result.message }, { status: result.status });
  }

  return Response.json(result.ticket);
});
