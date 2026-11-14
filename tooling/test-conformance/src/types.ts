export interface SuiteCheckResult {
  readonly name: string;
  readonly passed: boolean;
  readonly detail?: string;
}

export interface SuiteReport {
  readonly suite: string;
  readonly passed: boolean;
  readonly checks: ReadonlyArray<SuiteCheckResult>;
  readonly failures: ReadonlyArray<string>;
}

export interface SuiteOptions {
  /** Throw an Error if any conformance check fails. Defaults to `true`. */
  throwOnFailure?: boolean;
}

export interface AriaReferenceIssue {
  readonly elementTag: string;
  readonly attribute: string;
  readonly targetId: string;
  readonly reason: 'dangling' | 'cross-root';
  readonly rootKind: 'document' | 'shadow-root' | 'fragment';
}

export interface SameRootAriaReport {
  readonly valid: boolean;
  readonly rootsScanned: number;
  readonly referencesChecked: number;
  readonly issues: ReadonlyArray<AriaReferenceIssue>;
}

/**
 * Section 7 DataSource<T> contract mirrored for standalone tooling usage.
 */
export interface ConformanceDataQuery<Filter = unknown> {
  cursor?: string;
  page?: { index: number; size: number };
  sort?: ReadonlyArray<{ field: string; direction: 'asc' | 'desc' }>;
  filter?: Filter;
  signal: AbortSignal;
}

export interface ConformanceDataResult<T> {
  items: ReadonlyArray<T>;
  total?: number;
  nextCursor?: string | null;
}

export interface ConformanceDataSource<T, Filter = unknown> {
  query(request: ConformanceDataQuery<Filter>): Promise<ConformanceDataResult<T>>;
}

export interface FormControlAdapter extends SuiteOptions {
  mount: () => Promise<HTMLElement> | HTMLElement;
  setValue: (el: HTMLElement, value: string) => Promise<void> | void;
  getValue: (el: HTMLElement) => string;
  getFormDataValue: (formData: FormData, name: string) => FormDataEntryValue | null;
  getInternalDisabled: (el: HTMLElement) => boolean;
  isRequiredInvalid?: (el: HTMLElement) => boolean;
  name?: string;
  defaultValue?: string;
  nextValue?: string;
}

export interface OverlayAdapter extends SuiteOptions {
  mount: () => Promise<{ overlay: HTMLElement; trigger: HTMLElement }> | { overlay: HTMLElement; trigger: HTMLElement };
  open: (overlay: HTMLElement) => Promise<void> | void;
  close: (overlay: HTMLElement) => Promise<void> | void;
  isOpen: (overlay: HTMLElement) => boolean;
  supportsCancelableOpen?: boolean;
  supportsLightDismiss?: boolean;
}

export interface RovingFocusAdapter extends SuiteOptions {
  mount: (dir?: 'ltr' | 'rtl') => Promise<HTMLElement> | HTMLElement;
  getItems: (container: HTMLElement) => HTMLElement[];
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
}

export interface ListboxAdapter extends SuiteOptions {
  mount: () => Promise<HTMLElement> | HTMLElement;
  getListboxRoot: (el: HTMLElement) => ParentNode;
  getOptions: (el: HTMLElement) => HTMLElement[];
  getActiveOption: (el: HTMLElement) => HTMLElement | null;
  getSelectedOptions: (el: HTMLElement) => HTMLElement[];
  multiple?: boolean;
}

export interface DataConsumerAdapter<T = { id: string; label: string }> extends SuiteOptions {
  mount: (dataSource: ConformanceDataSource<T>) => Promise<HTMLElement> | HTMLElement;
  triggerQuery: (el: HTMLElement, filter?: string) => Promise<void> | void;
  getState: (el: HTMLElement) => 'idle' | 'loading' | 'refreshing' | 'empty' | 'error' | 'ready';
  getRenderedItemCount: (el: HTMLElement) => number;
}

export interface SatelliteEngineAdapter<TEngine = unknown> extends SuiteOptions {
  createElement: () => HTMLElement & { readonly engine: TEngine | null };
  container?: HTMLElement;
  cycles?: number;
  tokenName?: `--mth-${string}`;
  tokenValue?: string;
  readAppliedToken?: (el: HTMLElement, tokenName: string) => string;
}

export interface HydrationPurityAdapter extends SuiteOptions {
  ssrHtml: string;
  upgradeElement: (host: HTMLElement) => Promise<void> | void;
  getShadowRoot?: (host: HTMLElement) => ShadowRoot | null;
}
