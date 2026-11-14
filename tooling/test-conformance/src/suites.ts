import { scanSameRootAria } from './aria-scanner.js';
import type {
  ConformanceDataQuery,
  ConformanceDataSource,
  DataConsumerAdapter,
  FormControlAdapter,
  HydrationPurityAdapter,
  ListboxAdapter,
  OverlayAdapter,
  RovingFocusAdapter,
  SatelliteEngineAdapter,
  SuiteCheckResult,
  SuiteOptions,
  SuiteReport,
} from './types.js';

function finalizeSuite(
  suite: string,
  checks: SuiteCheckResult[],
  options?: SuiteOptions,
): SuiteReport {
  const failures = checks
    .filter((c) => !c.passed)
    .map((c) => (c.detail ? `${c.name}: ${c.detail}` : c.name));
  const report: SuiteReport = {
    suite,
    passed: failures.length === 0,
    checks,
    failures,
  };
  if (!report.passed && options?.throwOnFailure !== false) {
    throw new Error(`[${suite}] Conformance failure:\n- ${failures.join('\n- ')}`);
  }
  return report;
}

function recordCheck(
  checks: SuiteCheckResult[],
  name: string,
  passed: boolean,
  detail?: string,
): void {
  checks.push(detail !== undefined ? { name, passed, detail } : { name, passed });
}

function dispatchKey(target: EventTarget, key: string): KeyboardEvent {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, composed: true });
  target.dispatchEvent(ev);
  return ev;
}

export async function runFormControlSuite(adapter: FormControlAdapter): Promise<SuiteReport> {
  const checks: SuiteCheckResult[] = [];
  const doc = document;
  const form = doc.createElement('form');
  const fieldset = doc.createElement('fieldset');
  const el = await adapter.mount();
  const fieldName = adapter.name ?? 'field';
  const defaultValue = adapter.defaultValue ?? '';
  const nextValue = adapter.nextValue ?? 'updated-value';
  const controlId = el.id || `mth-fc-${Math.random().toString(36).slice(2, 8)}`;
  el.id = controlId;
  if (!el.getAttribute('name')) {
    el.setAttribute('name', fieldName);
  }

  const label = doc.createElement('label');
  label.htmlFor = controlId;
  label.textContent = 'Test Label';

  fieldset.appendChild(label);
  fieldset.appendChild(el);
  form.appendChild(fieldset);
  doc.body.appendChild(form);

  try {
    const ctor = el.constructor as { formAssociated?: boolean };
    recordCheck(
      checks,
      'static-form-associated',
      ctor.formAssociated === true,
      ctor.formAssociated === true ? undefined : 'Expected static formAssociated = true',
    );

    await adapter.setValue(el, nextValue);
    const updatedVal = adapter.getValue(el);
    recordCheck(
      checks,
      'value-update',
      updatedVal === nextValue,
      updatedVal === nextValue ? undefined : `Expected value "${nextValue}", received "${updatedVal}"`,
    );

    const formData = new FormData(form);
    const submitted = adapter.getFormDataValue(formData, fieldName);
    recordCheck(
      checks,
      'form-data-submission',
      submitted === nextValue,
      submitted === nextValue
        ? undefined
        : `Expected FormData["${fieldName}"] === "${nextValue}", got "${String(submitted)}"`,
    );

    fieldset.disabled = true;
    await new Promise((r) => setTimeout(r, 0));
    const internalDisabled = adapter.getInternalDisabled(el);
    const hostAttrMutated = el.hasAttribute('disabled');
    recordCheck(
      checks,
      'fieldset-disabled-without-host-mutation',
      internalDisabled && !hostAttrMutated,
      !internalDisabled
        ? 'Internal control did not disable under <fieldset disabled>'
        : hostAttrMutated
          ? 'Host `disabled` attribute was mutated inside formDisabledCallback (ADR-014 violation)'
          : undefined,
    );

    fieldset.disabled = false;
    await new Promise((r) => setTimeout(r, 0));
    recordCheck(
      checks,
      'fieldset-reenable',
      !adapter.getInternalDisabled(el),
      adapter.getInternalDisabled(el) ? 'Internal control remained disabled after fieldset enabled' : undefined,
    );

    form.reset();
    await new Promise((r) => setTimeout(r, 0));
    const resetVal = adapter.getValue(el);
    recordCheck(
      checks,
      'form-reset-restores-default',
      resetVal === defaultValue,
      resetVal === defaultValue
        ? undefined
        : `Expected reset value "${defaultValue}", got "${resetVal}"`,
    );

    if (adapter.isRequiredInvalid) {
      el.setAttribute('required', '');
      await adapter.setValue(el, '');
      const invalid = adapter.isRequiredInvalid(el);
      recordCheck(
        checks,
        'required-validity',
        invalid,
        invalid ? undefined : 'Expected required control with empty value to be invalid',
      );
    }

    const ariaReport = scanSameRootAria(form);
    recordCheck(
      checks,
      'same-root-aria',
      ariaReport.valid,
      ariaReport.valid ? undefined : `ARIA issues: ${JSON.stringify(ariaReport.issues)}`,
    );
  } finally {
    form.remove();
  }

  return finalizeSuite('FormControlSuite', checks, adapter);
}

