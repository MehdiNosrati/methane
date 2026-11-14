import type {
  DataConsumerAdapter,
  FormControlAdapter,
  ListboxAdapter,
  OverlayAdapter,
  RovingFocusAdapter,
  SatelliteEngineAdapter,
  SuiteReport,
} from '@methane/test-conformance';

export type ConformanceSuiteName =
  | 'form-control'
  | 'overlay'
  | 'roving-focus'
  | 'listbox'
  | 'data-consumer'
  | 'satellite';

export type FocusModel = 'none' | 'host' | 'delegates-focus';

export interface KeyboardBindingSpec {
  key: string;
  dir?: 'ltr' | 'rtl';
  when: string;
  expect: string;
}

export interface PropSpec {
  name: string;
  attr?: string | false;
  type: string;
  default?: unknown;
}

export interface EventSpec {
  name: string;
  cancelable: boolean;
  detailType: string;
}

export interface SlotSpec {
  name: string;
  description: string;
}

export interface PartSpec {
  name: string;
  description: string;
}

/**
 * Locked Section 7 Contract: Machine-Readable Behavior Spec (@methane/spec-compiler).
 */
export interface ComponentBehaviorSpec {
  tag: `mth-${string}`;
  package: string;
  conformance: ReadonlyArray<ConformanceSuiteName>;
  controllers: ReadonlyArray<string>;
  focusModel: FocusModel;
  role?: string;
  states: ReadonlyArray<string>;
  keyboard: ReadonlyArray<KeyboardBindingSpec>;
  props: ReadonlyArray<PropSpec>;
  events: ReadonlyArray<EventSpec>;
  slots: ReadonlyArray<SlotSpec>;
  parts: ReadonlyArray<PartSpec>;
  messages: Record<string, string>;
}

export interface SpecDiagnostic {
  readonly level: 'error' | 'warning';
  readonly path: string;
  readonly message: string;
}

export interface SpecValidationResult {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<SpecDiagnostic>;
  readonly warnings: ReadonlyArray<SpecDiagnostic>;
}

export interface CemDeclaration {
  tagName?: string;
  name?: string;
  attributes?: ReadonlyArray<{ name: string; fieldName?: string; type?: { text: string } }>;
  members?: ReadonlyArray<{ kind: string; name: string; attribute?: string; type?: { text: string } }>;
  events?: ReadonlyArray<{ name: string; type?: { text: string } }>;
  slots?: ReadonlyArray<{ name: string; description?: string }>;
  cssParts?: ReadonlyArray<{ name: string; description?: string }>;
}

export interface CustomElementsManifest {
  schemaVersion?: string;
  modules: ReadonlyArray<{
    path: string;
    declarations?: ReadonlyArray<CemDeclaration>;
  }>;
}

export interface CemVerificationResult {
  readonly valid: boolean;
  readonly tag: string;
  readonly missing: ReadonlyArray<string>;
  readonly mismatched: ReadonlyArray<string>;
}

export interface A11yChecklistItem {
  readonly id: string;
  readonly category: 'focus' | 'aria' | 'keyboard' | 'states' | 'contrast' | 'i18n';
  readonly requirement: string;
  readonly verifiedBy: string;
}

export interface A11yChecklist {
  readonly tag: `mth-${string}`;
  readonly items: ReadonlyArray<A11yChecklistItem>;
  readonly markdown: string;
}

export interface CompiledSpecArtifacts {
  readonly spec: ComponentBehaviorSpec;
  readonly tests: string;
  readonly docs: string;
  readonly a11yChecklist: A11yChecklist;
}

export interface CompileSpecTestsOptions {
  /** Optional module path registering `<spec.tag>` (imported at top of generated test file). */
  readonly elementImportPath?: string;
  /** Optional module path exporting `specAdapter: BehaviorSpecAdapter`. */
  readonly adapterImportPath?: string;
}

export interface BehaviorSpecAdapter {
  readonly formControl?: FormControlAdapter;
  readonly overlay?: OverlayAdapter;
  readonly rovingFocus?: RovingFocusAdapter;
  readonly listbox?: ListboxAdapter;
  readonly dataConsumer?: DataConsumerAdapter;
  readonly satellite?: SatelliteEngineAdapter;
  /** Optional callback to assert expected DOM/state transitions after a real KeyboardEvent dispatch. */
  readonly onKeyboardCheck?: (
    el: HTMLElement,
    binding: KeyboardBindingSpec,
    event: KeyboardEvent,
  ) => Promise<void> | void;
}

export interface BehaviorSpecAssertionReport {
  readonly tag: `mth-${string}`;
  readonly passed: boolean;
  readonly suiteReports: ReadonlyArray<SuiteReport>;
  readonly failures: ReadonlyArray<string>;
}

