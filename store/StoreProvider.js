"use client";

import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { hydrateAgent } from "@/store/agentSlice";

export default function StoreProvider({ children }) {
  // Standard React 19 pattern: initialize store once lazily in useState
  const [store] = useState(() => makeStore());

  useEffect(() => {
    store.dispatch(hydrateAgent());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}


