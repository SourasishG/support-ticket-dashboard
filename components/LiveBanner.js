"use client";

import { useDispatch } from "react-redux";
import { clearPendingLiveCount } from "@/store/counterSlice";
import { Button } from "@/components/ui/button";

export default function LiveBanner({ count, onRefresh }) {
  const dispatch = useDispatch();

  if (!count || count <= 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#f4aeba] bg-[#fdfdcb] px-4 py-2.5 shadow-xs animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec729c] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#c54c82]" />
        </span>
        <p className="text-sm font-medium text-[#0f172a]">
          <span className="font-bold text-[#c54c82] tabular-nums">{count}</span> ticket{count !== 1 ? "s" : ""} updated in the background
        </p>
      </div>
      <Button
        id="live-refresh"
        size="sm"
        className="bg-[#c54c82] hover:bg-[#ec729c] text-white shadow-xs"
        onClick={() => {
          dispatch(clearPendingLiveCount());
          if (onRefresh) onRefresh();
        }}
      >
        Refresh now
      </Button>
    </div>
  );
}
