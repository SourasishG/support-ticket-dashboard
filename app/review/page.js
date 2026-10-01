"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TicketTable from "@/components/TicketTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { fetchWithRetryAsync } from "@/lib/useFetchWithRetry";

export default function ReviewPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterReason, setFilterReason] = useState("all");

  const fetchReviewTickets = async (p = 1) => {
    setLoading(true);
    try {
      const data = await fetchWithRetryAsync(
        `/api/tickets?triage_decision=manual_review&page=${p}&limit=20`
      );
      if (data) {
        setTickets(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load review tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewTickets(page);
  }, [page]);

  const filteredItems = filterReason === "all"
    ? tickets
    : tickets.filter((t) => t.review_reason === filterReason);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6 bg-white min-h-screen">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#f4aeba] bg-[#fdfdcb] p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
              Manual Triage Review Queue
            </h1>
            <Badge className="bg-[#c54c82] text-white border-none font-bold">
              {total} Pending Review
            </Badge>
          </div>
          <p className="text-xs text-[#64748b] font-medium">
            Tickets in this queue were flagged by the AI for low confidence, empty content, or safety policy checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReviewTickets(page)}
            className="gap-2 border-[#f4aeba] text-[#0f172a] hover:bg-[#f4aeba]/20 font-medium"
          >
            🔄 Refresh Queue
          </Button>
          <Link href="/tickets">
            <Button size="sm" className="bg-[#c54c82] hover:bg-[#ec729c] text-white font-semibold shadow-xs">
              All Tickets →
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter by review reason tabs */}
      <div className="flex flex-wrap gap-2 pt-2 border-b border-[#f4aeba] pb-4">
        {[
          { id: "all", label: "All Flagged" },
          { id: "flagged_input", label: "Prompt Injection / Security" },
          { id: "invalid_output", label: "Invalid Output / Schema" },
          { id: "empty_ticket", label: "Empty / Missing Data" },
          { id: "low_confidence", label: "Low Confidence AI" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={filterReason === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterReason(tab.id)}
            className={
              filterReason === tab.id
                ? "bg-[#c54c82] text-white hover:bg-[#ec729c] border-[#c54c82] font-semibold"
                : "border-[#f4aeba] text-[#0f172a] hover:bg-[#f4aeba]/20 font-medium"
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Ticket Table Component */}
      <TicketTable
        tickets={filteredItems}
        loading={loading}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}
