"use client";

import { PRIORITIES, CATEGORIES, STATUSES } from "@/lib/rules";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TRIAGE_OPTIONS = [
  { value: "auto_accept", label: "Auto Accepted" },
  { value: "manual_review", label: "Needs Review" },
];

export default function FilterBar({ filters, updateFilter, resetFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <Input
          id="filter-search"
          placeholder="Search tickets..."
          className="pl-9 h-9"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
      </div>

      {/* Status */}
      <Select
        value={filters.status || "all"}
        onValueChange={(v) => updateFilter("status", v === "all" ? "" : v)}
      >
        <SelectTrigger id="filter-status" className="w-[140px] h-9" suppressHydrationWarning>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select
        value={filters.priority || "all"}
        onValueChange={(v) => updateFilter("priority", v === "all" ? "" : v)}
      >
        <SelectTrigger id="filter-priority" className="w-[120px] h-9" suppressHydrationWarning>
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        value={filters.category || "all"}
        onValueChange={(v) => updateFilter("category", v === "all" ? "" : v)}
      >
        <SelectTrigger id="filter-category" className="w-[160px] h-9" suppressHydrationWarning>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Triage */}
      <Select
        value={filters.triage_decision || "all"}
        onValueChange={(v) => updateFilter("triage_decision", v === "all" ? "" : v)}
      >
        <SelectTrigger id="filter-triage" className="w-[160px] h-9" suppressHydrationWarning>
          <SelectValue placeholder="Triage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All triage</SelectItem>
          {TRIAGE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      <Button
        id="filter-reset"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={resetFilters}
      >
        Clear
      </Button>
    </div>
  );
}
