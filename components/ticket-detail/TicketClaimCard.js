"use client";

import { Button } from "@/components/ui/button";
import { AGENTS } from "@/lib/rules";

export default function TicketClaimCard({
  ticket,
  activeAgentId,
  claiming,
  onClaim,
}) {
  const isAssignedToActive = ticket.assigned_to === activeAgentId;
  const assignedAgentName = ticket.assigned_to
    ? AGENTS.find((a) => a.id === ticket.assigned_to)?.name || ticket.assigned_to
    : "Unassigned";

  return (
    <div className="rounded-xl border border-[#f4aeba] bg-white p-5 space-y-4 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
        Assignment & Claiming
      </h3>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[#64748b] font-medium">Assigned Agent:</span>
        <span className="font-bold text-[#0f172a]">{assignedAgentName}</span>
      </div>

      <Button
        onClick={onClaim}
        disabled={claiming || isAssignedToActive}
        className="w-full bg-gradient-to-r from-[#c54c82] to-[#ec729c] hover:from-[#ec729c] hover:to-[#c54c82] text-white font-bold shadow-md shadow-[#c54c82]/20 disabled:opacity-50"
      >
        {claiming ? (
          "Claiming Ticket..."
        ) : isAssignedToActive ? (
          "Assigned to You ✓"
        ) : (
          `Claim Ticket as ${activeAgentId}`
        )}
      </Button>
    </div>
  );
}