export async function runOverlaySuite(adapter: OverlayAdapter): Promise<SuiteReport> {
  const checks: SuiteCheckResult[] = [];
  const { overlay, trigger } = await adapter.mount();
  const wrapper = document.createElement('div');
  wrapper.appendChild(trigger);
  wrapper.appendChild(overlay);
  document.body.appendChild(wrapper);

  const observedEvents: string[] = [];
  for (const name of ['mth-open', 'mth-after-open', 'mth-close', 'mth-after-close']) {
    overlay.addEventListener(name, () => observedEvents.push(name));
  }

  try {
    trigger.focus();

    if (adapter.supportsCancelableOpen) {
      const cancelOnce = (ev: Event) => ev.preventDefault();
      overlay.addEventListener('mth-open', cancelOnce, { once: true });
      await adapter.open(overlay);
      recordCheck(
        checks,
        'cancelable-open-event',
        !adapter.isOpen(overlay),
        adapter.isOpen(overlay) ? 'Overlay opened despite preventDefault() on mth-open' : undefined,
      );
    }

    observedEvents.length = 0;
    await adapter.open(overlay);
    recordCheck(
      checks,
      'open-lifecycle-events',
      adapter.isOpen(overlay) &&
        observedEvents.includes('mth-open') &&
        observedEvents.includes('mth-after-open'),
      `isOpen=${adapter.isOpen(overlay)}, events=${observedEvents.join(',')}`,
    );

    dispatchKey(overlay, 'Escape');
    await Promise.resolve();
    recordCheck(
      checks,
      'escape-dismisses-overlay',
      !adapter.isOpen(overlay) &&
        observedEvents.includes('mth-close') &&
        observedEvents.includes('mth-after-close'),
      adapter.isOpen(overlay)
        ? 'Escape key did not close overlay'
        : observedEvents.includes('mth-close')
          ? undefined
          : 'Missing mth-close / mth-after-close events on Escape',
    );

    const activeAfterClose = document.activeElement;
    recordCheck(
      checks,
      'restores-focus-to-trigger',
      activeAfterClose === trigger,
      activeAfterClose === trigger
        ? undefined
        : `Expected focus restored to trigger, activeElement=${activeAfterClose?.tagName ?? 'null'}`,
    );

    if (adapter.supportsLightDismiss) {
      await adapter.open(overlay);
      const PointerEv = typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
      document.body.dispatchEvent(new PointerEv('pointerdown', { bubbles: true }));
      document.body.click();
      await Promise.resolve();
      recordCheck(
        checks,
        'light-dismiss-outside-click',
        !adapter.isOpen(overlay),
        adapter.isOpen(overlay) ? 'Outside click did not light-dismiss overlay' : undefined,
      );
    }

    const ariaReport = scanSameRootAria(wrapper);
    recordCheck(
      checks,
      'same-root-aria',
      ariaReport.valid,
      ariaReport.valid ? undefined : `ARIA issues: ${JSON.stringify(ariaReport.issues)}`,
    );
  } finally {
    wrapper.remove();
  }

  return finalizeSuite('OverlaySuite', checks, adapter);
}

