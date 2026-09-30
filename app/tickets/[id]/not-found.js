"use client";

import Link from "next/link";

export default function TicketNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold">Ticket not found</h1>
      <p className="text-muted-foreground text-sm">
        The ticket you are looking for does not exist or has been removed.
      </p>
      <Link
        href="/tickets"
        className="mt-2 text-sm text-violet-400 underline underline-offset-4 hover:text-violet-300"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
