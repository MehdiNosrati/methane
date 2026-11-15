import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { FormControlSuite, HydrationPuritySuite, ListboxSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import {
  MthTransferList,
  registerMthTransferList,
  transferListSpec,
  type TransferListChangeDetail,
  type TransferListItem,
} from './index.js';

const SAMPLE_ITEMS: ReadonlyArray<TransferListItem> = [
  { key: 'read', label: 'Read files' },
  { key: 'write', label: 'Write files' },
  { key: 'deploy', label: 'Deploy releases' },
  { key: 'admin', label: 'Admin access', disabled: true },
];

describe('<mth-transfer-list>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(transferListSpec);
    expect(compiled.tests).toContain('<mth-transfer-list>');

    let mounted: MthTransferList | null = null;
    const specReport = await runBehaviorSpecAssertions(transferListSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-transfer-list') as MthTransferList;
          mounted.label = 'Permissions';
          mounted.options = SAMPLE_ITEMS;
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthTransferList).value = val;
          await (el as MthTransferList).updateComplete;
        },
        getValue: (el) => (el as MthTransferList).value,
        nextValue: 'read,deploy',
        getFormDataValue: (formData, name) => {
          const nativeVal = formData.get(name);
          if (nativeVal !== null) return nativeVal;
          const hasNativeFace =
            typeof ElementInternals !== 'undefined' &&
            typeof ElementInternals.prototype.setFormValue === 'function';
          if (hasNativeFace || !mounted) return null;
          return mounted.isEffectivelyDisabled ? null : mounted.value;
        },
        getInternalDisabled: (el) =>
          Boolean((el as MthTransferList).shadowRoot!.querySelector<HTMLInputElement>('input')?.disabled),
        isRequiredInvalid: (el) => !(el as MthTransferList).checkValidity(),
      },
      listbox: {
        mount: async () => {
          const el = document.createElement('mth-transfer-list') as MthTransferList;
          el.label = 'Permissions';
          el.options = SAMPLE_ITEMS;
          document.body.appendChild(el);
          await el.updateComplete;
          return el;
        },
        getListboxRoot: (el) => (el as MthTransferList).shadowRoot!,
        getOptions: (el) =>
          Array.from(
            (el as MthTransferList).shadowRoot!.querySelectorAll<HTMLElement>('[data-pane="source"] [role="option"]'),
          ),
        getActiveOption: (el) => {
          const tl = el as MthTransferList;
          const id = tl.shadowRoot!
            .querySelector('[data-pane="source"] [role="listbox"]')
            ?.getAttribute('aria-activedescendant');
          return id ? tl.shadowRoot!.getElementById(id) : null;
        },
        getSelectedOptions: (el) =>
          Array.from(
            (el as MthTransferList).shadowRoot!.querySelectorAll<HTMLElement>(
              '[data-pane="source"] [role="option"][aria-selected="true"]',
            ),
          ),
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const listboxReport = await ListboxSuite.run({
      mount: async () => {
        const el = document.createElement('mth-transfer-list') as MthTransferList;
        el.label = 'Permissions';
        el.options = SAMPLE_ITEMS;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getListboxRoot: (el) => (el as MthTransferList).shadowRoot!,
      getOptions: (el) =>
        Array.from(
          (el as MthTransferList).shadowRoot!.querySelectorAll<HTMLElement>('[data-pane="source"] [role="option"]'),
        ),
      getActiveOption: (el) => {
        const tl = el as MthTransferList;
        const id = tl.shadowRoot!
          .querySelector('[data-pane="source"] [role="listbox"]')
          ?.getAttribute('aria-activedescendant');
        return id ? tl.shadowRoot!.getElementById(id) : null;
      },
      getSelectedOptions: (el) =>
        Array.from(
          (el as MthTransferList).shadowRoot!.querySelectorAll<HTMLElement>(
            '[data-pane="source"] [role="option"][aria-selected="true"]',
          ),
        ),
    });
    expect(listboxReport.failures).toEqual([]);
    expect(listboxReport.passed).toBe(true);

    let standalone: MthTransferList | null = null;
    const formReport = await FormControlSuite.run({
      mount: () => {
        standalone = document.createElement('mth-transfer-list') as MthTransferList;
        standalone.label = 'Scopes';
        standalone.options = SAMPLE_ITEMS;
        return standalone;
      },
      setValue: async (el, val) => {
        (el as MthTransferList).value = val;
        await (el as MthTransferList).updateComplete;
      },
      getValue: (el) => (el as MthTransferList).value,
      nextValue: 'write',
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !standalone) return null;
        return standalone.isEffectivelyDisabled ? null : standalone.value;
      },
      getInternalDisabled: (el) =>
        Boolean((el as MthTransferList).shadowRoot!.querySelector<HTMLInputElement>('input')?.disabled),
      isRequiredInvalid: (el) => !(el as MthTransferList).checkValidity(),
    });
    expect(formReport.passed).toBe(true);

    const ariaEl = document.createElement('mth-transfer-list') as MthTransferList;
    ariaEl.label = 'Permissions';
    ariaEl.hint = 'Assign role capabilities';
    ariaEl.options = SAMPLE_ITEMS;
    ariaEl.value = 'read';
    document.body.append(ariaEl);
    await ariaEl.updateComplete;
    expect(scanSameRootAria(ariaEl.shadowRoot!).issues).toEqual([]);
  });

  it('transfers checked items, supports filtering, select-all, and skips disabled items', async () => {
    const el = document.createElement('mth-transfer-list') as MthTransferList;
    el.label = 'Capabilities';
    el.options = SAMPLE_ITEMS;
    document.body.append(el);
    await el.updateComplete;

    const changes: TransferListChangeDetail[] = [];
    el.addEventListener('mth-change', (e) => {
      changes.push((e as CustomEvent<TransferListChangeDetail>).detail);
    });

    const sourcePane = el.shadowRoot!.querySelector<HTMLElement>('[data-pane="source"]')!;
    const readCheckbox = sourcePane.querySelector<HTMLInputElement>('[data-key="read"] input[type="checkbox"]')!;
    readCheckbox.checked = true;
    readCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;

    const moveRightBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-action="move-right"]')!;
    moveRightBtn.click();
    await el.updateComplete;

    expect(el.value).toBe('read');
    expect(changes).toHaveLength(1);
    expect(changes[0]!.direction).toBe('right');
    expect(changes[0]!.movedKeys).toEqual(['read']);

    const moveAllRightBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-action="move-all-right"]')!;
    moveAllRightBtn.click();
    await el.updateComplete;

    expect(el.targetKeys).toEqual(['read', 'write', 'deploy']);
    expect(el.targetKeys).not.toContain('admin');

    const targetPane = el.shadowRoot!.querySelector<HTMLElement>('[data-pane="target"]')!;
    const targetSearch = targetPane.querySelector<HTMLInputElement>('[part="search"]')!;
    targetSearch.value = 'Deploy';
    targetSearch.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(targetPane.querySelectorAll('[part="item"]').length).toBe(1);

    const targetSelectAll = targetPane.querySelector<HTMLInputElement>('.pane-header input[type="checkbox"]')!;
    targetSelectAll.checked = true;
    targetSelectAll.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;

    const moveLeftBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-action="move-left"]')!;
    moveLeftBtn.click();
    await el.updateComplete;
    expect(el.targetKeys).toEqual(['read', 'write']);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthTransferList();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-transfer-list label="Permissions" source-title="Available" target-title="Assigned"></mth-transfer-list>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-transfer-list>', 'hyd-transfer-list>')
      .replaceAll('<mth-transfer-list', '<hyd-transfer-list');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTransferList('hyd');
        customElements.upgrade(host);
        await (host as MthTransferList).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