export async function runRovingFocusSuite(adapter: RovingFocusAdapter): Promise<SuiteReport> {
  const checks: SuiteCheckResult[] = [];
  const orientation = adapter.orientation ?? 'horizontal';
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

  const ltrContainer = await adapter.mount('ltr');
  document.body.appendChild(ltrContainer);
  try {
    const items = adapter.getItems(ltrContainer);
    const activeTabs = items.filter((i) => i.tabIndex === 0);
    recordCheck(
      checks,
      'single-tabstop-roving-invariant',
      items.length >= 2 && activeTabs.length === 1,
      `items=${items.length}, tabIndex=0 count=${activeTabs.length}`,
    );

    if (items.length >= 2 && items[0]) {
      items[0].focus();
      dispatchKey(items[0], nextKey);
      const afterNext = items.findIndex((i) => i.tabIndex === 0);
      recordCheck(
        checks,
        `ltr-${nextKey}-advances`,
        afterNext === 1,
        afterNext === 1 ? undefined : `Expected active index 1 after ${nextKey}, got ${afterNext}`,
      );

      dispatchKey(items[1] ?? items[0], 'End');
      const afterEnd = items.findIndex((i) => i.tabIndex === 0);
      recordCheck(
        checks,
        'end-key-moves-to-last',
        afterEnd === items.length - 1,
        afterEnd === items.length - 1 ? undefined : `Expected last index ${items.length - 1}, got ${afterEnd}`,
      );

      dispatchKey(items[items.length - 1] ?? items[0], 'Home');
      const afterHome = items.findIndex((i) => i.tabIndex === 0);
      recordCheck(
        checks,
        'home-key-moves-to-first',
        afterHome === 0,
        afterHome === 0 ? undefined : `Expected index 0 after Home, got ${afterHome}`,
      );

      if (adapter.loop) {
        dispatchKey(items[0], prevKey);
        const afterWrap = items.findIndex((i) => i.tabIndex === 0);
        recordCheck(
          checks,
          'loop-wraps-to-end',
          afterWrap === items.length - 1,
          afterWrap === items.length - 1 ? undefined : `Expected wrap to ${items.length - 1}, got ${afterWrap}`,
        );
      }
    }
  } finally {
    ltrContainer.remove();
  }

  if (orientation === 'horizontal') {
    const rtlContainer = await adapter.mount('rtl');
    rtlContainer.setAttribute('dir', 'rtl');
    document.body.appendChild(rtlContainer);
    try {
      const items = adapter.getItems(rtlContainer);
      if (items.length >= 2 && items[0]) {
        items[0].focus();
        dispatchKey(items[0], 'ArrowLeft');
        const rtlAdvanceIdx = items.findIndex((i) => i.tabIndex === 0);
        recordCheck(
          checks,
          'rtl-arrow-left-advances',
          rtlAdvanceIdx === 1,
          rtlAdvanceIdx === 1
            ? undefined
            : `Expected dir="rtl" ArrowLeft to advance to index 1, got ${rtlAdvanceIdx}`,
        );

        dispatchKey(items[1] ?? items[0], 'ArrowRight');
        const rtlBackIdx = items.findIndex((i) => i.tabIndex === 0);
        recordCheck(
          checks,
          'rtl-arrow-right-retreats',
          rtlBackIdx === 0,
          rtlBackIdx === 0
            ? undefined
            : `Expected dir="rtl" ArrowRight to retreat to index 0, got ${rtlBackIdx}`,
        );
      }
    } finally {
      rtlContainer.remove();
    }
  }

  return finalizeSuite('RovingFocusSuite', checks, adapter);
}

