// Small context scoped to one page-editing session (pages/[pageId]/_layout),
// shared by the blocks list screen and the block detail screen so editing a
// block doesn't require a full page refetch between the two screens. Holds
// the full Page plus a dirty flag; screens read/write via the hook below.

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getPage } from "./queries/pages";
import type { Block, Page } from "./types";

interface PageEditContextValue {
  page: Page | null;
  loading: boolean;
  error: string | null;
  dirty: boolean;
  setBlocks: (blocks: Block[]) => void;
  markSaved: () => void;
  reload: () => Promise<void>;
}

const PageEditContext = createContext<PageEditContextValue | null>(null);

export function PageEditProvider({ pageId, children }: { pageId: string; children: React.ReactNode }) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getPage(pageId);
      setPage(p);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load page");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (pageId) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const setBlocks = useCallback((blocks: Block[]) => {
    setPage((prev) => (prev ? { ...prev, blocks } : prev));
    setDirty(true);
  }, []);

  const markSaved = useCallback(() => setDirty(false), []);

  return (
    <PageEditContext.Provider value={{ page, loading, error, dirty, setBlocks, markSaved, reload }}>
      {children}
    </PageEditContext.Provider>
  );
}

export function usePageEdit(): PageEditContextValue {
  const ctx = useContext(PageEditContext);
  if (!ctx) throw new Error("usePageEdit must be used within a PageEditProvider");
  return ctx;
}
