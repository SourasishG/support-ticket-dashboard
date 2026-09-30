"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const MAX_RETRIES = 3;
const BASE_DELAY = 500; // ms

export function useFetchWithRetry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchWithRetry = useCallback(async (url, options = {}, retries = MAX_RETRIES) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        if (res.status === 500 && attempt < retries) {
          // Server error — wait and retry (exponential backoff)
          const delay = BASE_DELAY * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        setLoading(false);
        return data;
      } catch (err) {
        if (err.name === "AbortError") {
          setLoading(false);
          return null;
        }
        lastError = err;
        if (attempt < retries && !(err.message || "").includes("Request failed")) {
          const delay = BASE_DELAY * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    setError(lastError?.message || "Request failed after retries");
    setLoading(false);
    throw lastError;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { fetchWithRetry, loading, error, setError };
}
