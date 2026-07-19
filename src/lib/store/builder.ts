import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Block, BuilderState, BuilderMode, Breakpoint, ContainerBlockProps, MobileSheet } from "@/types/cms";
import { deepClone, generateId } from "@/lib/utils";

const MAX_HISTORY = 50;

/** Identifies a single column's block list inside a container block. One level
 *  of nesting only — a container's columns cannot themselves hold a container. */
export interface ContainerPath {
  containerId: string;
  columnIndex: number;
}

interface BuilderStore extends BuilderState {
  // Actions
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block, afterId?: string, path?: ContainerPath) => void;
  updateBlock: (id: string, data: Partial<Block>, path?: ContainerPath) => void;
  removeBlock: (id: string, path?: ContainerPath) => void;
  moveBlock: (activeId: string, overId: string, path?: ContainerPath) => void;
  /** Relocates a block from wherever it currently lives into a container
   *  column (root -> column, or column -> a different column). Appends to
   *  the end of the destination column. */
  moveBlockToColumn: (blockId: string, to: ContainerPath) => void;
  duplicateBlock: (id: string, path?: ContainerPath) => void;
  selectBlock: (id: string | undefined) => void;
  hoverBlock: (id: string | undefined) => void;
  setMode: (mode: BuilderMode) => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setPageId: (id: string) => void;
  setTenantId: (id: string | undefined) => void;
  setDirty: (dirty: boolean) => void;
  setMobileSheet: (sheet: MobileSheet) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getBlock: (id: string) => Block | undefined;
  getBlockPath: (id: string) => BlockPathEntry[] | undefined;
  reset: () => void;
}

/** Returns the mutable block array a path points at: a container column's
 *  list, or the top-level page blocks when no path is given. */
function targetArray(state: BuilderState, path?: ContainerPath): Block[] | undefined {
  if (!path) return state.blocks;
  const container = state.blocks.find((b) => b.id === path.containerId) as ContainerBlockProps | undefined;
  return container?.data.columns[path.columnIndex]?.blocks;
}

/** One level deep: the array (root, or a container column) that actually
 *  holds the block with this id. Used to auto-locate a block for callers
 *  (existing settings panels) that don't know about container nesting. */
function findArrayContaining(blocks: Block[], id: string): Block[] | undefined {
  if (blocks.some((b) => b.id === id)) return blocks;
  for (const b of blocks) {
    if (b.type === "container") {
      for (const col of (b as ContainerBlockProps).data.columns) {
        if (col.blocks.some((c) => c.id === id)) return col.blocks;
      }
    }
  }
  return undefined;
}

