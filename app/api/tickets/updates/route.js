// app/api/tickets/updates/route.js
import { getUpdatesSince } from "@/lib/db";
import { withChaos } from "@/lib/chaos";

export const GET = withChaos(async (request) => {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  if (!since) {
    return Response.json(
      { error: "Query parameter 'since' (ISO timestamp) is required" },
      { status: 400 }
    );
  }

  const updatedTickets = getUpdatesSince(since);

  return Response.json({
    since,
    timestamp: new Date().toISOString(),
    count: updatedTickets.length,
    tickets: updatedTickets,
  });
});
