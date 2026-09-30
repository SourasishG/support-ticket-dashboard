// store/agentSlice.js
import { createSlice } from "@reduxjs/toolkit";

const agentSlice = createSlice({
  name: "agent",
  initialState: {
    activeAgentId: "agent-1", // Deterministic initial state for SSR
  },
  reducers: {
    setActiveAgent: (state, action) => {
      state.activeAgentId = action.payload;
      if (typeof window !== "undefined") {
        localStorage.getItem // safe guard
        localStorage.setItem("active_agent_id", action.payload);
      }
    },
    hydrateAgent: (state) => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("active_agent_id");
        if (saved) {
          state.activeAgentId = saved;
        }
      }
    },
  },
});

export const { setActiveAgent, hydrateAgent } = agentSlice.actions;
export default agentSlice.reducer;

