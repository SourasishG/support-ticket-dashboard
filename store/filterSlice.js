// store/filterSlice.js
import { createSlice } from "@reduxjs/toolkit";

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
    setFilter: (state, action) => {
      const { name, value } = action.payload;
      state[name] = value;
    },
    setAllFilters: (state, action) => {
      return { ...state, ...action.payload };
    },
    clearFilters: () => initialState,
  },
});

export const { setFilter, setAllFilters, clearFilters } = filterSlice.actions;
export default filterSlice.reducer;
