import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { commandPaletteSpec, type CommandPaletteItem } from './command-palette.spec.js';
import { MthCommandPalette, registerMthCommandPalette } from './index.js';

const SAMPLE_COMMANDS: ReadonlyArray<CommandPaletteItem> = [
  {
    id: 'open-docs',
    label: 'Alpha Documentation',
    group: 'Navigation',
    shortcut: 'G D',
    href: '/docs',
    keywords: ['guide', 'manual'],
  },
  {
    id: 'toggle-theme',
    label: 'Beta Toggle Theme',
    group: 'Preferences',
    shortcut: 'Cmd+Shift+T',
    keywords: ['dark', 'light'],
  },
  {
    id: 'unsafe-cmd',
    label: 'Gamma Unsafe Action',
    group: 'Security',
    href: 'javascript:alert(1)',
  },
];

describe('<mth-command-palette>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, OverlaySuite, and ListboxSuite with same-root ARIA', async () => {
    const compiled = compileSpec(commandPaletteSpec);
    expect(compiled.docs).toContain('`<mth-command-palette>`');

    const report = await runBehaviorSpecAssertions(commandPaletteSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const overlayReport = await OverlaySuite.run({
      supportsLightDismiss: true,
      supportsCancelableOpen: true,
      mount: async () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-command-palette') as MthCommandPalette;
        overlay.forceFallback = true;
        overlay.commands = SAMPLE_COMMANDS;
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthCommandPalette).show();
        await (overlay as MthCommandPalette).updateComplete;
      },
      close: async (overlay) => {
        await (overlay as MthCommandPalette).hide('programmatic');
        await (overlay as MthCommandPalette).updateComplete;
      },
      isOpen: (overlay) => (overlay as MthCommandPalette).open,
    });
    expect(overlayReport.failures).toEqual([]);
    expect(overlayReport.passed).toBe(true);

    const origShowModal = HTMLDialogElement.prototype.showModal;
    const origClose = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
    };
    try {
      const nativeReport = await OverlaySuite.run({
        supportsLightDismiss: true,
        supportsCancelableOpen: true,
        mount: async () => {
          const trigger = document.createElement('button');
          const overlay = document.createElement('mth-command-palette') as MthCommandPalette;
          overlay.commands = SAMPLE_COMMANDS;
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthCommandPalette).show();
          await (overlay as MthCommandPalette).updateComplete;
        },
        close: async (overlay) => {
          await (overlay as MthCommandPalette).hide('programmatic');
          await (overlay as MthCommandPalette).updateComplete;
        },
        isOpen: (overlay) => (overlay as MthCommandPalette).open,
      });
      expect(nativeReport.failures).toEqual([]);
      expect(nativeReport.passed).toBe(true);
    } finally {
      HTMLDialogElement.prototype.showModal = origShowModal;
      HTMLDialogElement.prototype.close = origClose;
    }

    const listboxReport = await ListboxSuite.run({
      mount: async () => {
        const cp = document.createElement('mth-command-palette') as MthCommandPalette;
        cp.forceFallback = true;
        cp.commands = SAMPLE_COMMANDS;
        document.body.appendChild(cp);
        await cp.updateComplete;
        await cp.show();
        await cp.updateComplete;
        return cp;
      },
      getListboxRoot: (el) => el.shadowRoot!,
      getOptions: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"]')),
      getActiveOption: (el) =>
        el.shadowRoot!.querySelector<HTMLElement>('[part="option"][data-active="true"]'),
      getSelectedOptions: (el) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"][aria-selected="true"]')),
    });
    expect(listboxReport.failures).toEqual([]);
    expect(listboxReport.passed).toBe(true);
  });

  it('toggles via global Cmd/Ctrl+K hotkey, filters commands, and sanitizes hrefs', async () => {
    const cp = document.createElement('mth-command-palette') as MthCommandPalette;
    cp.forceFallback = true;
    cp.commands = SAMPLE_COMMANDS;
    document.body.appendChild(cp);
    await cp.updateComplete;

    expect(cp.open).toBe(false);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }),
    );
    await cp.updateComplete;
    await Promise.resolve();
    expect(cp.open).toBe(true);

    const input = cp.shadowRoot!.querySelector<HTMLInputElement>('#mth-cp-input')!;
    input.value = 'unsafe';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await cp.updateComplete;
    expect(cp.filteredCommands.map((c) => c.id)).toEqual(['unsafe-cmd']);

    const selected = vi.fn();
    cp.addEventListener('mth-select', selected);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await cp.updateComplete;
    await Promise.resolve();
    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: 'unsafe-cmd', label: 'Gamma Unsafe Action' } }),
    );
    expect(cp.open).toBe(false);

    const aria = scanSameRootAria(cp.shadowRoot!);
    expect(aria.issues).toEqual([]);
  });

  it('skips disabled commands and wraps on ArrowDown/ArrowUp from input', async () => {
    const cp = document.createElement('mth-command-palette') as MthCommandPalette;
    cp.forceFallback = true;
    cp.commands = [
      { id: 'first', label: 'First Action' },
      { id: 'mid-disabled', label: 'Disabled Action', disabled: true },
      { id: 'last', label: 'Last Action' },
    ];
    document.body.appendChild(cp);
    await cp.updateComplete;
    await cp.show();
    await cp.updateComplete;

    const input = cp.shadowRoot!.querySelector<HTMLInputElement>('#mth-cp-input')!;
    const activeValue = (): string | undefined =>
      cp.shadowRoot!.querySelector<HTMLElement>('[part="option"][data-active="true"]')?.dataset[
        'value'
      ];

    // ArrowDown from -1 starts at first enabled option ('first')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await cp.updateComplete;
    expect(activeValue()).toBe('first');

    // ArrowDown skips 'mid-disabled' and lands on 'last'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await cp.updateComplete;
    expect(activeValue()).toBe('last');

    // ArrowDown at end wraps back to 'first'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await cp.updateComplete;
    expect(activeValue()).toBe('first');

    // ArrowUp wraps back to 'last', skipping 'mid-disabled'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await cp.updateComplete;
    expect(activeValue()).toBe('last');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-command-palette label="Actions"></mth-command-palette>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-command-palette>', 'hyd-command-palette>')
      .replaceAll('<mth-command-palette', '<hyd-command-palette');
    const purityReport = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCommandPalette('hyd');
        customElements.upgrade(host);
        await (host as MthCommandPalette).updateComplete;
      },
    });
    expect(purityReport.failures).toEqual([]);
    expect(purityReport.passed).toBe(true);
  });
});