function getEffectiveRole(node: Element): string | null {
  return node.getAttribute('role') ?? (node as HTMLElement & { role?: string | null }).role ?? null;
}

function findListboxElement(el: HTMLElement, root: ParentNode): HTMLElement | null {
  if (getEffectiveRole(el) === 'listbox') return el;
  if (typeof Element !== 'undefined' && root instanceof Element && getEffectiveRole(root) === 'listbox') {
    return root as HTMLElement;
  }
  for (const candidate of root.querySelectorAll('*')) {
    if (getEffectiveRole(candidate) === 'listbox') {
      return candidate as HTMLElement;
    }
  }
  return null;
}

export async function runListboxSuite(adapter: ListboxAdapter): Promise<SuiteReport> {
  const checks: SuiteCheckResult[] = [];
  const el = await adapter.mount();
  document.body.appendChild(el);

  try {
    const root = adapter.getListboxRoot(el);
    const options = adapter.getOptions(el);
    const listboxEl = findListboxElement(el, root);
    const hasListboxRole =
      listboxEl !== null && options.every((opt) => getEffectiveRole(opt) === 'option');

    recordCheck(
      checks,
      'listbox-option-roles',
      hasListboxRole && options.length >= 2,
      hasListboxRole ? undefined : 'Expected role="listbox" and role="option" elements',
    );

    const ariaReport = scanSameRootAria(root);
    recordCheck(
      checks,
      'same-root-aria',
      ariaReport.valid,
      ariaReport.valid ? undefined : `ARIA issues: ${JSON.stringify(ariaReport.issues)}`,
    );

    const focusTarget = listboxEl ?? el;
    focusTarget.focus();
    dispatchKey(focusTarget, 'ArrowDown');
    const firstActive = adapter.getActiveOption(el);
    recordCheck(
      checks,
      'arrow-down-activates-option',
      firstActive !== null,
      firstActive ? undefined : 'ArrowDown did not activate an option',
    );

    dispatchKey(focusTarget, 'Enter');
    const selectedAfterEnter = adapter.getSelectedOptions(el);
    recordCheck(
      checks,
      'enter-selects-active-option',
      selectedAfterEnter.length >= 1 &&
        selectedAfterEnter.every((o) => o.getAttribute('aria-selected') === 'true'),
      selectedAfterEnter.length >= 1
        ? undefined
        : 'Enter did not select active option with aria-selected="true"',
    );

    const secondLabel = options[1]?.textContent?.trim() ?? '';
    if (secondLabel.length > 0) {
      dispatchKey(focusTarget, secondLabel[0]!);
      const afterTypeahead = adapter.getActiveOption(el);
      recordCheck(
        checks,
        'typeahead-matches-option',
        afterTypeahead !== null &&
          (afterTypeahead.textContent?.trim().toLowerCase().startsWith(secondLabel[0]!.toLowerCase()) ??
            false),
        `afterTypeahead="${afterTypeahead?.textContent?.trim() ?? 'null'}"`,
      );
    }
  } finally {
    el.remove();
  }

  return finalizeSuite('ListboxSuite', checks, adapter);
}

