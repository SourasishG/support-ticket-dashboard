"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { stripHtml, isSafeUrl, isRtlText } from "@/lib/sanitize";
import { getDeadlineInfo } from "@/lib/deadline";
import { PRIORITIES, CATEGORIES, TRANSITIONS, AGENTS } from "@/lib/rules";
import { fetchWithRetryAsync } from "@/lib/useFetchWithRetry";

const PRIORITY_BADGES = {
  P0: "bg-red-500/15 text-red-400 border-red-500/30",
  P1: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  P2: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  P3: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const STATUS_BADGES = {
  open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  resolved: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  closed: "bg-zinc-800/40 text-zinc-500 border-zinc-700/30",
};

const TRIAGE_BADGES = {
  auto_accept: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  manual_review: "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse",
  maybe: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const PLAN_BADGES = {
  enterprise: "bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold",
  pro: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  free: "bg-zinc-700/30 text-zinc-400 border-zinc-700/30",
  platinum: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

export default function TicketDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const activeAgentId = useSelector((s) => s.agent.activeAgentId);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Real-time deadline clock
  const [nowMs, setNowMs] = useState(Date.now());

  // Triage form state
  const [triageAction, setTriageAction] = useState("accept"); // 'accept' | 'change'
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [triageReason, setTriageReason] = useState("");
  const [savingTriage, setSavingTriage] = useState(false);
  const [retriaging, setRetriaging] = useState(false);

  // Fetch ticket details
  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithRetryAsync(`/api/tickets/${encodeURIComponent(id)}`);
      setTicket(data);
      setNewCategory(data.category);
      setNewPriority(data.priority);
    } catch (err) {
      if ((err.message || "").includes("404")) {
        setError("Ticket not found.");
      } else {
        setError(err.message || "Failed to load ticket.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Claim handler
  const handleClaim = async () => {
    try {
      setClaiming(true);
      setActionError(null);
      setActionSuccess(null);

      const data = await fetchWithRetryAsync(
        `/api/tickets/${encodeURIComponent(id)}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent_id: activeAgentId }),
          retryOnConflict: true,
        }
      );

      const updated = data.ticket || data;
      setTicket(updated);
      setActionSuccess(`Ticket successfully claimed by ${activeAgentId}!`);
    } catch (err) {
      setActionError(err.message || "Failed to claim ticket.");
    } finally {
      setClaiming(false);
    }
  };

  // Status transition handler
  const handleStatusMove = async (nextStatus) => {
    try {
      setUpdatingStatus(true);
      setActionError(null);
      setActionSuccess(null);

      const data = await fetchWithRetryAsync(
        `/api/tickets/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const updated = data.ticket || data;
      setTicket(updated);
      setActionSuccess(`Status changed to ${nextStatus}.`);
    } catch (err) {
      setActionError(err.message || "Network error updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Triage submit handler
  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (triageAction === "change") {
      if (!triageReason || triageReason.trim().length < 10) {
        setActionError("Please provide a reason of at least 10 characters for changing triage.");
        return;
      }
      if (ticket.customer_plan === "enterprise" && (newPriority === "P2" || newPriority === "P3")) {
        setActionError("Enterprise tickets must remain at least P1 priority.");
        return;
      }
    }

    try {
      setSavingTriage(true);
      const data = await fetchWithRetryAsync(
        `/api/tickets/${encodeURIComponent(id)}/triage`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: triageAction,
            category: triageAction === "change" ? newCategory : ticket.category,
            priority: triageAction === "change" ? newPriority : ticket.priority,
            reason: triageAction === "change" ? triageReason : "Accepted original triage",
          }),
        }
      );

      const updated = data.ticket || data;
      setTicket(updated);
      setActionSuccess("Triage review submitted successfully.");
    } catch (err) {
      setActionError(err.message || "Network error saving triage review.");
    } finally {
      setSavingTriage(false);
    }
  };

  // Server-side AI Re-Triage handler
  const handleRetriage = async () => {
    try {
      setRetriaging(true);
      setActionError(null);
      setActionSuccess(null);

      const data = await fetchWithRetryAsync(
        `/api/tickets/${encodeURIComponent(id)}/retriage`,
        {
          method: "POST",
        }
      );

      const updated = data.ticket || data;
      setTicket(updated);
      setActionSuccess("AI re-triage completed successfully.");
    } catch (err) {
      setActionError(err.message || "Network error calling AI re-triage.");
    } finally {
      setRetriaging(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-16 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4">
          ⚠️
        </div>
        <h2 className="text-xl font-bold">{error || "Ticket Not Found"}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          The requested ticket ID does not exist or failed to load.
        </p>
        <Link href="/tickets">
          <Button variant="outline" className="mt-6">
            ← Back to Ticket List
          </Button>
        </Link>
      </div>
    );
  }

  const cleanSubject = stripHtml(ticket.subject);
  const cleanBody = stripHtml(ticket.body);
  const cleanSummary = stripHtml(ticket.summary);
  const isSubjectRtl = isRtlText(cleanSubject);
  const isBodyRtl = isRtlText(cleanBody);

  const deadlineInfo = getDeadlineInfo(ticket.created_at, ticket.priority, nowMs);
  const availableTransitions = TRANSITIONS[ticket.status] || [];

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="sm" className="gap-2">
              ← Tickets
            </Button>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <span className="font-mono text-sm text-muted-foreground font-semibold">
            {ticket.external_id}
          </span>
          <Badge className={STATUS_BADGES[ticket.status]}>
            {ticket.status.replace("_", " ")}
          </Badge>
          {ticket.triage_decision && (
            <Badge className={TRIAGE_BADGES[ticket.triage_decision]}>
              {ticket.triage_decision.replace("_", " ")}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetriage}
            disabled={retriaging}
            className="gap-2 border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
          >
            {retriaging ? (
              <span className="animate-spin">🔄</span>
            ) : (
              <span>✨</span>
            )}
            AI Re-Triage
          </Button>
        </div>
      </div>

      {/* Global Action Feedback Banners */}
      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <div className="flex items-center gap-2">
            <span>🚨</span>
            <span>{actionError}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionError(null)}
            className="text-red-400 hover:bg-red-500/20 h-7 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{actionSuccess}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:bg-emerald-500/20 h-7 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Subject & Body */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6 shadow-sm">
            <div>
              <h1
                dir={isSubjectRtl ? "rtl" : "ltr"}
                className={`text-2xl font-bold tracking-tight text-foreground ${
                  isSubjectRtl ? "text-right" : "text-left"
                }`}
              >
                {cleanSubject || "(No Subject)"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Created on {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>

            {/* AI Summary Block */}
            {cleanSummary && (
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <span>🤖</span> AI Summary
                </div>
                <p className="text-sm text-indigo-200/90 leading-relaxed">
                  {cleanSummary}
                </p>
              </div>
            )}

            {/* Ticket Body */}
            <div className="space-y-2 border-t border-border/40 pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </h3>
              <div
                dir={isBodyRtl ? "rtl" : "ltr"}
                className={`text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed ${
                  isBodyRtl ? "text-right font-sans" : "text-left"
                }`}
              >
                {cleanBody || (
                  <span className="italic text-muted-foreground">
                    No body description provided for this ticket.
                  </span>
                )}
              </div>
            </div>

            {/* Attachment preview */}
            {ticket.attachment_url && (
              <div className="border-t border-border/40 pt-4 space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Attachment
                </h3>
                {isSafeUrl(ticket.attachment_url) ? (
                  <a
                    href={ticket.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-accent/40 px-3 py-2 text-xs font-mono text-indigo-400 hover:bg-accent transition-colors"
                  >
                    <span>📎</span>
                    <span className="truncate max-w-md">{ticket.attachment_url}</span>
                    <span>↗</span>
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 font-mono">
                    <span>🚫</span>
                    <span>Unsafe Link Blocked (XSS Guard): {ticket.attachment_url}</span>
                  </div>
                )}
              </div>
            )}

            {/* Data Flags */}
            {(ticket.data_flags || ticket.flags) && (ticket.data_flags || ticket.flags).length > 0 && (
              <div className="border-t border-border/40 pt-4 space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>🚩</span> Data Quality Flags ({(ticket.data_flags || ticket.flags).length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(ticket.data_flags || ticket.flags).map((flag) => (
                    <Badge
                      key={flag}
                      className="bg-amber-500/10 text-amber-400 border-amber-500/30 font-mono text-[11px]"
                    >
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Triage Review Form Card */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Triage Review & Override
                </h3>
                <p className="text-xs text-muted-foreground">
                  Review AI classification or adjust priority and category.
                </p>
              </div>

              {ticket.triage_note && (
                <Badge variant="outline" className="text-xs text-zinc-400">
                  Reviewed Note Attached
                </Badge>
              )}
            </div>

            <form onSubmit={handleTriageSubmit} className="space-y-4">
              {/* Radio options */}
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="triageAction"
                    value="accept"
                    checked={triageAction === "accept"}
                    onChange={() => setTriageAction("accept")}
                    className="accent-violet-500"
                  />
                  <span>Accept Triage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="triageAction"
                    value="change"
                    checked={triageAction === "change"}
                    onChange={() => setTriageAction("change")}
                    className="accent-violet-500"
                  />
                  <span>Change Category / Priority</span>
                </label>
              </div>

              {triageAction === "change" && (
                <div className="space-y-4 border-t border-border/40 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Category
                      </label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Priority
                      </label>
                      <Select value={newPriority} onValueChange={setNewPriority}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Reason for Override (Min 10 characters) *
                    </label>
                    <Textarea
                      value={triageReason}
                      onChange={(e) => setTriageReason(e.target.value)}
                      placeholder="Explain why category or priority was changed..."
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={savingTriage}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {savingTriage ? "Saving..." : "Submit Triage Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Meta & Actions Sidebar */}
        <div className="space-y-6">
          {/* Claim & Assignment Card */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Assignment & Claiming
            </h3>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Assigned Agent:</span>
              <span className="font-semibold text-foreground">
                {ticket.assigned_to
                  ? `${AGENTS.find((a) => a.id === ticket.assigned_to)?.name || ticket.assigned_to}`
                  : "Unassigned"}
              </span>
            </div>

            <Button
              onClick={handleClaim}
              disabled={claiming || ticket.assigned_to === activeAgentId}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20"
            >
              {claiming ? (
                "Claiming Ticket..."
              ) : ticket.assigned_to === activeAgentId ? (
                "Assigned to You ✓"
              ) : (
                `Claim Ticket as ${activeAgentId}`
              )}
            </Button>
          </div>

          {/* Real-time Deadline Countdown Card */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                SLA Deadline
              </h3>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-mono ${
                  deadlineInfo.status === "late"
                    ? "border-red-500/40 text-red-400 bg-red-500/10"
                    : deadlineInfo.status === "at_risk"
                    ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                    : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                }`}
              >
                {deadlineInfo.status.replace("_", " ")}
              </Badge>
            </div>

            {ticket.status === "resolved" || ticket.status === "closed" ? (
              <p className="text-xs text-muted-foreground italic">
                Ticket is {ticket.status}. SLA clock paused.
              </p>
            ) : (
              <div className="space-y-2">
                <div
                  suppressHydrationWarning
                  className={`text-2xl font-mono font-bold tabular-nums ${
                    deadlineInfo.status === "late"
                      ? "text-red-400"
                      : deadlineInfo.status === "at_risk"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {deadlineInfo.countdown}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      deadlineInfo.status === "late"
                        ? "bg-red-500"
                        : deadlineInfo.status === "at_risk"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, deadlineInfo.percentLeft)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Transitions Card */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status Actions
            </h3>

            {availableTransitions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No status moves allowed from <span className="font-semibold">{ticket.status}</span>.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {availableTransitions.map((nextSt) => (
                  <Button
                    key={nextSt}
                    variant="outline"
                    disabled={updatingStatus}
                    onClick={() => handleStatusMove(nextSt)}
                    className="w-full justify-between capitalize border-border/60 hover:bg-accent"
                  >
                    <span>Move to {nextSt.replace("_", " ")}</span>
                    <span>→</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Metadata Card */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3 text-sm shadow-sm">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
              Ticket Metadata
            </h3>

            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-muted-foreground">Customer ID:</span>
              <span className="font-mono text-foreground">{ticket.customer_id}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-muted-foreground">Customer Plan:</span>
              <Badge className={PLAN_BADGES[ticket.customer_plan] || PLAN_BADGES.free}>
                {ticket.customer_plan}
              </Badge>
            </div>

            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-muted-foreground">Priority:</span>
              <Badge className={PRIORITY_BADGES[ticket.priority]}>
                {ticket.priority}
              </Badge>
            </div>

            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium text-foreground capitalize">
                {ticket.category.replace("_", " ")}
              </span>
            </div>

            {ticket.ai_priority && (
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Original AI Priority:</span>
                <span className="font-mono text-amber-400">{ticket.ai_priority}</span>
              </div>
            )}

            {ticket.review_reason && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Review Reason:</span>
                <span className="font-mono text-xs text-amber-400">{ticket.review_reason}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
