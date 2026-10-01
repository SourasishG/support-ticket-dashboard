"use client";

import { Badge } from "@/components/ui/badge";
import { stripHtml, isSafeUrl, isRtlText } from "@/lib/sanitize";

export default function TicketBodyCard({ ticket }) {
  const cleanSubject = stripHtml(ticket.subject);
  const cleanBody = stripHtml(ticket.body);
  const cleanSummary = stripHtml(ticket.summary);
  const isSubjectRtl = isRtlText(cleanSubject);
  const isBodyRtl = isRtlText(cleanBody);

  const flags = ticket.data_flags || ticket.flags || [];

  return (
    <div className="rounded-xl border border-[#f4aeba] bg-white p-6 space-y-6 shadow-xs">
      {/* Subject & Created Date */}
      <div>
        <h1
          dir={isSubjectRtl ? "rtl" : "ltr"}
          className={`text-2xl font-bold tracking-tight text-[#0f172a] ${
            isSubjectRtl ? "text-right" : "text-left"
          }`}
        >
          {cleanSubject || "(No Subject)"}
        </h1>
        <p className="text-xs font-medium text-[#64748b] mt-1">
          Created on {new Date(ticket.created_at).toLocaleString()}
        </p>
      </div>

      {/* AI Summary Block */}
      {cleanSummary && (
        <div className="rounded-lg border border-[#f4aeba] bg-[#fdfdcb] p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#c54c82]">
            <span>🤖</span> AI Summary
          </div>
          <p className="text-sm font-medium text-[#0f172a] leading-relaxed">
            {cleanSummary}
          </p>
        </div>
      )}

      {/* Ticket Body Description */}
      <div className="space-y-2 border-t border-[#f4aeba]/50 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
          Description
        </h3>
        <div
          dir={isBodyRtl ? "rtl" : "ltr"}
          className={`text-sm text-[#0f172a] whitespace-pre-wrap leading-relaxed ${
            isBodyRtl ? "text-right font-sans" : "text-left"
          }`}
        >
          {cleanBody || (
            <span className="italic text-[#64748b]">
              No body description provided for this ticket.
            </span>
          )}
        </div>
      </div>

      {/* Attachment Preview & Security Guard */}
      {ticket.attachment_url && (
        <div className="border-t border-[#f4aeba]/50 pt-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
            Attachment
          </h3>
          {isSafeUrl(ticket.attachment_url) ? (
            <a
              href={ticket.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#f4aeba] bg-[#fdfdcb]/40 px-3 py-2 text-xs font-mono font-semibold text-[#c54c82] hover:bg-[#f4aeba]/20 transition-colors"
            >
              <span>📎</span>
              <span className="truncate max-w-md">{ticket.attachment_url}</span>
              <span>↗</span>
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 font-mono font-semibold">
              <span>🚫</span>
              <span>Unsafe Link Blocked (XSS Guard): {ticket.attachment_url}</span>
            </div>
          )}
        </div>
      )}

      {/* Data Quality Audit Flags */}
      {flags.length > 0 && (
        <div className="border-t border-[#f4aeba]/50 pt-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#c54c82] flex items-center gap-1.5">
            <span>🚩</span> Data Quality Flags ({flags.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {flags.map((flag) => (
              <Badge
                key={flag}
                className="bg-[#fdfdcb] text-[#c54c82] border border-[#c54c82]/40 font-mono text-[11px] font-semibold"
              >
                {flag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
