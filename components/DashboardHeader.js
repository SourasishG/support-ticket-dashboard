"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setActiveAgent } from "@/store/agentSlice";
import { AGENTS } from "@/lib/rules";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DashboardHeader() {
  const dispatch = useDispatch();
  const activeAgentId = useSelector((s) => s.agent.activeAgentId);
  const { myTicketsCount, toReviewCount } = useSelector((s) => s.counter);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentValue = mounted ? activeAgentId : "agent-1";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-6">
        {/* Left: Branding */}
        <Link href="/tickets" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 transition-shadow group-hover:shadow-violet-500/40">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Support Dashboard
          </span>
        </Link>

        {/* Centre: Quick counts */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/tickets?status=in_progress" className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-sm transition-colors hover:bg-accent">
            <span className="text-muted-foreground">My Tickets</span>
            <Badge variant="secondary" className="tabular-nums" suppressHydrationWarning>
              {myTicketsCount}
            </Badge>
          </Link>
          <Link href="/tickets?triage_decision=manual_review" className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-sm transition-colors hover:bg-amber-500/10">
            <span className="text-amber-400">To Review</span>
            <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 tabular-nums" suppressHydrationWarning>
              {toReviewCount}
            </Badge>
          </Link>
        </div>

        {/* Right: Agent picker */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-muted-foreground">Viewing&nbsp;as</span>
          <Select
            value={currentValue}
            onValueChange={(val) => dispatch(setActiveAgent(val))}
          >
            <SelectTrigger id="agent-picker" className="w-[140px] h-9" suppressHydrationWarning>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGENTS.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ({a.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
