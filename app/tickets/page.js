"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCounts } from "@/store/counterSlice";
import { useFetchWithRetry } from "@/lib/useFetchWithRetry";
import { useFilterSync } from "@/lib/useFilterSync";
import { useLiveUpdates } from "@/lib/useLiveUpdates";
import DashboardHeader from "@/components/DashboardHeader";
import FilterBar from "@/components/FilterBar";
import TicketTable, { TicketTableSkeleton } from "@/components/TicketTable";
import LiveBanner from "@/components/LiveBanner";

function TicketDashboard() {
  const dispatch = useDispatch();
  const activeAgentId = useSelector((s) => s.agent.activeAgentId);
  const pendingLiveCount = useSelector((s) => s.counter.pendingLiveCount);
  const { filters, updateFilter, resetFilters } = useFilterSync();
  const { fetchWithRetry, loading, error } = useFetchWithRetry();

  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadTickets = useCallback(
    async (pageNum = 1) => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", "50");
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.category) params.set("category", filters.category);
      if (filters.triage_decision) params.set("triage_decision", filters.triage_decision);
      if (filters.search) params.set("search", filters.search);

      try {
        const data = await fetchWithRetry(`/api/tickets?${params.toString()}`);
        if (data) {
          setTickets(data.items);
          setTotal(data.total);
          setPage(data.page);
          setTotalPages(data.totalPages);
        }
      } catch {
        // Error is already set in the hook
      }
    },
    [filters, fetchWithRetry]
  );

  // Load tickets when filters change
  useEffect(() => {
    setPage(1);
    loadTickets(1);
  }, [filters.status, filters.priority, filters.category, filters.triage_decision, filters.search]);

  // Also update header counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [myData, reviewData] = await Promise.all([
          fetch(`/api/tickets?status=in_progress&limit=1`).then((r) => r.json()),
          fetch(`/api/tickets?triage_decision=manual_review&limit=1`).then((r) => r.json()),
        ]);
        dispatch(
          setCounts({
            myTicketsCount: myData.total || 0,
            toReviewCount: reviewData.total || 0,
          })
        );
      } catch {
        // ignore count errors
      }
    };
    loadCounts();
  }, [dispatch, tickets]);

  // Live updates
  useLiveUpdates({ enabled: true });

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadTickets(newPage);
  };

  const handleRefresh = () => {
    loadTickets(page);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 py-6 space-y-5">
        {/* Live update banner */}
        <LiveBanner count={pendingLiveCount} onRefresh={handleRefresh} />

        {/* Filters */}
        <FilterBar
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
        />

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
            <button className="ml-auto underline underline-offset-2" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        )}

        {/* Ticket table */}
        <TicketTable
          tickets={tickets}
          loading={loading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<TicketTableSkeleton />}>
      <TicketDashboard />
    </Suspense>
  );
}