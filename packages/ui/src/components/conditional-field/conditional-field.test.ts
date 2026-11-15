import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/input';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import {
  MthConditionalField,
  conditionalFieldSpec,
  registerMthConditionalField,
} from './index.js';

interface TestInputElement extends HTMLElement {
  readonly effectivelyDisabled: boolean;
  readonly updateComplete: Promise<boolean>;
  name: string;
  label: string;
}

describe('<mth-conditional-field>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles BehaviorSpec and passes same-root ARIA', async () => {
    const compiled = compileSpec(conditionalFieldSpec);
    expect(compiled.tests).toContain('<mth-conditional-field>');

    const el = document.createElement('mth-conditional-field') as MthConditionalField;
    el.when = true;
    document.body.appendChild(el);
    await el.updateComplete;

    const specReport = await runBehaviorSpecAssertions(conditionalFieldSpec);
    expect(specReport.passed).toBe(true);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('reactively toggles visibility and propagates FORM_CONTEXT.disabled to child controls', async () => {
    const form = document.createElement('form');

    const planSelect = document.createElement('select');
    planSelect.name = 'plan';
    const optFree = document.createElement('option');
    optFree.value = 'free';
    const optPro = document.createElement('option');
    optPro.value = 'enterprise';
    planSelect.append(optFree, optPro);
    planSelect.value = 'free';

    const cond = document.createElement('mth-conditional-field') as MthConditionalField;
    cond.field = 'plan';
    cond.equals = 'enterprise';
    cond.mode = 'hide';

    const childInput = document.createElement('mth-input') as TestInputElement;
    childInput.name = 'orgId';
    childInput.label = 'Organization ID';
    cond.appendChild(childInput);

    form.append(planSelect, cond);
    document.body.appendChild(form);
    await cond.updateComplete;
    await childInput.updateComplete;

    expect(cond.matched).toBe(false);
    expect(cond.shadowRoot!.querySelector('[part="base"]')?.hasAttribute('hidden')).toBe(true);
    expect(childInput.effectivelyDisabled).toBe(true);

    const changes: boolean[] = [];
    cond.addEventListener('mth-condition-change', (ev) =>
      changes.push((ev as CustomEvent<{ matched: boolean }>).detail.matched),
    );

    planSelect.value = 'enterprise';
    planSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await cond.updateComplete;
    await childInput.updateComplete;

    expect(cond.matched).toBe(true);
    expect(cond.shadowRoot!.querySelector('[part="base"]')?.hasAttribute('hidden')).toBe(false);
    expect(childInput.effectivelyDisabled).toBe(false);
    expect(changes).toEqual([true]);

    cond.mode = 'disable';
    planSelect.value = 'free';
    planSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await cond.updateComplete;
    await childInput.updateComplete;
    expect(cond.shadowRoot!.querySelector('[part="base"]')?.hasAttribute('hidden')).toBe(false);
    expect(childInput.effectivelyDisabled).toBe(true);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-conditional-field field="tier" equals="pro"></mth-conditional-field>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-conditional-field>', 'hyd-conditional-field>')
      .replaceAll('<mth-conditional-field', '<hyd-conditional-field');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthConditionalField('hyd');
        customElements.upgrade(host);
        await (host as MthConditionalField).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
