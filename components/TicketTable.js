"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stripHtml } from "@/lib/sanitize";
import { getDeadlineInfo } from "@/lib/deadline";

const PRIORITY_COLORS = {
  P0: "bg-[#c54c82] text-white border-[#c54c82] font-bold shadow-xs",
  P1: "bg-[#ec729c] text-white border-[#ec729c] font-semibold",
  P2: "bg-[#f4aeba] text-[#701a45] border-[#c54c82]/30 font-semibold",
  P3: "bg-[#fdfdcb] text-[#0f172a] border-[#c54c82]/30 font-medium",
};

const STATUS_COLORS = {
  open: "bg-[#ec729c]/20 text-[#c54c82] border-[#ec729c]/40 font-semibold",
  in_progress: "bg-[#c54c82] text-white font-semibold shadow-xs",
  resolved: "bg-slate-100 text-slate-700 border-slate-300",
  closed: "bg-slate-200 text-slate-500 border-slate-300",
};

const DEADLINE_COLORS = {
  late: "text-red-600 font-bold",
  at_risk: "text-[#c54c82] font-semibold",
  on_track: "text-emerald-700 font-medium",
};

function DeadlineBadge({ createdAt, priority, status }) {
  if (status === "resolved" || status === "closed") {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const info = getDeadlineInfo(createdAt, priority);
  return (
    <span suppressHydrationWarning className={`text-xs font-mono tabular-nums ${DEADLINE_COLORS[info.status]}`}>
      {info.countdown}
    </span>
  );
}

function DataFlagDots({ flags }) {
  if (!flags || flags.length === 0) return null;
  return (
    <span title={flags.join(", ")} className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-[#c54c82] animate-pulse" />
  );
}

export function TicketTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export default function TicketTable({
  tickets,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
}) {
  if (loading && (!tickets || tickets.length === 0)) {
    return <TicketTableSkeleton />;
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#64748b] gap-2">
        <svg className="h-12 w-12 opacity-40 text-[#c54c82]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <p className="text-sm font-medium text-[#0f172a]">No tickets match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#f4aeba] bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc] border-b border-[#f4aeba]">
              <TableHead className="w-[100px] text-[#0f172a] font-bold">ID</TableHead>
              <TableHead className="text-[#0f172a] font-bold">Subject</TableHead>
              <TableHead className="w-[90px] text-[#0f172a] font-bold">Priority</TableHead>
              <TableHead className="w-[110px] text-[#0f172a] font-bold">Status</TableHead>
              <TableHead className="w-[130px] text-[#0f172a] font-bold">Category</TableHead>
              <TableHead className="w-[90px] text-[#0f172a] font-bold">Plan</TableHead>
              <TableHead className="w-[100px] text-[#0f172a] font-bold">Deadline</TableHead>
              <TableHead className="w-[110px] text-[#0f172a] font-bold">Triage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow
                key={t.external_id}
                className="group cursor-pointer border-b border-[#f4aeba]/40 transition-colors hover:bg-[#fdfdcb]/60"
              >
                <TableCell className="font-mono text-xs font-semibold text-[#64748b]">
                  <Link href={`/tickets/${t.external_id}`} className="hover:text-[#c54c82] transition-colors">
                    {t.external_id}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <Link href={`/tickets/${t.external_id}`} className="block">
                    <span className="truncate block text-sm font-bold text-[#0f172a] group-hover:text-[#c54c82] transition-colors">
                      {stripHtml(t.subject) || "(no subject)"}
                      <DataFlagDots flags={t.data_flags} />
                    </span>
                    {t.summary && (
                      <span className="truncate block text-xs text-[#64748b] mt-0.5">
                        {stripHtml(t.summary)}
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[t.priority] || ""}`}>
                    {t.priority}
                    {t.ai_priority && t.ai_priority !== t.priority && (
                      <span className="ml-1 opacity-70">← {t.ai_priority}</span>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[t.status] || ""}`}>
                    {t.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium text-[#64748b] capitalize">{t.category.replace("_", " ")}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      t.customer_plan === "enterprise"
                        ? "bg-[#c54c82] text-white border-[#c54c82] font-semibold text-xs capitalize"
                        : "bg-slate-100 text-[#0f172a] border-slate-300 text-xs capitalize"
                    }
                  >
                    {t.customer_plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DeadlineBadge createdAt={t.created_at} priority={t.priority} status={t.status} />
                </TableCell>
                <TableCell>
                  {t.triage_decision === "manual_review" && !t.reviewed ? (
                    <Badge className="bg-[#fdfdcb] text-[#c54c82] border border-[#c54c82] text-xs font-bold animate-pulse">
                      Review
                    </Badge>
                  ) : t.reviewed ? (
                    <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-300 font-semibold">
                      Reviewed
                    </Badge>
                  ) : (
                    <span className="text-xs font-medium text-[#64748b]">Auto</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-medium text-[#64748b] tabular-nums">
            {total.toLocaleString()} ticket{total !== 1 ? "s" : ""} · Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              id="page-prev"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              className="border-[#f4aeba] text-[#0f172a] hover:bg-[#f4aeba]/20 disabled:opacity-40"
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              id="page-next"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              className="border-[#f4aeba] text-[#0f172a] hover:bg-[#f4aeba]/20 disabled:opacity-40"
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
