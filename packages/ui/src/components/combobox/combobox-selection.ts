import type { DataSource, ListboxOptionItem } from '@methane-ui/primitives';
import type { ComboboxControllersBundle } from './combobox-controllers.js';
import {
  resolveComboboxOptions,
  syncLightOptionStates,
  type ComboboxOption,
  type ResolvedComboboxOption,
} from './combobox-options.js';

export interface ComboboxSelectionStatePatch {
  value?: string;
  displayText?: string;
  filterQuery?: string;
  showingAllOptions?: boolean;
  resolvedOptions?: Array<ResolvedComboboxOption>;
  selectedValues?: Array<string>;
  pendingLazyOptionReconcile?: boolean;
}

export interface ComboboxSelectionDeps {
  readonly element: HTMLElement;
  readonly ctrls: ComboboxControllersBundle;
  readonly multiple: boolean;
  readonly filterable: boolean;
  readonly open: boolean;
  readonly options: ReadonlyArray<ComboboxOption> | null;
  readonly dataSource: DataSource<ComboboxOption, string> | null;
  readonly value: string;
  readonly displayText: string;
  readonly filterQuery: string;
  readonly showingAllOptions: boolean;
  readonly resolvedOptions: ReadonlyArray<ResolvedComboboxOption>;
  readonly selectedValues: ReadonlyArray<string>;
  readonly activeOptionId: string;
  readonly applyState: (patch: ComboboxSelectionStatePatch) => void;
  readonly emitEvent: (name: `mth-${string}` | 'input' | 'change', options?: CustomEventInit) => boolean;
  readonly show: () => Promise<void>;
  readonly hide: (reason?: 'programmatic') => Promise<void>;
}

export function toggleComboboxSelectedValue(
  currentSelected: ReadonlyArray<string>,
  value: string,
): string[] {
  const nextSet = new Set(currentSelected);
  if (nextSet.has(value)) {
    nextSet.delete(value);
  } else {
    nextSet.add(value);
  }
  return Array.from(nextSet);
}