/** One level deep: checks top-level blocks, then each container's columns. */
function findBlockDeep(blocks: Block[], id: string): Block | undefined {
  const direct = blocks.find((b) => b.id === id);
  if (direct) return direct;
  for (const b of blocks) {
    if (b.type === "container") {
      for (const col of (b as ContainerBlockProps).data.columns) {
        const found = col.blocks.find((c) => c.id === id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

/** A single crumb in a block's ancestry, root-first. The last entry is
 *  always the block itself; a mid entry is its parent container (with the
 *  column index it lives in), when nested one level deep. */
export interface BlockPathEntry {
  id: string;
  type: string;
  columnIndex?: number;
}

/** Root -> [container (+ column)] -> block. Container nesting is capped at
 *  one level, so this path is at most 2 entries. */
function getBlockPathDeep(blocks: Block[], id: string): BlockPathEntry[] | undefined {
  const direct = blocks.find((b) => b.id === id);
  if (direct) return [{ id: direct.id, type: direct.type }];
  for (const b of blocks) {
    if (b.type === "container") {
      const columns = (b as ContainerBlockProps).data.columns;
      for (let i = 0; i < columns.length; i++) {
        const found = columns[i].blocks.find((c) => c.id === id);
        if (found) return [{ id: b.id, type: b.type }, { id: found.id, type: found.type, columnIndex: i }];
      }
    }
  }
  return undefined;
}

const initialState: BuilderState = {
  pageId: undefined,
  tenantId: undefined,
  blocks: [],
  selectedBlockId: undefined,
  hoveredBlockId: undefined,
  isDragging: false,
  mode: "edit",
  breakpoint: "desktop",
  history: [],
  historyIndex: -1,
  isDirty: false,
  mobileSheet: null,
};

export const useBuilderStore = create<BuilderStore>()(
  immer((set, get) => ({
    ...initialState,

    setBlocks: (blocks) =>
      set((state) => {
        state.blocks = blocks;
        state.isDirty = true;
      }),

    addBlock: (block, afterId, path) =>
      set((state) => {
        pushHistory(state);
        const arr = targetArray(state, path);
        if (!arr) return;
        if (afterId) {
          const idx = arr.findIndex((b) => b.id === afterId);
          arr.splice(idx + 1, 0, block);
        } else {
          arr.push(block);
        }
        reorderBlocks(arr);
        state.selectedBlockId = block.id;
        state.isDirty = true;
      }),

    updateBlock: (id, data, path) =>
      set((state) => {
        pushHistory(state);
        // Existing per-block settings panels don't know about container
        // nesting and never pass a path — auto-locate the block one level
        // deep so editing a block inside a column still writes to the right
        // place instead of silently no-op'ing.
        const arr = path ? targetArray(state, path) : findArrayContaining(state.blocks, id);
        const idx = arr?.findIndex((b) => b.id === id) ?? -1;
        if (arr && idx !== -1) {
          Object.assign(arr[idx], data);
          state.isDirty = true;
        }
      }),

    removeBlock: (id, path) =>
      set((state) => {
        pushHistory(state);
        const arr = targetArray(state, path);
        if (!arr) return;
        if (path) {
          const container = state.blocks.find((b) => b.id === path.containerId) as ContainerBlockProps | undefined;
          const col = container?.data.columns[path.columnIndex];
          if (col) col.blocks = col.blocks.filter((b) => b.id !== id);
        } else {
          state.blocks = state.blocks.filter((b) => b.id !== id);
        }
        if (state.selectedBlockId === id) state.selectedBlockId = undefined;
        const after = targetArray(state, path);
        if (after) reorderBlocks(after);
        state.isDirty = true;
      }),

    moveBlock: (activeId, overId, path) =>
      set((state) => {
        pushHistory(state);
        const arr = targetArray(state, path);
        if (!arr) return;
        const activeIdx = arr.findIndex((b) => b.id === activeId);
        const overIdx = arr.findIndex((b) => b.id === overId);
        if (activeIdx !== -1 && overIdx !== -1) {
          const [moved] = arr.splice(activeIdx, 1);
          arr.splice(overIdx, 0, moved);
          reorderBlocks(arr);
          state.isDirty = true;
        }
      }),

    moveBlockToColumn: (blockId, to) =>
      set((state) => {
        pushHistory(state);
        const sourceArr = findArrayContaining(state.blocks, blockId);
        const destArr = targetArray(state, to);
        if (!sourceArr || !destArr) return;
        // Already in the destination column — nothing to relocate.
        if (sourceArr === destArr) return;
        const idx = sourceArr.findIndex((b) => b.id === blockId);
        if (idx === -1) return;
        const [moved] = sourceArr.splice(idx, 1);
        destArr.push(moved);
        reorderBlocks(sourceArr);
        reorderBlocks(destArr);
        state.isDirty = true;
      }),

    duplicateBlock: (id, path) =>
      set((state) => {
        pushHistory(state);
        const arr = targetArray(state, path);
        if (!arr) return;
        const idx = arr.findIndex((b) => b.id === id);
        if (idx === -1) return;
        const clone = deepClone(arr[idx]);
        clone.id = generateId();
        arr.splice(idx + 1, 0, clone);
        reorderBlocks(arr);
        state.selectedBlockId = clone.id;
        state.isDirty = true;
      }),

    selectBlock: (id) =>
      set((state) => {
        state.selectedBlockId = id;
      }),

    hoverBlock: (id) =>
      set((state) => {
        state.hoveredBlockId = id;
      }),

    setMode: (mode) =>
      set((state) => {
        state.mode = mode;
        if (mode !== "edit") state.selectedBlockId = undefined;
      }),

    setBreakpoint: (breakpoint) =>
      set((state) => {
        state.breakpoint = breakpoint;
      }),

    setPageId: (id) =>
      set((state) => {
        state.pageId = id;
      }),

    setTenantId: (id) =>
      set((state) => {
        state.tenantId = id;
      }),

    setDirty: (dirty) =>
      set((state) => {
        state.isDirty = dirty;
      }),

    setMobileSheet: (sheet) =>
      set((state) => {
        state.mobileSheet = sheet;
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.blocks = deepClone(state.history[state.historyIndex]);
          state.isDirty = true;
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.blocks = deepClone(state.history[state.historyIndex]);
          state.isDirty = true;
        }
      }),

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    getBlock: (id) => findBlockDeep(get().blocks, id),
    getBlockPath: (id) => getBlockPathDeep(get().blocks, id),

    reset: () => set(() => ({ ...initialState })),
  })),
);

function pushHistory(state: BuilderState) {
  // Trim redo history
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }
  state.history.push(deepClone(state.blocks));
  if (state.history.length > MAX_HISTORY) {
    state.history.shift();
  } else {
    state.historyIndex++;
  }
}

function reorderBlocks(blocks: Block[]) {
  blocks.forEach((b, i) => {
    b.order = i;
  });
}
