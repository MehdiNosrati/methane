import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthTag, registerMthTag, tagSpec } from './index.js';

describe('<mth-tag>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes BehaviorSpec assertions + same-root ARIA', async () => {
    const compiled = compileSpec(tagSpec);
    expect(compiled.docs).toContain('`<mth-tag>`');

    const report = await runBehaviorSpecAssertions(tagSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const tag = document.createElement('mth-tag') as MthTag;
    tag.variant = 'accent';
    tag.interactive = true;
    tag.removable = true;
    tag.value = 'typescript';
    tag.textContent = 'TypeScript';
    document.body.appendChild(tag);
    await tag.updateComplete;

    const aria = scanSameRootAria(tag);
    expect(aria.issues).toEqual([]);
    expect(aria.valid).toBe(true);

    const trigger = tag.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!;
    expect(trigger.getAttribute('aria-pressed')).toBe('false');
    const removeBtn = tag.shadowRoot!.querySelector<HTMLButtonElement>('[part="remove"]')!;
    const removeLabel = removeBtn.getAttribute('aria-label') ?? '';
    expect(removeLabel).toContain('Remove');
    expect(removeLabel).toContain('TypeScript');
  });

  it('emits mth-click on interactive activation and cancelable mth-remove', async () => {
    const tag = document.createElement('mth-tag') as MthTag;
    tag.interactive = true;
    tag.removable = true;
    tag.value = 'v1';
    tag.label = 'Alpha';
    document.body.appendChild(tag);
    await tag.updateComplete;

    const clicks: Array<{ value: string; selected: boolean }> = [];
    tag.addEventListener('mth-click', (e) => {
      clicks.push((e as CustomEvent<{ value: string; selected: boolean }>).detail);
    });

    const trigger = tag.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!;
    trigger.click();
    await tag.updateComplete;
    expect(tag.selected).toBe(true);
    expect(clicks).toEqual([{ value: 'v1', selected: true }]);

    let removedValue = '';
    tag.addEventListener('mth-remove', (e) => {
      removedValue = (e as CustomEvent<{ value: string }>).detail.value;
      e.preventDefault();
    });

    const removeBtn = tag.shadowRoot!.querySelector<HTMLButtonElement>('[part="remove"]')!;
    removeBtn.click();
    expect(removedValue).toBe('v1');

    removedValue = '';
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(removedValue).toBe('v1');
  });

  it('respects disabled state and passes HydrationPuritySuite', async () => {
    const tag = document.createElement('mth-tag') as MthTag;
    tag.interactive = true;
    tag.removable = true;
    tag.disabled = true;
    tag.label = 'Locked';
    document.body.appendChild(tag);
    await tag.updateComplete;

    let fired = false;
    tag.addEventListener('mth-click', () => {
      fired = true;
    });
    tag.addEventListener('mth-remove', () => {
      fired = true;
    });
    tag.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!.click();
    tag.shadowRoot!.querySelector<HTMLButtonElement>('[part="remove"]')!.click();
    expect(fired).toBe(false);

    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tag variant="success" pill removable label="Ready"></mth-tag>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-tag>', 'hyd-tag>').replaceAll('<mth-tag', '<hyd-tag');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTag('hyd');
        customElements.upgrade(host);
        await (host as MthTag).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
