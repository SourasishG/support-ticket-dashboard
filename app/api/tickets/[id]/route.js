// app/api/tickets/[id]/route.js
import { getTicketById } from "@/lib/db";
import { withChaos } from "@/lib/chaos";

export const GET = withChaos(async (request, { params }) => {
  const { id } = await params;
  const ticket = getTicketById(id);

  if (!ticket) {
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  return Response.json(ticket);
});
