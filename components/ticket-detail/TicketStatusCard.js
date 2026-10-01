"use client";

import { Button } from "@/components/ui/button";
import { TRANSITIONS } from "@/lib/rules";

export default function TicketStatusCard({
  ticket,
  updatingStatus,
  onStatusMove,
}) {
  const availableTransitions = TRANSITIONS[ticket.status] || [];

  return (
    <div className="rounded-xl border border-[#f4aeba] bg-white p-5 space-y-4 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
        Status Actions
      </h3>

      {availableTransitions.length === 0 ? (
        <p className="text-xs text-[#64748b]">
          No status moves allowed from <span className="font-semibold">{ticket.status}</span>.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {availableTransitions.map((nextSt) => (
            <Button
              key={nextSt}
              variant="outline"
              disabled={updatingStatus}
              onClick={() => onStatusMove(nextSt)}
              className="w-full justify-between capitalize border-[#f4aeba] text-[#0f172a] hover:bg-[#f4aeba]/20 font-semibold"
            >
              <span>Move to {nextSt.replace("_", " ")}</span>
              <span>→</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
