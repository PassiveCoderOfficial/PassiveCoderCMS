"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  blockId: string;
  blockType: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * One block crashing must never take the rest of the editor session down —
 * that would strand whoever is mid-edit, unable to even reach the block
 * that's actually broken to fix or delete it. The public-site renderer gets
 * an equivalent async try/catch in page-renderer.tsx (see its comment); this
 * is the client-side counterpart, since a synchronous render throw inside
 * React's own reconciliation can only be caught by a class component error
 * boundary — there is no hook or try/catch equivalent for that on the
 * client. Class component is required here, not a style choice.
 */
export class BlockErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[block-editor] block "${this.props.blockId}" (${this.props.blockType}) crashed:`, error);
  }

  // The wrapper is keyed by block.id in the parent list (stable across
  // edits), so fixing the block's data via the settings panel does NOT
  // remount this boundary or clear a tripped state on its own — React error
  // boundaries only reset on unmount/remount or an explicit state change.
  // Without this, a block the user just fixed would still show the crashed
  // fallback until a full page reload. "Try again" just re-renders children
  // with today's (hopefully now-valid) props.
  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 border-2 border-dashed border-destructive/40 rounded-lg bg-destructive/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-medium text-destructive">This block failed to render</p>
            <p className="text-muted-foreground">
              Type: {this.props.blockType} — delete it or check its settings. The rest of the page is unaffected.
            </p>
          </div>
          <button
            type="button"
            onClick={this.reset}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
