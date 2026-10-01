// store/counterSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * REDUX SLICE: counterSlice
 * Manages badge counters shown in the header ("My Tickets", "To Review", "Live Updates").
 */
const initialState = {
  myTicketsCount: 0,
  toReviewCount: 0,
  pendingLiveCount: 0,
};

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    // Set header badge counts for "My Tickets" and "To Review"
    setCounts: (state, action) => {
      const { myTicketsCount, toReviewCount } = action.payload;
      if (typeof myTicketsCount === "number") state.myTicketsCount = myTicketsCount;
      if (typeof toReviewCount === "number") state.toReviewCount = toReviewCount;
    },
    setPendingLiveCount: (state, action) => {
      state.pendingLiveCount = action.payload;
    },
    // Increment count when live polling detects new ticket updates
    incrementPendingLiveCount: (state, action) => {
      state.pendingLiveCount += action.payload || 1;
    },
    // Clear live update count when user clicks "Refresh now"
    clearPendingLiveCount: (state) => {
      state.pendingLiveCount = 0;
    },
  },
});

export const {
  setCounts,
  setPendingLiveCount,
  incrementPendingLiveCount,
  clearPendingLiveCount,
} = counterSlice.actions;

export default counterSlice.reducer;

