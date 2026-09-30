"use client";

import { useDispatch } from "react-redux";
import { clearPendingLiveCount } from "@/store/counterSlice";
import { Button } from "@/components/ui/button";

export default function LiveBanner({ count, onRefresh }) {
  const dispatch = useDispatch();

  if (!count || count <= 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-2.5 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
        </span>
        <p className="text-sm text-violet-300">
          <span className="font-semibold tabular-nums">{count}</span> ticket{count !== 1 ? "s" : ""} updated in the background
        </p>
      </div>
      <Button
        id="live-refresh"
        variant="outline"
        size="sm"
        className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
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
