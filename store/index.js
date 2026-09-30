// store/index.js
import { configureStore } from "@reduxjs/toolkit";
import agentReducer from "./agentSlice";
import filterReducer from "./filterSlice";
import counterReducer from "./counterSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      agent: agentReducer,
      filter: filterReducer,
      counter: counterReducer,
    },
  });
