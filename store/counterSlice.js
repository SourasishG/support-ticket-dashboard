// store/counterSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  myTicketsCount: 0,
  toReviewCount: 0,
  pendingLiveCount: 0,
};

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    setCounts: (state, action) => {
      const { myTicketsCount, toReviewCount } = action.payload;
      if (typeof myTicketsCount === "number") state.myTicketsCount = myTicketsCount;
      if (typeof toReviewCount === "number") state.toReviewCount = toReviewCount;
    },
    setPendingLiveCount: (state, action) => {
      state.pendingLiveCount = action.payload;
    },
    incrementPendingLiveCount: (state, action) => {
      state.pendingLiveCount += action.payload || 1;
    },
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
