"use client";

import { Badge } from "@/components/ui/badge";
import { getDeadlineInfo } from "@/lib/deadline";

export default function TicketSlaCard({ ticket, nowMs }) {
  const deadlineInfo = getDeadlineInfo(ticket.created_at, ticket.priority, nowMs);
  const isPaused = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="rounded-xl border border-[#f4aeba] bg-white p-5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
          SLA Deadline
        </h3>
        <Badge
          variant="outline"
          className={`text-[10px] uppercase font-mono font-bold ${
            deadlineInfo.status === "late"
              ? "border-red-400 text-red-700 bg-red-50"
              : deadlineInfo.status === "at_risk"
              ? "border-[#c54c82] text-[#c54c82] bg-[#fdfdcb]"
              : "border-emerald-300 text-emerald-800 bg-emerald-50"
          }`}
        >
          {deadlineInfo.status.replace("_", " ")}
        </Badge>
      </div>

      {isPaused ? (
        <p className="text-xs text-[#64748b] italic">
          Ticket is {ticket.status}. SLA clock paused.
        </p>
      ) : (
        <div className="space-y-2">
          <div
            suppressHydrationWarning
            className={`text-2xl font-mono font-bold tabular-nums ${
              deadlineInfo.status === "late"
                ? "text-red-600"
                : deadlineInfo.status === "at_risk"
                ? "text-[#c54c82]"
                : "text-emerald-700"
            }`}
          >
            {deadlineInfo.countdown}
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-[#f4aeba]/40">
            <div
              className={`h-full transition-all duration-500 ${
                deadlineInfo.status === "late"
                  ? "bg-red-500"
                  : deadlineInfo.status === "at_risk"
                  ? "bg-[#c54c82]"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, deadlineInfo.percentLeft)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
