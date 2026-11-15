import type { DataControllerStatus, DataSource } from '@methane-ui/primitives';
import { html, nothing, type TemplateResult } from 'lit';

export interface ComboboxOption {
  readonly id?: string;
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
}

export interface ResolvedComboboxOption extends ComboboxOption {
  readonly id: string;
  readonly disabled: boolean;
  readonly lightElement?: HTMLElement;
}

export interface ResolveComboboxOptionsParams {
  readonly dataSource: DataSource<ComboboxOption, string> | null;
  readonly dataItems: ReadonlyArray<ComboboxOption>;
  readonly options: ReadonlyArray<ComboboxOption> | null;
  readonly host: HTMLElement;
  readonly filterable: boolean;
  readonly filterQuery: string;
  readonly showingAllOptions: boolean;
}

export interface RenderOptionsListParams {
  readonly dataStatus: DataControllerStatus;
  readonly resolvedOptions: ReadonlyArray<ResolvedComboboxOption>;
  readonly selectedValues: ReadonlyArray<string>;
  readonly activeOptionId: string;
  readonly loadingLabel: string;
  readonly errorLabel: string;
  readonly emptyLabel: string;
  readonly onOptionClick: (opt: ResolvedComboboxOption, index: number) => void;
}

/**
 * Collects declarative `<mth-option>` and `<mth-option-group>` children from light DOM.
 */
export function collectLightDomOptions(host: HTMLElement): Array<ResolvedComboboxOption> {
  const collected: Array<ResolvedComboboxOption> = [];
  let index = 0;

  const pushOptionEl = (optEl: HTMLElement, groupName?: string, groupDisabled = false) => {
    const valueAttr = optEl.getAttribute('value');
    const propValue = (optEl as unknown as { value?: string }).value;
    const value =
      typeof propValue === 'string' && propValue.length > 0
        ? propValue
        : (valueAttr ?? '');
    const explicitLabel =
      optEl.getAttribute('label') ??
      (optEl as unknown as { label?: string }).label ??
      '';
    const resolvedLabel =
      explicitLabel.trim().length > 0
        ? explicitLabel.trim()
        : (optEl.textContent?.trim() ?? value);
    const optDisabled =
      groupDisabled ||
      optEl.hasAttribute('disabled') ||
      Boolean((optEl as unknown as { disabled?: boolean }).disabled);

    const finalValue = value || resolvedLabel || `opt-${index}`;
    collected.push({
      id: optEl.id || `mth-cb-opt-${index++}`,
      value: finalValue,
      label: resolvedLabel || finalValue,
      disabled: optDisabled,
      ...(groupName !== undefined ? { group: groupName } : {}),
      lightElement: optEl,
    });
  };

  for (const child of Array.from(host.children ?? [])) {
    if (!(child instanceof HTMLElement)) continue;
    const tag = child.tagName.toLowerCase();
    if (tag === 'mth-option') {
      pushOptionEl(child);
    } else if (tag === 'mth-option-group') {
      const groupLabel =
        child.getAttribute('label') ??
        (child as unknown as { label?: string }).label ??
        '';
      const groupDisabled =
        child.hasAttribute('disabled') ||
        Boolean((child as unknown as { disabled?: boolean }).disabled);
      for (const nested of Array.from(child.children ?? [])) {
        if (nested instanceof HTMLElement && nested.tagName.toLowerCase() === 'mth-option') {
          pushOptionEl(nested, groupLabel, groupDisabled);
        }
      }
    }
  }

  return collected;
}

/**
 * Reconciles active option source (`dataSource`, `.options`, or light DOM) and applies local filtering.
 */
