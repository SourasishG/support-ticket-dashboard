"use client";

import { useRef, useEffect } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { hydrateAgent } from "@/store/agentSlice";

export default function StoreProvider({ children }) {
  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    storeRef.current.dispatch(hydrateAgent());
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}

