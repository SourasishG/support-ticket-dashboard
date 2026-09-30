// app/api/tickets/route.js
import { queryTickets } from "@/lib/db";
import { withChaos } from "@/lib/chaos";

export const GET = withChaos(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const category = searchParams.get("category") || undefined;
  const triage_decision = searchParams.get("triage_decision") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "50";

  const result = queryTickets({
    status,
    priority,
    category,
    triage_decision,
    search,
    page,
    limit,
  });

  return Response.json(result);
});
