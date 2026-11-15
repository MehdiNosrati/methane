import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthMenuItem, menuItemSpec, registerMthMenuItem } from './index.js';

describe('<mth-menu-item>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, supports normal/checkbox/radio types, shortcuts, and nested submenus', async () => {
    const compiled = compileSpec(menuItemSpec);
    expect(compiled.docs).toContain('`<mth-menu-item>`');

    const report = await runBehaviorSpecAssertions(menuItemSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const checkbox = document.createElement('mth-menu-item') as MthMenuItem;
    checkbox.type = 'checkbox';
    checkbox.value = 'autosave';
    checkbox.shortcut = '⌘S';
    checkbox.textContent = 'Auto Save';
    document.body.appendChild(checkbox);
    await checkbox.updateComplete;

    expect(scanSameRootAria(checkbox).valid).toBe(true);
    expect(checkbox.shadowRoot!.querySelector('[part="shortcut"]')?.textContent).toBe('⌘S');

    const selected: Array<{ value: string; checked: boolean }> = [];
    checkbox.addEventListener('mth-select', (e) => {
      selected.push((e as CustomEvent<{ value: string; checked: boolean }>).detail);
    });

    checkbox.activate();
    await checkbox.updateComplete;
    expect(checkbox.checked).toBe(true);
    expect(selected).toEqual([{ value: 'autosave', checked: true }]);
    expect(checkbox.shadowRoot!.querySelector('[part="check"]')?.textContent).toBe('✓');

    // Nested submenu open/close via ArrowRight / ArrowLeft
    const parent = document.createElement('mth-menu-item') as MthMenuItem;
    parent.value = 'share';
    parent.textContent = 'Share';
    const child = document.createElement('mth-menu-item') as MthMenuItem;
    child.setAttribute('slot', 'submenu');
    child.value = 'email';
    child.textContent = 'Email';
    parent.appendChild(child);
    document.body.appendChild(parent);
    await parent.updateComplete;
    await Promise.resolve();
    await parent.updateComplete;

    const base = parent.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!;
    base.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await parent.updateComplete;
    expect(parent.submenuOpen).toBe(true);

    base.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await parent.updateComplete;
    expect(parent.submenuOpen).toBe(false);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-menu-item value="edit" shortcut="⌘E">Edit</mth-menu-item>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-menu-item>', 'hyd-menu-item>')
      .replaceAll('<mth-menu-item', '<hyd-menu-item');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMenuItem('hyd');
        customElements.upgrade(host);
        await (host as MthMenuItem).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
