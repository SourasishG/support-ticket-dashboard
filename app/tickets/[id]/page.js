"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithRetryAsync } from "@/lib/useFetchWithRetry";

import TicketBodyCard from "@/components/ticket-detail/TicketBodyCard";
import TicketTriageCard from "@/components/ticket-detail/TicketTriageCard";
import TicketClaimCard from "@/components/ticket-detail/TicketClaimCard";
import TicketSlaCard from "@/components/ticket-detail/TicketSlaCard";
import TicketStatusCard from "@/components/ticket-detail/TicketStatusCard";
import TicketMetaCard from "@/components/ticket-detail/TicketMetaCard";

const STATUS_BADGES = {
  open: "bg-[#ec729c]/20 text-[#c54c82] border-[#ec729c]/40 font-semibold",
  in_progress: "bg-[#c54c82] text-white font-semibold shadow-xs",
  resolved: "bg-slate-100 text-slate-700 border-slate-300",
  closed: "bg-slate-200 text-slate-500 border-slate-300",
};

const TRIAGE_BADGES = {
  auto_accept: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
  manual_review: "bg-[#fdfdcb] text-[#c54c82] border-[#c54c82] font-bold animate-pulse",
  maybe: "bg-[#f4aeba]/30 text-[#c54c82] border-[#f4aeba] font-semibold",
};

export default function TicketDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const activeAgentId = useSelector((s) => s.agent.activeAgentId);

  // Core State
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Loading States
  const [claiming, setClaiming] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingTriage, setSavingTriage] = useState(false);
  const [retriaging, setRetriaging] = useState(false);

  // Live Timer State
  const [nowMs, setNowMs] = useState(Date.now());

  // Triage Form State
  const [triageAction, setTriageAction] = useState("accept");
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [triageReason, setTriageReason] = useState("");

  // API 1: Fetch Ticket
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

  // SLA Live Timer Effect (1 second tick)
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // API 2: Claim Ticket
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

  // API 3: Change Ticket Status
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

  // API 4: Submit Triage Review / Override
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

  // API 5: Server-side AI Re-Triage
  const handleRetriage = async () => {
    try {
      setRetriaging(true);
      setActionError(null);
      setActionSuccess(null);

      const data = await fetchWithRetryAsync(
        `/api/tickets/${encodeURIComponent(id)}/retriage`,
        { method: "POST" }
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
        <Skeleton className="h-8 w-48 bg-slate-100" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-12 w-3/4 bg-slate-100" />
            <Skeleton className="h-40 w-full bg-slate-100" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-16 text-center bg-white min-h-screen">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-[#0f172a]">{error || "Ticket Not Found"}</h2>
        <p className="text-[#64748b] mt-2 text-sm">
          The requested ticket ID does not exist or failed to load.
        </p>
        <Link href="/tickets">
          <Button variant="outline" className="mt-6 border-[#f4aeba] text-[#0f172a] hover:bg-[#f4aeba]/20">
            ← Back to Ticket List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-8 bg-white min-h-screen">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f4aeba] pb-6">
        <div className="flex items-center gap-4">
          <Link href="/tickets">
            <Button variant="outline" size="sm" className="gap-2 border-[#f4aeba] text-[#0f172a] hover:bg-[#f4aeba]/20 font-medium">
              ← Tickets
            </Button>
          </Link>
          <div className="h-4 w-px bg-[#f4aeba]" />
          <span className="font-mono text-sm text-[#64748b] font-bold">
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
            className="gap-2 border-[#f4aeba] text-[#c54c82] hover:bg-[#f4aeba]/20 font-semibold"
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

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 font-medium">
          <div className="flex items-center gap-2">
            <span>🚨</span>
            <span>{actionError}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionError(null)}
            className="text-red-700 hover:bg-red-100 h-7 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Action Success Banner */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 font-medium">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{actionSuccess}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-800 hover:bg-emerald-100 h-7 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Modular 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <TicketBodyCard ticket={ticket} />

          <TicketTriageCard
            ticket={ticket}
            triageAction={triageAction}
            setTriageAction={setTriageAction}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            newPriority={newPriority}
            setNewPriority={setNewPriority}
            triageReason={triageReason}
            setTriageReason={setTriageReason}
            savingTriage={savingTriage}
            onSubmit={handleTriageSubmit}
          />
        </div>

        {/* Right 1 Column: Actions & Metadata Sidebar */}
        <div className="space-y-6">
          <TicketClaimCard
            ticket={ticket}
            activeAgentId={activeAgentId}
            claiming={claiming}
            onClaim={handleClaim}
          />

          <TicketSlaCard ticket={ticket} nowMs={nowMs} />

          <TicketStatusCard
            ticket={ticket}
            updatingStatus={updatingStatus}
            onStatusMove={handleStatusMove}
          />

          <TicketMetaCard ticket={ticket} />
        </div>
      </div>
    </div>
  );
}
