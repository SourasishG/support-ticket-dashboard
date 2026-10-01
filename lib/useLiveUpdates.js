"use client";

import { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { incrementPendingLiveCount } from "@/store/counterSlice";
import { fetchWithRetryAsync } from "@/lib/useFetchWithRetry";

const POLL_INTERVAL = 4000; // 4 seconds

export function useLiveUpdates({ onNewTickets, enabled = true }) {
  const dispatch = useDispatch();
  const lastPollRef = useRef(new Date().toISOString());
  const timerRef = useRef(null);

  const poll = useCallback(async () => {
    try {
      const since = lastPollRef.current;
      const data = await fetchWithRetryAsync(`/api/tickets/updates?since=${encodeURIComponent(since)}`, {}, 2);
      if (!data) return;

      lastPollRef.current = data.timestamp;

      if (data.count > 0) {
        dispatch(incrementPendingLiveCount(data.count));
        if (onNewTickets) onNewTickets(data.tickets);
      }
    } catch {
      // Silently ignore poll failures after retries
    }
  }, [dispatch, onNewTickets]);

  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [poll, enabled]);

  const resetTimestamp = useCallback(() => {
    lastPollRef.current = new Date().toISOString();
  }, []);

  return { resetTimestamp };
}

