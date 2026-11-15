import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { menubarSpec } from './menubar.spec.js';
import { MthMenubar, registerMthMenubar } from './index.js';

describe('<mth-menubar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, RovingFocusSuite (LTR + RTL), and same-root ARIA', async () => {
    const compiled = compileSpec(menubarSpec);
    expect(compiled.docs).toContain('`<mth-menubar>`');

    const report = await runBehaviorSpecAssertions(menubarSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const roving = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const bar = document.createElement('mth-menubar') as MthMenubar;
        bar.setAttribute('dir', dir);
        bar.items = [
          { value: 'file', label: 'File', children: [{ value: 'new', label: 'New' }] },
          { value: 'edit', label: 'Edit', children: [{ value: 'copy', label: 'Copy' }] },
          { value: 'disabled', label: 'Disabled', disabled: true },
          { value: 'view', label: 'View' },
        ];
        document.body.appendChild(bar);
        await bar.updateComplete;
        return bar;
      },
      getItems: (el: HTMLElement) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')),
    });
    expect(roving.failures).toEqual([]);
    expect(roving.passed).toBe(true);
  });

  it('supports opening submenus via ArrowDown, navigating items, and Escape restoration', async () => {
    const bar = document.createElement('mth-menubar') as MthMenubar;
    bar.items = [
      {
        value: 'file',
        label: 'File',
        children: [
          { value: 'open', label: 'Open', shortcut: 'Cmd+O' },
          { value: 'save', label: 'Save', shortcut: 'Cmd+S' },
        ],
      },
      { value: 'help', label: 'Help' },
    ];
    document.body.appendChild(bar);
    await bar.updateComplete;

    const onSelect = vi.fn();
    bar.addEventListener('mth-select', onSelect);

    const fileBtn = bar.shadowRoot!.querySelector<HTMLButtonElement>('[data-value="file"]')!;
    fileBtn.focus();
    fileBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await bar.updateComplete;
    await Promise.resolve();

    const menu = bar.shadowRoot!.querySelector<HTMLElement>('[data-menu-for="file"]')!;
    expect(menu.hasAttribute('hidden')).toBe(false);
    expect(fileBtn.getAttribute('aria-expanded')).toBe('true');

    const subItems = Array.from(menu.querySelectorAll<HTMLElement>('[part="submenu-item"]'));
    expect(bar.shadowRoot!.activeElement).toBe(subItems[0]);

    subItems[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(bar.shadowRoot!.activeElement).toBe(subItems[1]);

    subItems[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await bar.updateComplete;
    expect(menu.hasAttribute('hidden')).toBe(true);
    expect(bar.shadowRoot!.activeElement).toBe(fileBtn);

    subItems[0]!.click();
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ value: 'open', parentValue: 'file' }),
      }),
    );

    const aria = scanSameRootAria(bar.shadowRoot!);
    expect(aria.valid, JSON.stringify(aria.issues)).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-menubar label="Main menu"></mth-menubar>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-menubar>', 'hyd-menubar>')
      .replaceAll('<mth-menubar', '<hyd-menubar');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMenubar('hyd');
        customElements.upgrade(host);
        await (host as MthMenubar).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
