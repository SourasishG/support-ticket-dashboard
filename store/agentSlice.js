// store/agentSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * REDUX SLICE: agentSlice
 * Manages the active agent identity (Priya: agent-1, Rahul: agent-2, Meera: agent-3).
 * Redux Toolkit automatically generates action creators for each reducer function.
 */
const agentSlice = createSlice({
  name: "agent",
  initialState: {
    activeAgentId: "agent-1", // Default to Priya (agent-1)
  },
  reducers: {
    // Reducer to update active agent ID & save preference to browser storage
    setActiveAgent: (state, action) => {
      state.activeAgentId = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("active_agent_id", action.payload);
      }
    },
    // Reducer to restore saved agent preference on app load
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


