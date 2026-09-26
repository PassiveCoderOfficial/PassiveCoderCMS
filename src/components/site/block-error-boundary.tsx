"use client";

import React, { Suspense } from "react";

interface State {
  hasError: boolean;
}

/**
 * Catches a Server Component's render throw and drops just that block,
 * instead of the whole page 500ing.
 *
 * This took two attempts to get right — worth recording why the obvious
 * ones don't work:
 *
 * 1. Wrapping the async renderer function itself in try/catch
 *    (`return await ServerBlockUnsafe(props)`) does NOT work. Most blocks
 *    are plain (non-async) function components rendered as JSX
 *    (`<FeaturesBlock block={block} />`), and JSX only *describes* a call —
 *    React doesn't actually invoke that function's body until it walks the
 *    returned element tree, which happens after the try/catch's
 *    synchronous extent has already closed, even though the outer function
 *    is itself `async`. Verified live: shipped this fix, reproduced the
 *    exact same 500 immediately after.
 * 2. Flattening the block's output to a string via renderToStaticMarkup
 *    inside a try — works for isolation, but silently breaks every
 *    interactive block (contact forms, ENM widgets, marketplace booking,
 *    nav dropdowns — roughly half of all block components are real client
 *    components with hooks and event handlers under `(site)`). Caught this
 *    before shipping it.
 *
 * What actually works: a Server Component's render throw, when that
 * component sits inside a <Suspense> boundary, is caught by React's
 * streaming SSR at that Suspense boundary — and when a client Error
 * Boundary wraps the Suspense, the error reaches the boundary's fallback
 * instead of crashing the segment. This is React/Next's own documented
 * mechanism for exactly this case, not a workaround.
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[page-renderer] block failed to render:", error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/** Wrap one block's server-rendered output with this. Suspense has no
 *  fallback UI here on purpose — the block either resolves in the same
 *  streaming pass (the common case) or errors; there's no real loading
 *  state worth showing per-block on a page that's otherwise ready. */
export function BlockErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>{children}</Suspense>
    </ErrorBoundary>
  );
}
