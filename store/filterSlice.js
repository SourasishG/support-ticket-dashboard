// store/filterSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * REDUX SLICE: filterSlice
 * Manages dashboard search input and filter dropdown states (status, priority, category, triage_decision).
 */
const initialState = {
  status: "",
  priority: "",
  category: "",
  triage_decision: "",
  search: "",
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    // Update a single filter field (e.g. status = "open")
    setFilter: (state, action) => {
      const { name, value } = action.payload;
      state[name] = value;
    },
    // Update multiple filters at once (used when syncing from URL query params)
    setAllFilters: (state, action) => {
      return { ...state, ...action.payload };
    },
    // Reset all filters back to empty
    clearFilters: () => initialState,
  },
});

export const { setFilter, setAllFilters, clearFilters } = filterSlice.actions;
export default filterSlice.reducer;

