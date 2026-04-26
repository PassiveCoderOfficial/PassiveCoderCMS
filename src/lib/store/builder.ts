import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Block, BuilderState, BuilderMode, Breakpoint } from "@/types/cms";
import { deepClone, generateId } from "@/lib/utils";

const MAX_HISTORY = 50;

interface BuilderStore extends BuilderState {
  // Actions
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block, afterId?: string) => void;
  updateBlock: (id: string, data: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (activeId: string, overId: string) => void;
  duplicateBlock: (id: string) => void;
  selectBlock: (id: string | undefined) => void;
  hoverBlock: (id: string | undefined) => void;
  setMode: (mode: BuilderMode) => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setPageId: (id: string) => void;
  setDirty: (dirty: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getBlock: (id: string) => Block | undefined;
  reset: () => void;
}

const initialState: BuilderState = {
  pageId: undefined,
  blocks: [],
  selectedBlockId: undefined,
  hoveredBlockId: undefined,
  isDragging: false,
  mode: "edit",
  breakpoint: "desktop",
  history: [],
  historyIndex: -1,
  isDirty: false,
};

export const useBuilderStore = create<BuilderStore>()(
  immer((set, get) => ({
    ...initialState,

    setBlocks: (blocks) =>
      set((state) => {
        state.blocks = blocks;
        state.isDirty = true;
      }),

    addBlock: (block, afterId) =>
      set((state) => {
        pushHistory(state);
        if (afterId) {
          const idx = state.blocks.findIndex((b) => b.id === afterId);
          state.blocks.splice(idx + 1, 0, block);
        } else {
          state.blocks.push(block);
        }
        reorderBlocks(state.blocks);
        state.selectedBlockId = block.id;
        state.isDirty = true;
      }),

    updateBlock: (id, data) =>
      set((state) => {
        pushHistory(state);
        const idx = state.blocks.findIndex((b) => b.id === id);
        if (idx !== -1) {
          Object.assign(state.blocks[idx], data);
          state.isDirty = true;
        }
      }),

    removeBlock: (id) =>
      set((state) => {
        pushHistory(state);
        state.blocks = state.blocks.filter((b) => b.id !== id);
        if (state.selectedBlockId === id) state.selectedBlockId = undefined;
        reorderBlocks(state.blocks);
        state.isDirty = true;
      }),

    moveBlock: (activeId, overId) =>
      set((state) => {
        pushHistory(state);
        const activeIdx = state.blocks.findIndex((b) => b.id === activeId);
        const overIdx = state.blocks.findIndex((b) => b.id === overId);
        if (activeIdx !== -1 && overIdx !== -1) {
          const [moved] = state.blocks.splice(activeIdx, 1);
          state.blocks.splice(overIdx, 0, moved);
          reorderBlocks(state.blocks);
          state.isDirty = true;
        }
      }),

    duplicateBlock: (id) =>
      set((state) => {
        pushHistory(state);
        const block = state.blocks.find((b) => b.id === id);
        if (!block) return;
        const clone = deepClone(block);
        clone.id = generateId();
        const idx = state.blocks.findIndex((b) => b.id === id);
        state.blocks.splice(idx + 1, 0, clone);
        reorderBlocks(state.blocks);
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

    setDirty: (dirty) =>
      set((state) => {
        state.isDirty = dirty;
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

    getBlock: (id) => get().blocks.find((b) => b.id === id),

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
