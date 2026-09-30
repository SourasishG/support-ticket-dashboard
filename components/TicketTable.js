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
  P0: "bg-red-500/15 text-red-400 border-red-500/30",
  P1: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  P2: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  P3: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const STATUS_COLORS = {
  open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  resolved: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  closed: "bg-zinc-800/40 text-zinc-500 border-zinc-700/30",
};

const DEADLINE_COLORS = {
  late: "text-red-400",
  at_risk: "text-amber-400",
  on_track: "text-emerald-400",
};

function DeadlineBadge({ createdAt, priority, status }) {
  if (status === "resolved" || status === "closed") {
    return <span className="text-xs text-zinc-500">—</span>;
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
    <span title={flags.join(", ")} className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
  );
}

export function TicketTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <p className="text-sm">No tickets match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[90px]">Priority</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[130px]">Category</TableHead>
              <TableHead className="w-[90px]">Plan</TableHead>
              <TableHead className="w-[100px]">Deadline</TableHead>
              <TableHead className="w-[110px]">Triage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow
                key={t.external_id}
                className="group cursor-pointer border-border/30 transition-colors hover:bg-accent/50"
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <Link href={`/tickets/${t.external_id}`} className="hover:text-foreground transition-colors">
                    {t.external_id}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <Link href={`/tickets/${t.external_id}`} className="block">
                    <span className="truncate block text-sm font-medium group-hover:text-foreground transition-colors">
                      {stripHtml(t.subject) || "(no subject)"}
                      <DataFlagDots flags={t.data_flags} />
                    </span>
                    {t.summary && (
                      <span className="truncate block text-xs text-muted-foreground mt-0.5">
                        {stripHtml(t.summary)}
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[t.priority] || ""}`}>
                    {t.priority}
                    {t.ai_priority && t.ai_priority !== t.priority && (
                      <span className="ml-1 opacity-60">← {t.ai_priority}</span>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[t.status] || ""}`}>
                    {t.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground capitalize">{t.category.replace("_", " ")}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={t.customer_plan === "enterprise" ? "default" : "secondary"} className="text-xs capitalize">
                    {t.customer_plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DeadlineBadge createdAt={t.created_at} priority={t.priority} status={t.status} />
                </TableCell>
                <TableCell>
                  {t.triage_decision === "manual_review" && !t.reviewed ? (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs animate-pulse">
                      Review
                    </Badge>
                  ) : t.reviewed ? (
                    <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                      Reviewed
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Auto</span>
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
          <p className="text-sm text-muted-foreground tabular-nums">
            {total.toLocaleString()} ticket{total !== 1 ? "s" : ""} · Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              id="page-prev"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              id="page-next"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
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
