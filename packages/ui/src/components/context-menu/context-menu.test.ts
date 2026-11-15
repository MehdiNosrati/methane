import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { contextMenuSpec } from './context-menu.spec.js';
import { MthContextMenu, registerMthContextMenu } from './index.js';

describe('<mth-context-menu>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite in fallback and native popover modes', async () => {
    const compiled = compileSpec(contextMenuSpec);
    expect(compiled.docs).toContain('`<mth-context-menu>`');

    const report = await runBehaviorSpecAssertions(contextMenuSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const fallbackReport = await OverlaySuite.run({
      supportsLightDismiss: true,
      supportsCancelableOpen: true,
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Target';
        const overlay = document.createElement('mth-context-menu') as MthContextMenu;
        overlay.forceFallback = true;
        overlay.items = [
          { value: 'copy', label: 'Copy', shortcut: 'Cmd+C' },
          { value: 'paste', label: 'Paste', shortcut: 'Cmd+V' },
        ];
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthContextMenu).openAt(120, 200);
        await (overlay as MthContextMenu).updateComplete;
      },
      close: async (overlay) => {
        await (overlay as MthContextMenu).hide('programmatic');
        await (overlay as MthContextMenu).updateComplete;
      },
      isOpen: (overlay) => (overlay as MthContextMenu).open,
    });
    expect(fallbackReport.failures).toEqual([]);
    expect(fallbackReport.passed).toBe(true);

    const origShow = HTMLElement.prototype.showPopover;
    const origHide = HTMLElement.prototype.hidePopover;
    HTMLElement.prototype.showPopover = function () {
      this.setAttribute('data-popover-open', 'true');
    };
    HTMLElement.prototype.hidePopover = function () {
      this.removeAttribute('data-popover-open');
    };
    try {
      const nativeReport = await OverlaySuite.run({
        supportsLightDismiss: true,
        supportsCancelableOpen: true,
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Target Native';
          const overlay = document.createElement('mth-context-menu') as MthContextMenu;
          overlay.items = [{ value: 'inspect', label: 'Inspect' }];
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthContextMenu).openAt(80, 90);
          await (overlay as MthContextMenu).updateComplete;
        },
        close: async (overlay) => {
          await (overlay as MthContextMenu).hide('programmatic');
          await (overlay as MthContextMenu).updateComplete;
        },
        isOpen: (overlay) => (overlay as MthContextMenu).open,
      });
      expect(nativeReport.failures).toEqual([]);
      expect(nativeReport.passed).toBe(true);
    } finally {
      HTMLElement.prototype.showPopover = origShow;
      HTMLElement.prototype.hidePopover = origHide;
    }
  });

  it('positions via virtual pointer anchor on contextmenu and navigates nested submenus', async () => {
    const cm = document.createElement('mth-context-menu') as MthContextMenu;
    cm.items = [
      { value: 'cut', label: 'Cut' },
      {
        value: 'export',
        label: 'Export',
        children: [
          { value: 'export-pdf', label: 'Export PDF' },
          { value: 'export-csv', label: 'Export CSV' },
        ],
      },
    ];
    const target = document.createElement('div');
    target.textContent = 'Right click here';
    cm.appendChild(target);
    document.body.appendChild(cm);
    await cm.updateComplete;

    target.dispatchEvent(
      new MouseEvent('contextmenu', { clientX: 160, clientY: 220, bubbles: true, cancelable: true }),
    );
    await cm.updateComplete;
    await Promise.resolve();
    await cm.updateComplete;

    const popup = cm.shadowRoot!.querySelector<HTMLElement>('#mth-cm-popup')!;
    expect(cm.open).toBe(true);
    expect(cm.lastPositioningResult?.strategy).toBe('js-fallback');
    expect(popup.style.insetInlineStart).toBeTruthy();

    const exportBtn = cm.shadowRoot!.querySelector<HTMLElement>('[data-value="export"]')!;
    exportBtn.focus();
    exportBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await cm.updateComplete;
    await Promise.resolve();

    const submenu = cm.shadowRoot!.querySelector<HTMLElement>('[data-submenu-path="export"]')!;
    expect(submenu.hasAttribute('hidden')).toBe(false);

    const onSelect = vi.fn();
    cm.addEventListener('mth-select', onSelect);
    const pdfBtn = submenu.querySelector<HTMLElement>('[data-value="export-pdf"]')!;
    pdfBtn.click();
    await cm.updateComplete;
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: 'export-pdf', label: 'Export PDF' } }),
    );
    expect(cm.open).toBe(false);

    const aria = scanSameRootAria(cm.shadowRoot!);
    expect(aria.valid, JSON.stringify(aria.issues)).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-context-menu label="Actions"></mth-context-menu>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-context-menu>', 'hyd-context-menu>')
      .replaceAll('<mth-context-menu', '<hyd-context-menu');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthContextMenu('hyd');
        customElements.upgrade(host);
        await (host as MthContextMenu).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
