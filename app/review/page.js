"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TicketTable from "@/components/TicketTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      const res = await fetch(
        `/api/tickets?triage_decision=manual_review&page=${p}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
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
    <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Manual Triage Review Queue
            </h1>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono">
              {total} Pending Review
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Tickets in this queue were flagged by the AI for low confidence, empty content, or safety policy checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReviewTickets(page)}
            className="gap-2 border-border/60 hover:bg-accent"
          >
            🔄 Refresh Queue
          </Button>
          <Link href="/tickets">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
              All Tickets →
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter by review reason tabs */}
      <div className="flex flex-wrap gap-2 pt-2 border-b border-border/40 pb-4">
        {[
          { id: "all", label: "All Flagged" },
          { id: "flagged_input", label: "Prompt Injection / Security" },
          { id: "invalid_output", label: "Invalid Output / Schema" },
          { id: "empty_ticket", label: "Empty / Missing Data" },
          { id: "low_confidence", label: "Low Confidence AI" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={filterReason === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterReason(tab.id)}
            className={
              filterReason === tab.id
                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                : "text-muted-foreground hover:bg-accent"
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
