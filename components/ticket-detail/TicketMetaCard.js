"use client";

import { Badge } from "@/components/ui/badge";

const PRIORITY_BADGES = {
  P0: "bg-[#c54c82] text-white border-[#c54c82] font-bold shadow-xs",
  P1: "bg-[#ec729c] text-white border-[#ec729c] font-semibold",
  P2: "bg-[#f4aeba] text-[#701a45] border-[#c54c82]/30 font-semibold",
  P3: "bg-[#fdfdcb] text-[#0f172a] border-[#c54c82]/30 font-medium",
};

const PLAN_BADGES = {
  enterprise: "bg-[#c54c82] text-white font-semibold",
  pro: "bg-[#ec729c]/20 text-[#c54c82] border-[#ec729c]/40 font-medium",
  free: "bg-slate-100 text-slate-700 border-slate-300",
  platinum: "bg-[#fdfdcb] text-[#0f172a] border-[#c54c82]/30 font-semibold",
};

export default function TicketMetaCard({ ticket }) {
  return (
    <div className="rounded-xl border border-[#f4aeba] bg-white p-5 space-y-3 text-sm shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b] border-b border-[#f4aeba]/50 pb-2">
        Ticket Metadata
      </h3>

      <div className="flex justify-between py-1 border-b border-slate-100">
        <span className="text-[#64748b] font-medium">Customer ID:</span>
        <span className="font-mono font-bold text-[#0f172a]">{ticket.customer_id}</span>
      </div>

      <div className="flex justify-between py-1 border-b border-slate-100">
        <span className="text-[#64748b] font-medium">Customer Plan:</span>
        <Badge className={PLAN_BADGES[ticket.customer_plan] || PLAN_BADGES.free}>
          {ticket.customer_plan}
        </Badge>
      </div>

      <div className="flex justify-between py-1 border-b border-slate-100">
        <span className="text-[#64748b] font-medium">Priority:</span>
        <Badge className={PRIORITY_BADGES[ticket.priority]}>
          {ticket.priority}
        </Badge>
      </div>

      <div className="flex justify-between py-1 border-b border-slate-100">
        <span className="text-[#64748b] font-medium">Category:</span>
        <span className="font-semibold text-[#0f172a] capitalize">
          {ticket.category.replace("_", " ")}
        </span>
      </div>

      {ticket.ai_priority && (
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-[#64748b] font-medium">Original AI Priority:</span>
          <span className="font-mono font-bold text-[#c54c82]">{ticket.ai_priority}</span>
        </div>
      )}

      {ticket.review_reason && (
        <div className="flex justify-between py-1">
          <span className="text-[#64748b] font-medium">Review Reason:</span>
          <span className="font-mono text-xs font-bold text-[#c54c82]">{ticket.review_reason}</span>
        </div>
      )}
    </div>
  );
}