export function deriveSelectedValuesFromRaw(rawValue: string, multiple: boolean): string[] {
  if (multiple) {
    return rawValue
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return rawValue.length > 0 ? [rawValue] : [];
}

export function resolveDisplayTextForSelection(params: {
  multiple: boolean;
  rawValue: string;
  selectedValues: ReadonlyArray<string>;
  resolvedOptions: ReadonlyArray<ResolvedComboboxOption>;
  currentDisplayText: string;
  showingAllOptions: boolean;
}): string | null {
  if (params.multiple) {
    if (!params.showingAllOptions) return null;
    if (params.rawValue.length === 0) return '';
    return params.selectedValues
      .map((val) => params.resolvedOptions.find((o) => o.value === val)?.label ?? val)
      .join(', ');
  }

  if (params.rawValue.length > 0) {
    const match = params.resolvedOptions.find((o) => o.value === params.rawValue);
    if (match) return match.label;
    if (params.currentDisplayText === '' || params.showingAllOptions) {
      return params.rawValue;
    }
    return null;
  }

  return params.showingAllOptions ? '' : null;
}

export function syncComboboxSelectedFromValue(deps: ComboboxSelectionDeps, rawValue: string): void {
  const selectedValues = deriveSelectedValuesFromRaw(rawValue, deps.multiple);
  deps.ctrls.listboxCtrl.setSelectedValues(selectedValues);
  const nextText = resolveDisplayTextForSelection({
    multiple: deps.multiple,
    rawValue,
    selectedValues,
    resolvedOptions: deps.resolvedOptions,
    currentDisplayText: deps.displayText,
    showingAllOptions: deps.showingAllOptions,
  });
  deps.applyState({
    selectedValues,
    ...(nextText !== null ? { displayText: nextText } : {}),
  });
}

export function reconcileComboboxOptions(deps: ComboboxSelectionDeps): void {
  const { sourceList, filteredList } = resolveComboboxOptions({
    dataSource: deps.dataSource,
    dataItems: deps.ctrls.dataCtrl.items,
    options: deps.options,
    host: deps.element,
    filterable: deps.filterable,
    filterQuery: deps.filterQuery,
    showingAllOptions: deps.showingAllOptions,
  });

  const patch: ComboboxSelectionStatePatch = { resolvedOptions: filteredList };
  if (!deps.multiple && deps.value.length > 0 && deps.showingAllOptions) {
    const selected = sourceList.find((o) => o.value === deps.value);
    if (selected) patch.displayText = selected.label;
  }
  deps.applyState(patch);

  const items: Array<ListboxOptionItem> = filteredList.map((opt) => ({
    id: opt.id,
    value: opt.value,
    label: opt.label,
    disabled: opt.disabled,
    ...(opt.group !== undefined ? { group: opt.group } : {}),
  }));
  deps.ctrls.listboxCtrl.setOptions(items);
  syncLightOptionStates(filteredList, deps.selectedValues, deps.activeOptionId);
}

export function commitComboboxSelection(
  deps: ComboboxSelectionDeps,
  values: ReadonlyArray<string>,
): void {
  const selectedValues = [...values];
  const nextValue = deps.multiple ? selectedValues.join(',') : (selectedValues[0] ?? '');
  const displayText =
    resolveDisplayTextForSelection({
      multiple: deps.multiple,
      rawValue: nextValue,
      selectedValues,
      resolvedOptions: deps.resolvedOptions,
      currentDisplayText: deps.displayText,
      showingAllOptions: true,
    }) ?? nextValue;

  deps.applyState({
    selectedValues,
    value: nextValue,
    showingAllOptions: true,
    filterQuery: '',
    displayText,
  });

  deps.ctrls.formCtrl.setValue(nextValue, { markDirty: true });
  deps.ctrls.formCtrl.markTouched();
  syncLightOptionStates(deps.resolvedOptions, selectedValues, deps.activeOptionId);

  deps.emitEvent('mth-change', {
    detail: { value: nextValue, selectedValues: [...selectedValues] },
  });
  deps.element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

  if (!deps.multiple && deps.open) void deps.hide('programmatic');
}

export function clearComboboxSelection(deps: ComboboxSelectionDeps): void {
  deps.applyState({
    pendingLazyOptionReconcile: false,
    value: '',
    displayText: '',
    filterQuery: '',
    selectedValues: [],
    showingAllOptions: true,
  });
  deps.ctrls.listboxCtrl.setSelectedValues([]);
  deps.ctrls.formCtrl.setValue('', { markDirty: true });
  deps.ctrls.formCtrl.markTouched();
  reconcileComboboxOptions({
    ...deps,
    value: '',
    displayText: '',
    filterQuery: '',
    selectedValues: [],
    showingAllOptions: true,
  });
  deps.emitEvent('mth-clear');
  deps.emitEvent('mth-change', { detail: { value: '', selectedValues: [] } });
  deps.element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

export function selectComboboxValue(deps: ComboboxSelectionDeps, value: string): void {
  const entry = deps.resolvedOptions.find((o) => o.value === value);
  if (entry?.disabled) return;

  if (deps.multiple) {
    const nextArray = toggleComboboxSelectedValue(deps.selectedValues, value);
    deps.ctrls.listboxCtrl.setSelectedValues(nextArray);
    commitComboboxSelection(deps, nextArray);
  } else {
    deps.ctrls.listboxCtrl.selectValue(value);
  }
}

export function handleComboboxListboxSelection(
  deps: ComboboxSelectionDeps,
  values: ReadonlyArray<string>,
): void {
  if (deps.multiple) {
    const latest = values[0];
    if (!latest) return;
    const nextArray = toggleComboboxSelectedValue(deps.selectedValues, latest);
    deps.ctrls.listboxCtrl.setSelectedValues(nextArray);
    commitComboboxSelection(deps, nextArray);
  } else {
    commitComboboxSelection(deps, values);
  }
}

export async function queryComboboxOptions(
  deps: ComboboxSelectionDeps,
  filterText: string,
): Promise<void> {
  deps.applyState({
    pendingLazyOptionReconcile: false,
    filterQuery: filterText,
    displayText: filterText,
    showingAllOptions: false,
  });
  if (deps.dataSource) {
    await deps.ctrls.dataCtrl.setFilter(filterText);
  } else {
    reconcileComboboxOptions({ ...deps, filterQuery: filterText, showingAllOptions: false });
  }
}

export function commitComboboxUserText(deps: ComboboxSelectionDeps, nextText: string): void {
  deps.applyState({
    pendingLazyOptionReconcile: false,
    displayText: nextText,
    filterQuery: nextText,
    showingAllOptions: false,
  });
  if (!deps.open) void deps.show();
  if (deps.dataSource) {
    void deps.ctrls.dataCtrl.setFilter(nextText);
  } else {
    reconcileComboboxOptions({ ...deps, filterQuery: nextText, showingAllOptions: false });
  }
  deps.emitEvent('mth-input', { detail: { value: nextText } });
  deps.element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}
