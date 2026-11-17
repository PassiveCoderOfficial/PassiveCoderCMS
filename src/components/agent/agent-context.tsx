"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type AgentScope = "general" | "editor";

interface AgentContextValue {
  scope: AgentScope;
  pageId: string | null;
  setEditorContext: (ctx: { pageId: string }) => void;
  clearEditorContext: () => void;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentContextProvider({ children }: { children: React.ReactNode }) {
  const [pageId, setPageId] = useState<string | null>(null);

  const setEditorContext = useCallback((ctx: { pageId: string }) => {
    setPageId(ctx.pageId);
  }, []);

  const clearEditorContext = useCallback(() => {
    setPageId(null);
  }, []);

  const value = useMemo<AgentContextValue>(() => ({
    scope: pageId ? "editor" : "general",
    pageId,
    setEditorContext,
    clearEditorContext,
  }), [pageId, setEditorContext, clearEditorContext]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgentContext(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgentContext must be used within an AgentContextProvider");
  return ctx;
}
