// app/api/tickets/[id]/status/route.js
import { updateTicketStatus } from "@/lib/db";
import { withChaos } from "@/lib/chaos";

export const PATCH = withChaos(async (request, { params }) => {
  const { id } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body;
  if (!status) {
    return Response.json({ error: "Status is required" }, { status: 400 });
  }

  const result = updateTicketStatus(id, status);

  if (!result.success) {
    return Response.json({ error: result.message }, { status: result.status });
  }

  return Response.json(result.ticket);
});
