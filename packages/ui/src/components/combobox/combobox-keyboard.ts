import type { ResolvedComboboxOption } from './combobox-options.js';

export interface ComboboxKeyboardHost {
  readonly isEffectivelyDisabled: boolean;
  readonly readonly: boolean;
  readonly open: boolean;
  readonly isComposing: boolean;
  readonly resolvedOptions: ReadonlyArray<ResolvedComboboxOption>;
  readonly activeIndex: number;
  readonly hasActiveOption: boolean;
  show(): Promise<void>;
  hide(reason: 'escape' | 'programmatic'): Promise<void>;
  setActiveIndex(index: number): void;
  selectActive(): void;
}

/**
 * Finds the next enabled option index moving forward (`+1`) or backward (`-1`), wrapping around.
 */
export function findNextEnabledOptionIndex(
  options: ReadonlyArray<ResolvedComboboxOption>,
  currentIndex: number,
  delta: 1 | -1,
): number {
  const len = options.length;
  if (len === 0) return -1;
  let idx = currentIndex;
  for (let step = 0; step < len; step += 1) {
    if (idx === -1) {
      idx = delta === 1 ? 0 : len - 1;
    } else {
      idx = (idx + delta + len) % len;
    }
    if (!options[idx]?.disabled) {
      return idx;
    }
  }
  return -1;
}

/**
 * Handles keyboard navigation, IME-safe Enter selection, Escape dismiss, and Tab closing on `<mth-combobox>`.
 */
export function handleComboboxInputKeyDown(
  host: ComboboxKeyboardHost,
  event: KeyboardEvent,
): void {
  if (host.isEffectivelyDisabled || host.readonly) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (!host.open) {
      void host.show().then(() => {
        const firstEnabled = host.resolvedOptions.findIndex((o) => !o.disabled);
        if (firstEnabled >= 0) {
          host.setActiveIndex(firstEnabled);
        }
      });
    } else {
      const next = findNextEnabledOptionIndex(host.resolvedOptions, host.activeIndex, 1);
      if (next >= 0) {
        host.setActiveIndex(next);
      }
    }
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (!host.open) {
      void host.show().then(() => {
        const lastEnabled = [...host.resolvedOptions]
          .reverse()
          .findIndex((o) => !o.disabled);
        if (lastEnabled >= 0) {
          host.setActiveIndex(host.resolvedOptions.length - 1 - lastEnabled);
        }
      });
    } else {
      const prev = findNextEnabledOptionIndex(host.resolvedOptions, host.activeIndex, -1);
      if (prev >= 0) {
        host.setActiveIndex(prev);
      }
    }
    return;
  }

  if (event.key === 'Enter' && host.open && !host.isComposing) {
    if (host.hasActiveOption) {
      event.preventDefault();
      host.selectActive();
    }
    return;
  }

  if (event.key === 'Escape' && host.open) {
    event.preventDefault();
    event.stopPropagation();
    void host.hide('escape');
    return;
  }

  if (event.key === 'Tab' && host.open) {
    void host.hide('programmatic');
  }
}
