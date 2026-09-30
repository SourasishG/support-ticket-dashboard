// app/api/tickets/[id]/retriage/route.js
import { getTicketById } from "@/lib/db";
import { withChaos } from "@/lib/chaos";

export const POST = withChaos(async (request, { params }) => {
  const { id } = await params;
  const ticket = getTicketById(id);

  if (!ticket) {
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Verify secret TRIAGE_API_KEY from environment (server-side only!)
  const apiKey = process.env.TRIAGE_API_KEY || "secret_triage_key_123";
  const authHeader = request.headers.get("authorization") || request.headers.get("x-api-key");

  // Re-run fake AI logic
  const categories = ["billing", "bug", "account_access", "feature_request", "other"];
  const priorities = ["P0", "P1", "P2", "P3"];

  // Simulate AI recalculation
  const newCategory = categories[Math.floor(Math.random() * categories.length)];
  let newPriority = priorities[Math.floor(Math.random() * priorities.length)];

  if (ticket.customer_plan === "enterprise" && (newPriority === "P2" || newPriority === "P3")) {
    newPriority = "P1";
  }

  ticket.ai_priority = newPriority !== ticket.priority ? newPriority : ticket.ai_priority;
  ticket.category = newCategory;
  ticket.summary = `Re-triaged: AI re-evaluated ticket body for key intent.`;
  ticket.triage_decision = "manual_review";
  ticket.review_reason = "re_triaged_by_agent";
  ticket.updated_at = new Date().toISOString();

  return Response.json({
    success: true,
    ticket,
    message: "Ticket successfully re-triaged by AI service",
  });
});
