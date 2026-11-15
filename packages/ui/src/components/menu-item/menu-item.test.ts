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

    // Host Enter and Space activate leaf/checkbox items directly
    checkbox.tabIndex = 0;
    checkbox.focus();
    checkbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await checkbox.updateComplete;
    expect(checkbox.checked).toBe(false);

    checkbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await checkbox.updateComplete;
    expect(checkbox.checked).toBe(true);
    expect(selected).toEqual([
      { value: 'autosave', checked: true },
      { value: 'autosave', checked: false },
      { value: 'autosave', checked: true },
    ]);

    // Nested submenu open/close and roving ArrowDown/ArrowUp/Home/End on host
    const parent = document.createElement('mth-menu-item') as MthMenuItem;
    parent.tabIndex = 0;
    parent.value = 'share';
    parent.textContent = 'Share';
    const child1 = document.createElement('mth-menu-item') as MthMenuItem;
    child1.setAttribute('slot', 'submenu');
    child1.value = 'email';
    child1.textContent = 'Email';
    const child2 = document.createElement('mth-menu-item') as MthMenuItem;
    child2.setAttribute('slot', 'submenu');
    child2.value = 'copy';
    child2.textContent = 'Copy Link';
    parent.append(child1, child2);
    document.body.appendChild(parent);
    await parent.updateComplete;
    await Promise.resolve();
    await parent.updateComplete;

    parent.focus();
    parent.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await parent.updateComplete;
    expect(parent.submenuOpen).toBe(true);
    expect(document.activeElement).toBe(child1);

    child1.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await parent.updateComplete;
    expect(document.activeElement).toBe(child2);

    child2.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await parent.updateComplete;
    expect(document.activeElement).toBe(child1);

    child1.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(child2);
    child2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(child1);

    const childSelected: string[] = [];
    child1.addEventListener('mth-select', (e) => {
      childSelected.push((e as CustomEvent<{ value: string }>).detail.value);
    });
    child1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(childSelected).toEqual(['email']);

    child1.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await parent.updateComplete;
    expect(parent.submenuOpen).toBe(false);
    expect(document.activeElement).toBe(parent);
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
