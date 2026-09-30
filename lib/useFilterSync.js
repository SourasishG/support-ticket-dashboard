"use client";

import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setFilter, setAllFilters, clearFilters } from "@/store/filterSlice";
import { useRouter, useSearchParams } from "next/navigation";

// Sync Redux filter state <-> URL query params (bi-directional)
export function useFilterSync() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useSelector((s) => s.filter);

  // On mount: URL -> Redux
  useEffect(() => {
    const fromUrl = {};
    for (const key of ["status", "priority", "category", "triage_decision", "search"]) {
      const val = searchParams.get(key);
      if (val) fromUrl[key] = val;
    }
    if (Object.keys(fromUrl).length > 0) {
      dispatch(setAllFilters(fromUrl));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Redux -> URL
  const pushFiltersToUrl = useCallback(
    (updatedFilters) => {
      const params = new URLSearchParams();
      const merged = { ...filters, ...updatedFilters };
      for (const [k, v] of Object.entries(merged)) {
        if (v) params.set(k, v);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [filters, router]
  );

  const updateFilter = useCallback(
    (name, value) => {
      dispatch(setFilter({ name, value }));
      pushFiltersToUrl({ [name]: value });
    },
    [dispatch, pushFiltersToUrl]
  );

  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
    router.replace("?", { scroll: false });
  }, [dispatch, router]);

  return { filters, updateFilter, resetFilters };
}
