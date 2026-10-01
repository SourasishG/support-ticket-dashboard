"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const MAX_RETRIES = 3;
const BASE_DELAY = 500; // ms

export async function fetchWithRetryAsync(url, options = {}, retries = MAX_RETRIES) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if ((res.status === 500 || (res.status === 409 && options?.retryOnConflict)) && attempt < retries) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed (${res.status})`);
      }

      return data;
    } catch (err) {
      if (err.name === "AbortError") return null;
      lastError = err;
      if (attempt < retries && !(err.message || "").includes("Request failed")) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export function useFetchWithRetry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeControllersRef = useRef(new Set());

  const fetchWithRetry = useCallback(async (url, options = {}, retries = MAX_RETRIES) => {
    const controller = new AbortController();
    activeControllersRef.current.add(controller);

    setLoading(true);
    setError(null);

    let lastError = null;

    try {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch(url, {
            ...options,
            signal: options.signal || controller.signal,
          });

          if ((res.status === 500 || (res.status === 409 && options?.retryOnConflict)) && attempt < retries) {
            const delay = BASE_DELAY * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || data.message || `Request failed (${res.status})`);
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
    } finally {
      activeControllersRef.current.delete(controller);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeControllersRef.current.forEach((c) => c.abort());
      activeControllersRef.current.clear();
    };
  }, []);

  return { fetchWithRetry, loading, error, setError };
}