export async function runDataConsumerSuite<T = { id: string; label: string }>(
  adapter: DataConsumerAdapter<T>,
): Promise<SuiteReport> {
  const checks: SuiteCheckResult[] = [];
  const abortedSignals: AbortSignal[] = [];
  let mode: 'normal' | 'empty' | 'error' = 'normal';
  let pendingResolvers: Array<() => void> = [];

  const dataSource: ConformanceDataSource<T> = {
    query(request: ConformanceDataQuery<unknown>) {
      request.signal.addEventListener('abort', () => {
        abortedSignals.push(request.signal);
      });

      return new Promise((resolve, reject) => {
        const complete = () => {
          if (request.signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          if (mode === 'error') {
            reject(new Error('Simulated DataSource failure'));
            return;
          }
          if (mode === 'empty') {
            resolve({ items: [], total: 0, nextCursor: null });
            return;
          }
          const items = [
            { id: '1', label: 'Alpha' },
            { id: '2', label: 'Beta' },
          ] as unknown as T[];
          resolve({ items, total: items.length, nextCursor: null });
        };

        pendingResolvers.push(complete);
      });
    },
  };

  const el = await adapter.mount(dataSource);
  document.body.appendChild(el);

  try {
    // 1. Overlapping query cancels previous AbortSignal
    const firstPromise = adapter.triggerQuery(el, 'first');
    const secondPromise = adapter.triggerQuery(el, 'second');

    recordCheck(
      checks,
      'loading-state-entered',
      adapter.getState(el) === 'loading' || adapter.getState(el) === 'refreshing',
      `state=${adapter.getState(el)}`,
    );

    const resolversToFlush = [...pendingResolvers];
    pendingResolvers = [];
    for (const r of resolversToFlush) r();
    await Promise.all([firstPromise, secondPromise]);

    recordCheck(
      checks,
      'aborts-stale-in-flight-query',
      abortedSignals.length >= 1,
      abortedSignals.length >= 1
        ? undefined
        : 'Expected stale query AbortSignal to be aborted when superseded',
    );

    recordCheck(
      checks,
      'ready-state-renders-items',
      adapter.getState(el) === 'ready' && adapter.getRenderedItemCount(el) === 2,
      `state=${adapter.getState(el)}, count=${adapter.getRenderedItemCount(el)}`,
    );

    // 2. Empty state
    mode = 'empty';
    const emptyPromise = adapter.triggerQuery(el, 'none');
    pendingResolvers.splice(0).forEach((r) => r());
    await emptyPromise;
    recordCheck(
      checks,
      'empty-state',
      adapter.getState(el) === 'empty' && adapter.getRenderedItemCount(el) === 0,
      `state=${adapter.getState(el)}, count=${adapter.getRenderedItemCount(el)}`,
    );

    // 3. Error state + recovery
    mode = 'error';
    const errorPromise = adapter.triggerQuery(el, 'boom');
    pendingResolvers.splice(0).forEach((r) => r());
    await errorPromise;
    recordCheck(
      checks,
      'error-state',
      adapter.getState(el) === 'error',
      `state=${adapter.getState(el)}`,
    );

    mode = 'normal';
    const recoverPromise = adapter.triggerQuery(el, 'recover');
    pendingResolvers.splice(0).forEach((r) => r());
    await recoverPromise;
    recordCheck(
      checks,
      'error-recovery-to-ready',
      adapter.getState(el) === 'ready' && adapter.getRenderedItemCount(el) === 2,
      `state=${adapter.getState(el)}, count=${adapter.getRenderedItemCount(el)}`,
    );
  } finally {
    el.remove();
  }

  return finalizeSuite('DataConsumerSuite', checks, adapter);
}

export async function runSatelliteEngineSuite<TEngine = unknown>(
  adapter: SatelliteEngineAdapter<TEngine>,
): Promise<SuiteReport> {
  const checks: SuiteCheckResult[] = [];
  const hostContainer = adapter.container ?? document.body;
  const cycles = adapter.cycles ?? 50;

  let mountUnmountClean = true;
  let failureReason = '';

  for (let i = 0; i < cycles; i++) {
    const el = adapter.createElement();
    hostContainer.appendChild(el);
    await Promise.resolve();
    if (i === 0) {
      recordCheck(
        checks,
        'exposes-typed-engine-property',
        'engine' in el && el.engine !== null,
        'engine' in el && el.engine !== null
          ? undefined
          : 'Expected SatelliteElement.engine to be non-null when mounted',
      );
    }
    el.remove();
    await Promise.resolve();
    if (el.engine !== null) {
      mountUnmountClean = false;
      failureReason = `Cycle ${i}: el.engine was not cleaned up on disconnect`;
      break;
    }
  }

  recordCheck(
    checks,
    `${cycles}x-mount-unmount-cleanup`,
    mountUnmountClean,
    mountUnmountClean ? undefined : failureReason,
  );

  const el = adapter.createElement();
  hostContainer.appendChild(el);
  await Promise.resolve();
  try {
    const tokenName = adapter.tokenName ?? '--mth-color-accent';
    const tokenValue = adapter.tokenValue ?? 'oklch(0.6 0.2 250)';
    el.style.setProperty(tokenName, tokenValue);
    const applied = adapter.readAppliedToken
      ? adapter.readAppliedToken(el, tokenName)
      : el.style.getPropertyValue(tokenName);
    recordCheck(
      checks,
      'token-synchronization',
      applied === tokenValue,
      applied === tokenValue
        ? undefined
        : `Expected token ${tokenName}="${tokenValue}", got "${applied}"`,
    );
  } finally {
    el.remove();
  }

  return finalizeSuite('SatelliteEngineSuite', checks, adapter);
}

export async function runHydrationPuritySuite(
  adapter: HydrationPurityAdapter,
): Promise<SuiteReport> {
  const checks: SuiteCheckResult[] = [];
  const stage = document.createElement('div');
  const parsed = new DOMParser().parseFromString(adapter.ssrHtml, 'text/html');
  while (parsed.body.firstChild) {
    stage.appendChild(document.adoptNode(parsed.body.firstChild));
  }
  document.body.appendChild(stage);

  try {
    const host = stage.firstElementChild as HTMLElement | null;
    if (!host) {
      recordCheck(checks, 'ssr-host-present', false, 'ssrHtml did not produce a root host element');
      return finalizeSuite('HydrationPuritySuite', checks, adapter);
    }

    // Materialize DSD <template shadowrootmode="open"> if running in a DOM without native DSD parsing (e.g. JSDOM)
    const dsdTemplate = host.querySelector(':scope > template[shadowrootmode]');
    let shadowRoot = adapter.getShadowRoot ? adapter.getShadowRoot(host) : host.shadowRoot;
    if (dsdTemplate && !shadowRoot) {
      shadowRoot = host.attachShadow({ mode: 'open' });
      shadowRoot.appendChild((dsdTemplate as HTMLTemplateElement).content.cloneNode(true));
      dsdTemplate.remove();
    }

    let shadowChildMutations = 0;
    let observer: MutationObserver | undefined;
    if (shadowRoot) {
      observer = new MutationObserver((records) => {
        for (const rec of records) {
          if (rec.type === 'childList') {
            shadowChildMutations += rec.addedNodes.length + rec.removedNodes.length;
          }
        }
      });
      observer.observe(shadowRoot, { childList: true, subtree: true });
    }

    await adapter.upgradeElement(host);
    await Promise.resolve();
    observer?.disconnect();

    recordCheck(
      checks,
      'zero-shadow-child-mutations-on-upgrade',
      shadowChildMutations === 0,
      shadowChildMutations === 0
        ? undefined
        : `Observed ${shadowChildMutations} unexpected shadow-tree child mutations during hydration`,
    );

    const ariaReport = scanSameRootAria(host);
    recordCheck(
      checks,
      'same-root-aria',
      ariaReport.valid,
      ariaReport.valid ? undefined : `ARIA issues: ${JSON.stringify(ariaReport.issues)}`,
    );
  } finally {
    stage.remove();
  }

  return finalizeSuite('HydrationPuritySuite', checks, adapter);
}

export const FormControlSuite = { run: runFormControlSuite } as const;
export const OverlaySuite = { run: runOverlaySuite } as const;
export const RovingFocusSuite = { run: runRovingFocusSuite } as const;
export const ListboxSuite = { run: runListboxSuite } as const;
export const DataConsumerSuite = { run: runDataConsumerSuite } as const;
export const SatelliteEngineSuite = { run: runSatelliteEngineSuite } as const;
export const HydrationPuritySuite = { run: runHydrationPuritySuite } as const;
