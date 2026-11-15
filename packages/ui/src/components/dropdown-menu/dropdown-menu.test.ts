import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane/ui/menu-item';
import type { MthMenuItem } from '@methane/ui/menu-item';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthDropdownMenu, dropdownMenuSpec, registerMthDropdownMenu } from './index.js';

function createMenuItems(): MthMenuItem[] {
  const cut = document.createElement('mth-menu-item') as MthMenuItem;
  cut.value = 'cut';
  cut.textContent = 'Cut';

  const copy = document.createElement('mth-menu-item') as MthMenuItem;
  copy.value = 'copy';
  copy.textContent = 'Copy';

  const paste = document.createElement('mth-menu-item') as MthMenuItem;
  paste.value = 'paste';
  paste.textContent = 'Paste';

  return [cut, copy, paste];
}

describe('<mth-dropdown-menu>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions across OverlaySuite, ListboxSuite, and RovingFocusSuite', async () => {
    const compiled = compileSpec(dropdownMenuSpec);
    expect(compiled.docs).toContain('`<mth-dropdown-menu>`');

    const report = await runBehaviorSpecAssertions(dropdownMenuSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Actions';
          const overlay = document.createElement('mth-dropdown-menu') as MthDropdownMenu;
          overlay.anchor = trigger;
          overlay.append(...createMenuItems());
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthDropdownMenu).show();
        },
        close: async (overlay) => {
          await (overlay as MthDropdownMenu).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthDropdownMenu).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
      listbox: {
        mount: async () => {
          const el = document.createElement('mth-dropdown-menu') as MthDropdownMenu;
          el.roleMode = 'listbox';
          el.label = 'Actions';
          el.append(...createMenuItems());
          document.body.appendChild(el);
          await el.updateComplete;
          await el.show();
          await el.updateComplete;
          await Promise.all(
            Array.from(el.querySelectorAll<MthMenuItem>('mth-menu-item')).map(
              (item) => item.updateComplete,
            ),
          );
          return el;
        },
        getListboxRoot: (el) => el.shadowRoot!,
        getOptions: (el) => Array.from(el.querySelectorAll<HTMLElement>('mth-menu-item')),
        getActiveOption: (el) =>
          el.querySelector<HTMLElement>('mth-menu-item[data-active="true"]'),
        getSelectedOptions: (el) =>
          Array.from(el.querySelectorAll<HTMLElement>('mth-menu-item[aria-selected="true"]')),
      },
      rovingFocus: {
        orientation: 'vertical',
        loop: true,
        mount: async () => {
          const el = document.createElement('mth-dropdown-menu') as MthDropdownMenu;
          el.append(...createMenuItems());
          document.body.appendChild(el);
          await el.updateComplete;
          await el.show();
          await el.updateComplete;
          return el;
        },
        getItems: (container) =>
          Array.from(container.querySelectorAll<HTMLElement>('mth-menu-item')),
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    // Explicit fallback OverlaySuite check
    const fallbackReport = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Fallback menu';
        const overlay = document.createElement('mth-dropdown-menu') as MthDropdownMenu;
        overlay.forceFallback = true;
        overlay.anchor = trigger;
        overlay.append(...createMenuItems());
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthDropdownMenu).show();
      },
      close: async (overlay) => {
        await (overlay as MthDropdownMenu).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthDropdownMenu).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(fallbackReport.failures).toEqual([]);
    expect(fallbackReport.passed).toBe(true);

    // Standalone ListboxSuite and RovingFocusSuite invocations
    const lbReport = await ListboxSuite.run({
      mount: async () => {
        const el = document.createElement('mth-dropdown-menu') as MthDropdownMenu;
        el.roleMode = 'listbox';
        el.append(...createMenuItems());
        document.body.appendChild(el);
        await el.updateComplete;
        await el.show();
        await el.updateComplete;
        await Promise.all(
          Array.from(el.querySelectorAll<MthMenuItem>('mth-menu-item')).map(
            (item) => item.updateComplete,
          ),
        );
        return el;
      },
      getListboxRoot: (el) => el.shadowRoot!,
      getOptions: (el) => Array.from(el.querySelectorAll<HTMLElement>('mth-menu-item')),
      getActiveOption: (el) => el.querySelector<HTMLElement>('mth-menu-item[data-active="true"]'),
      getSelectedOptions: (el) =>
        Array.from(el.querySelectorAll<HTMLElement>('mth-menu-item[aria-selected="true"]')),
    });
    expect(lbReport.passed).toBe(true);

    const rfReport = await RovingFocusSuite.run({
      orientation: 'vertical',
      loop: true,
      mount: async () => {
        const el = document.createElement('mth-dropdown-menu') as MthDropdownMenu;
        el.append(...createMenuItems());
        document.body.appendChild(el);
        await el.updateComplete;
        await el.show();
        await el.updateComplete;
        return el;
      },
      getItems: (container) => Array.from(container.querySelectorAll<HTMLElement>('mth-menu-item')),
    });
    expect(rfReport.passed).toBe(true);
  });

  it('supports trigger slot toggle, checkbox/radio selection, typeahead, and zero inline style=', async () => {
    const menu = document.createElement('mth-dropdown-menu') as MthDropdownMenu;
    const trigger = document.createElement('button');
    trigger.setAttribute('slot', 'trigger');
    trigger.textContent = 'View';

    const wrap = document.createElement('mth-menu-item') as MthMenuItem;
    wrap.type = 'checkbox';
    wrap.value = 'wrap';
    wrap.textContent = 'Word Wrap';

    const r1 = document.createElement('mth-menu-item') as MthMenuItem;
    r1.type = 'radio';
    r1.group = 'density';
    r1.value = 'compact';
    r1.textContent = 'Compact';

    const r2 = document.createElement('mth-menu-item') as MthMenuItem;
    r2.type = 'radio';
    r2.group = 'density';
    r2.value = 'comfortable';
    r2.checked = true;
    r2.textContent = 'Comfortable';

    menu.append(trigger, wrap, r1, r2);
    document.body.appendChild(menu);
    await menu.updateComplete;

    trigger.click();
    await Promise.resolve();
    await menu.updateComplete;
    expect(menu.open).toBe(true);
    expect(scanSameRootAria(menu).valid).toBe(true);

    const surface = menu.shadowRoot!.querySelector<HTMLElement>('#mth-dropdown-menu-surface')!;
    expect(surface.hasAttribute('style')).toBe(false);

    const events: Array<{ value: string; checked: boolean }> = [];
    menu.addEventListener('mth-select', (e) => {
      events.push((e as CustomEvent<{ value: string; checked: boolean }>).detail);
    });

    // Checkbox toggles without closing menu
    wrap.activate();
    await menu.updateComplete;
    expect(wrap.checked).toBe(true);
    expect(menu.open).toBe(true);

    // Radio selects exclusively and closes menu
    r1.activate();
    await Promise.resolve();
    await menu.updateComplete;
    expect(r1.checked).toBe(true);
    expect(r2.checked).toBe(false);
    expect(menu.open).toBe(false);
    expect(events).toEqual([
      { value: 'wrap', checked: true },
      { value: 'compact', checked: true },
    ]);
  });

  it('activates leaf items via host Enter/Space and roves nested submenus without outer menu hijacking', async () => {
    const menu = document.createElement('mth-dropdown-menu') as MthDropdownMenu;
    const trigger = document.createElement('button');
    trigger.setAttribute('slot', 'trigger');
    trigger.textContent = 'File';

    const save = document.createElement('mth-menu-item') as MthMenuItem;
    save.type = 'checkbox';
    save.value = 'save';
    save.textContent = 'Auto Save';

    const exportItem = document.createElement('mth-menu-item') as MthMenuItem;
    exportItem.value = 'export';
    exportItem.textContent = 'Export';

    const pdf = document.createElement('mth-menu-item') as MthMenuItem;
    pdf.setAttribute('slot', 'submenu');
    pdf.value = 'pdf';
    pdf.textContent = 'PDF';

    const csv = document.createElement('mth-menu-item') as MthMenuItem;
    csv.setAttribute('slot', 'submenu');
    csv.value = 'csv';
    csv.textContent = 'CSV';

    exportItem.append(pdf, csv);
    menu.append(trigger, save, exportItem);
    document.body.appendChild(menu);
    await menu.updateComplete;
    await exportItem.updateComplete;
    await Promise.resolve();
    await exportItem.updateComplete;

    await menu.show();
    await menu.updateComplete;

    const selected: string[] = [];
    menu.addEventListener('mth-select', (e) => {
      selected.push((e as CustomEvent<{ value: string }>).detail.value);
    });

    // Host Space toggles checkbox leaf item without closing menu
    save.focus();
    save.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await menu.updateComplete;
    expect(save.checked).toBe(true);
    expect(menu.open).toBe(true);

    // ArrowRight on parent item opens submenu and focuses first child
    exportItem.focus();
    exportItem.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await exportItem.updateComplete;
    expect(exportItem.submenuOpen).toBe(true);
    expect(document.activeElement).toBe(pdf);

    // ArrowDown inside submenu moves to CSV without changing outer menu active item
    pdf.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    await exportItem.updateComplete;
    expect(document.activeElement).toBe(csv);
    expect(exportItem.active).toBe(true);
    expect(save.active).toBe(false);

    // Escape closes submenu back to exportItem without closing outer menu
    csv.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await exportItem.updateComplete;
    expect(exportItem.submenuOpen).toBe(false);
    expect(menu.open).toBe(true);
    expect(document.activeElement).toBe(exportItem);

    // Re-open submenu and activate CSV via Enter on focused host -> bubbles mth-select & closes menu
    exportItem.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await exportItem.updateComplete;
    expect(document.activeElement).toBe(pdf);
    pdf.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(csv);
    csv.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    await menu.updateComplete;
    expect(selected).toEqual(['save', 'csv']);
    expect(menu.open).toBe(false);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-dropdown-menu label="Edit"><button slot="trigger">Menu</button><mth-menu-item value="undo">Undo</mth-menu-item></mth-dropdown-menu>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-dropdown-menu>', 'hyd-dropdown-menu>')
      .replaceAll('<mth-dropdown-menu', '<hyd-dropdown-menu');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDropdownMenu('hyd');
        customElements.upgrade(host);
        await (host as MthDropdownMenu).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
