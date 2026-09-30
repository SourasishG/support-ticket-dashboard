// app/api/tickets/[id]/triage/route.js
import { updateTicketTriage } from "@/lib/db";
import { withChaos } from "@/lib/chaos";

export const PATCH = withChaos(async (request, { params }) => {
  const { id } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { category, priority, reason, action = "accept" } = body;

  const result = updateTicketTriage(id, { category, priority, reason, action });

  if (!result.success) {
    return Response.json({ error: result.message }, { status: result.status });
  }

  return Response.json(result.ticket);
});
