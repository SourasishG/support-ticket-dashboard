"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES, CATEGORIES } from "@/lib/rules";

export default function TicketTriageCard({
  ticket,
  triageAction,
  setTriageAction,
  newCategory,
  setNewCategory,
  newPriority,
  setNewPriority,
  triageReason,
  setTriageReason,
  savingTriage,
  onSubmit,
}) {
  return (
    <div className="rounded-xl border border-[#f4aeba] bg-white p-6 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#f4aeba]/50 pb-4">
        <div>
          <h3 className="text-base font-bold text-[#0f172a]">
            Triage Review & Override
          </h3>
          <p className="text-xs text-[#64748b] font-medium">
            Review AI classification or adjust priority and category.
          </p>
        </div>

        {ticket.triage_note && (
          <Badge variant="outline" className="text-xs text-[#64748b] border-[#f4aeba]">
            Reviewed Note Attached
          </Badge>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Radio options */}
        <div className="flex items-center gap-6 text-sm font-medium text-[#0f172a]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="triageAction"
              value="accept"
              checked={triageAction === "accept"}
              onChange={() => setTriageAction("accept")}
              className="accent-[#c54c82]"
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
              className="accent-[#c54c82]"
            />
            <span>Change Category / Priority</span>
          </label>
        </div>

        {triageAction === "change" && (
          <div className="space-y-4 border-t border-[#f4aeba]/50 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b]">
                  Category
                </label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="h-9 border-[#f4aeba] bg-white text-[#0f172a]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#f4aeba]">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-[#0f172a] focus:bg-[#f4aeba]/20 focus:text-[#c54c82]">
                        {c.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b]">
                  Priority
                </label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="h-9 border-[#f4aeba] bg-white text-[#0f172a]">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#f4aeba]">
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="text-[#0f172a] focus:bg-[#f4aeba]/20 focus:text-[#c54c82]">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b]">
                Reason for Override (Min 10 characters) *
              </label>
              <Textarea
                value={triageReason}
                onChange={(e) => setTriageReason(e.target.value)}
                placeholder="Explain why category or priority was changed..."
                className="min-h-[80px] text-sm border-[#f4aeba] bg-white text-[#0f172a] focus-visible:ring-[#c54c82]"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={savingTriage}
            className="bg-[#c54c82] hover:bg-[#ec729c] text-white font-bold shadow-xs"
          >
            {savingTriage ? "Saving..." : "Submit Triage Review"}
          </Button>
        </div>
      </form>
    </div>
  );
}
