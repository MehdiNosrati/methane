import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import {
  type CodeTabItem,
  codeTabsSpec,
  MthCodeTabs,
  registerMthCodeTabs,
} from './index.js';

const SAMPLE_TABS: ReadonlyArray<CodeTabItem> = [
  { value: 'npm', label: 'npm', language: 'bash', code: 'npm install @methane/ui' },
  { value: 'pnpm', label: 'pnpm', language: 'bash', code: 'pnpm add @methane/ui' },
  { value: 'bun', label: 'bun', language: 'bash', code: 'bun add @methane/ui' },
];

describe('<mth-code-tabs>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('compiles spec, passes RovingFocusSuite (LTR & RTL), and passes same-root ARIA scan', async () => {
    const compiled = compileSpec(codeTabsSpec);
    expect(compiled.docs).toContain('`<mth-code-tabs>`');

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-code-tabs') as MthCodeTabs;
        el.setAttribute('dir', dir);
        el.label = 'Package managers';
        el.tabs = SAMPLE_TABS;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) => (container as MthCodeTabs).getTabs() as HTMLElement[],
    };

    const specReport = await runBehaviorSpecAssertions(codeTabsSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);

    const el = await rovingAdapter.mount('ltr');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('supports slotted code panels, switches tabs with mth-change, and copies active snippet', async () => {
    const el = document.createElement('mth-code-tabs') as MthCodeTabs;
    el.label = 'Install commands';

    const npmPre = document.createElement('pre');
    npmPre.setAttribute('label', 'npm');
    npmPre.setAttribute('value', 'npm');
    npmPre.textContent = 'npm i @methane/ui';

    const pnpmPre = document.createElement('pre');
    pnpmPre.setAttribute('label', 'pnpm');
    pnpmPre.setAttribute('value', 'pnpm');
    pnpmPre.textContent = 'pnpm add @methane/ui';

    el.append(npmPre, pnpmPre);

    const changes: string[] = [];
    el.addEventListener('mth-change', (ev) => {
      changes.push((ev as CustomEvent<{ value: string }>).detail.value);
    });

    const copies: Array<{ value: string; code: string; ok: boolean }> = [];
    el.addEventListener('mth-copy', (ev) => {
      copies.push((ev as CustomEvent<{ value: string; code: string; ok: boolean }>).detail);
    });

    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('[part="code"]')?.textContent).toBe('npm i @methane/ui');

    const tabs = el.getTabs();
    expect(tabs).toHaveLength(2);
    tabs[1]!.click();
    await el.updateComplete;

    expect(el.value).toBe('pnpm');
    expect(changes).toEqual(['pnpm']);
    expect(el.shadowRoot!.querySelector('[part="code"]')?.textContent).toBe('pnpm add @methane/ui');

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    const copyBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy-button"]')!;
    copyBtn.click();
    await vi.waitFor(() => {
      expect(copies).toHaveLength(1);
    });

    expect(writeTextMock).toHaveBeenCalledWith('pnpm add @methane/ui');
    expect(copies[0]).toEqual({ value: 'pnpm', code: 'pnpm add @methane/ui', ok: true });
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthCodeTabs();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-code-tabs label="Code" value="npm"></mth-code-tabs>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-code-tabs>', 'hyd-code-tabs>')
      .replaceAll('<mth-code-tabs', '<hyd-code-tabs');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCodeTabs('hyd');
        customElements.upgrade(host);
        await (host as MthCodeTabs).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