export function resolveComboboxOptions(params: ResolveComboboxOptionsParams): {
  sourceList: Array<ResolvedComboboxOption>;
  filteredList: Array<ResolvedComboboxOption>;
} {
  let sourceList: Array<ResolvedComboboxOption>;

  if (params.dataSource) {
    sourceList = params.dataItems.map((item, idx) => {
      const raw = item as ComboboxOption & { id?: string };
      const value = String(raw.value ?? raw.id ?? raw.label ?? idx);
      const label = String(raw.label ?? raw.value ?? raw.id ?? value);
      return {
        id: raw.id ? `mth-cb-opt-${raw.id}` : `mth-cb-opt-${idx}`,
        value,
        label,
        disabled: Boolean(raw.disabled),
        ...(raw.group !== undefined ? { group: raw.group } : {}),
      };
    });
  } else if (params.options !== null) {
    sourceList = params.options.map((opt, idx) => ({
      id: opt.id ?? `mth-cb-opt-${idx}`,
      value: opt.value,
      label: opt.label,
      disabled: Boolean(opt.disabled),
      ...(opt.group !== undefined ? { group: opt.group } : {}),
    }));
  } else {
    sourceList = collectLightDomOptions(params.host);
  }

  const queryText = params.filterQuery.trim().toLowerCase();
  const shouldFilter =
    !params.dataSource && params.filterable && queryText.length > 0 && !params.showingAllOptions;

  const filteredList = shouldFilter
    ? sourceList.filter(
        (opt) =>
          opt.label.toLowerCase().includes(queryText) ||
          opt.value.toLowerCase().includes(queryText),
      )
    : sourceList;

  return { sourceList, filteredList };
}

/**
 * Mirrors selected and active states back onto slotted light-DOM `<mth-option>` elements.
 */
export function syncLightOptionStates(
  resolvedOptions: ReadonlyArray<ResolvedComboboxOption>,
  selectedValues: ReadonlyArray<string>,
  activeOptionId: string,
): void {
  const selectedSet = new Set(selectedValues);
  for (const opt of resolvedOptions) {
    const el = opt.lightElement;
    if (!el) continue;
    const optState = el as unknown as { selected?: boolean; active?: boolean };
    const isSelected = selectedSet.has(opt.value);
    const isActive = opt.id === activeOptionId;
    if (optState.selected !== isSelected) {
      optState.selected = isSelected;
    }
    if (optState.active !== isActive) {
      optState.active = isActive;
    }
  }
}

/**
 * Renders the shadow-projected options list, option groups, loading status, or empty state.
 */
export function renderComboboxOptionsList(params: RenderOptionsListParams): TemplateResult {
  if (params.dataStatus === 'loading' || params.dataStatus === 'refreshing') {
    return html`
      <div part="status" role="status">
        <slot name="loading">${params.loadingLabel}</slot>
      </div>
    `;
  }

  if (params.dataStatus === 'error') {
    return html`<div part="status" role="alert">${params.errorLabel}</div>`;
  }

  if (params.resolvedOptions.length === 0) {
    return html`
      <div part="empty">
        <slot name="empty">${params.emptyLabel}</slot>
      </div>
    `;
  }

  const selectedSet = new Set(params.selectedValues);
  const groups = new Map<string, Array<{ opt: ResolvedComboboxOption; idx: number }>>();
  const ungrouped: Array<{ opt: ResolvedComboboxOption; idx: number }> = [];

  params.resolvedOptions.forEach((opt, idx) => {
    if (opt.group && opt.group.length > 0) {
      const list = groups.get(opt.group) ?? [];
      list.push({ opt, idx });
      groups.set(opt.group, list);
    } else {
      ungrouped.push({ opt, idx });
    }
  });

  const renderOptionNode = (opt: ResolvedComboboxOption, idx: number) => {
    const isSelected = selectedSet.has(opt.value);
    const isActive = opt.id === params.activeOptionId;
    return html`
      <div
        id=${opt.id}
        part="option"
        role="option"
        data-value=${opt.value}
        data-active=${isActive ? 'true' : 'false'}
        aria-selected=${isSelected ? 'true' : 'false'}
        aria-disabled=${opt.disabled ? 'true' : nothing}
        @click=${() => params.onOptionClick(opt, idx)}
      >
        <span aria-hidden="true">${isSelected ? '✓' : ''}</span>
        <span>${opt.label}</span>
      </div>
    `;
  };

  let groupCounter = 0;
  return html`
    ${ungrouped.map(({ opt, idx }) => renderOptionNode(opt, idx))}
    ${Array.from(groups.entries()).map(([groupLabel, entries]) => {
      const groupId = `mth-cb-grp-${groupCounter++}`;
      return html`
        <div role="group" aria-labelledby=${groupId}>
          <div id=${groupId} part="group-label">${groupLabel}</div>
          ${entries.map(({ opt, idx }) => renderOptionNode(opt, idx))}
        </div>
      `;
    })}
  `;
}
