import { useCallback, useEffect, useState } from "react";
import type { Verdict } from "../../lib/types";

export type UseCullKeyboardOptions = {
  /** When false, ignore keys (e.g. not on cull phase, or typing in an input). */
  enabled: boolean;
  /** Ordered list of photo ids currently visible (respects filter). */
  photoIds: string[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onVerdict: (id: string, v: Verdict) => void;
  /**
   * Current verdict of selected photo — needed so Space can toggle keep↔reject.
   */
  getVerdict?: (id: string) => Verdict | undefined;
  /**
   * Photo Mechanic-style: after K/R/F/X, jump to next frame.
   * Default true — A-level cull speed.
   */
  autoAdvance?: boolean;
  /** Loupe open state (Z / Enter toggles; Esc closes). */
  loupeOpen?: boolean;
  onLoupeChange?: (open: boolean) => void;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * A-level cull keyboard:
 * K keep · R reject · F flag · X unset · Space toggle keep/reject
 * ←→↑↓ move · Z/Enter loupe · Esc close loupe
 * Auto-advance after verdict (default on).
 */
export function useCullKeyboard({
  enabled,
  photoIds,
  selectedId,
  onSelect,
  onVerdict,
  getVerdict,
  autoAdvance = true,
  loupeOpen = false,
  onLoupeChange,
}: UseCullKeyboardOptions): {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectIndex: (index: number) => void;
  moveSelection: (delta: number) => void;
} {
  const setSelectedId = useCallback(
    (id: string | null) => {
      onSelect(id);
    },
    [onSelect]
  );

  const selectIndex = useCallback(
    (index: number) => {
      if (!photoIds.length) {
        onSelect(null);
        return;
      }
      const i = Math.max(0, Math.min(photoIds.length - 1, index));
      onSelect(photoIds[i]);
    },
    [photoIds, onSelect]
  );

  const moveSelection = useCallback(
    (delta: number) => {
      if (!photoIds.length) return;
      const cur = selectedId ? photoIds.indexOf(selectedId) : -1;
      const next =
        cur < 0
          ? delta > 0
            ? 0
            : photoIds.length - 1
          : (cur + delta + photoIds.length) % photoIds.length;
      onSelect(photoIds[next]);
    },
    [photoIds, selectedId, onSelect]
  );

  /** Verdict then optional advance to next (not wrap — stay on last). */
  const applyVerdict = useCallback(
    (id: string, v: Verdict) => {
      onVerdict(id, v);
      if (!autoAdvance) return;
      const cur = photoIds.indexOf(id);
      if (cur < 0) return;
      if (cur < photoIds.length - 1) {
        onSelect(photoIds[cur + 1]);
      }
    },
    [autoAdvance, onVerdict, onSelect, photoIds]
  );

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      const hasSelection =
        selectedId != null && photoIds.includes(selectedId);

      // Loupe toggle / close
      if (key === "Escape") {
        if (loupeOpen && onLoupeChange) {
          e.preventDefault();
          onLoupeChange(false);
        }
        return;
      }
      if (key === "z" || key === "Z" || key === "Enter") {
        // Enter on buttons shouldn't open loupe if focus is button — only when not on interactive control
        if (key === "Enter" && e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        onLoupeChange?.(!loupeOpen);
        return;
      }

      if (key === "ArrowRight" || key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1);
        return;
      }
      if (key === "ArrowLeft" || key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1);
        return;
      }

      const ensureId = (): string | null => {
        if (hasSelection) return selectedId;
        if (photoIds[0]) {
          onSelect(photoIds[0]);
          return photoIds[0];
        }
        return null;
      };

      if (key === "k" || key === "K") {
        const id = ensureId();
        if (!id) return;
        e.preventDefault();
        applyVerdict(id, "keep");
        return;
      }
      if (key === "r" || key === "R") {
        const id = ensureId();
        if (!id) return;
        e.preventDefault();
        applyVerdict(id, "reject");
        return;
      }
      if (key === "f" || key === "F") {
        const id = ensureId();
        if (!id) return;
        e.preventDefault();
        applyVerdict(id, "flag");
        return;
      }
      // X / U = unset (Photo Mechanic habit: clear mark)
      if (key === "x" || key === "X" || key === "u" || key === "U") {
        const id = ensureId();
        if (!id) return;
        e.preventDefault();
        applyVerdict(id, "unset");
        return;
      }
      if (key === " " || key === "Spacebar") {
        const id = ensureId();
        if (!id) return;
        e.preventDefault();
        const current = getVerdict?.(id);
        const next: Verdict =
          current === "keep" ? "reject" : current === "reject" ? "keep" : "keep";
        applyVerdict(id, next);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    photoIds,
    selectedId,
    onSelect,
    getVerdict,
    moveSelection,
    applyVerdict,
    loupeOpen,
    onLoupeChange,
  ]);

  return {
    selectedId,
    setSelectedId,
    selectIndex,
    moveSelection,
  };
}

/**
 * Convenience: local selectedId state + keyboard when parent wants one-liner.
 */
export function useCullSelection(initial: string | null = null) {
  const [selectedId, setSelectedId] = useState<string | null>(initial);
  return { selectedId, setSelectedId };
}
