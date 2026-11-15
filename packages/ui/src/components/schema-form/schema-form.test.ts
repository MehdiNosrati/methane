import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/field';
import '@methane-ui/ui/input';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthSchemaForm, registerMthSchemaForm, schemaFormSpec } from './index.js';

describe('<mth-schema-form>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles BehaviorSpec and passes same-root ARIA', async () => {
    const compiled = compileSpec(schemaFormSpec);
    expect(compiled.tests).toContain('<mth-schema-form>');

    const el = document.createElement('mth-schema-form') as MthSchemaForm;
    document.body.appendChild(el);
    await el.updateComplete;

    const specReport = await runBehaviorSpecAssertions(schemaFormSpec);
    expect(specReport.passed).toBe(true);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('renders fields from JSON Schema subset, validates constraints, and emits mth-submit', async () => {
    const el = document.createElement('mth-schema-form') as MthSchemaForm;
    el.showReset = true;
    el.schema = {
      title: 'Invite User',
      description: 'Send a workspace invitation.',
      required: ['email', 'age'],
      properties: {
        email: { type: 'string', title: 'Work Email', format: 'email' },
        age: { type: 'integer', title: 'Age', minimum: 18 },
        role: { type: 'string', title: 'Role', enum: ['member', 'admin'], default: 'member' },
        agree: { type: 'boolean', title: 'Terms', description: 'Accept terms' },
      },
    };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.values.role).toBe('member');

    const invalidEvents: Array<Record<string, string>> = [];
    const submittedPayloads: Array<Record<string, unknown>> = [];
    el.addEventListener('mth-invalid', (ev) =>
      invalidEvents.push((ev as CustomEvent<{ errors: Record<string, string> }>).detail.errors),
    );
    el.addEventListener('mth-submit', (ev) =>
      submittedPayloads.push((ev as CustomEvent<{ values: Record<string, unknown> }>).detail.values),
    );

    // Fails when required fields empty.
    expect(el.submit()).toBe(false);
    await el.updateComplete;
    expect(invalidEvents.length).toBe(1);
    expect(invalidEvents[0]?.email).toBeDefined();
    expect(invalidEvents[0]?.age).toBeDefined();

    // Update email via generated public <mth-input>.
    const emailInput = el.shadowRoot!.querySelector('mth-input[name="email"]')!;
    emailInput.dispatchEvent(new CustomEvent('mth-input', { detail: { value: 'ada@methane.dev' }, bubbles: true }));
    const ageInput = el.shadowRoot!.querySelector('mth-input[name="age"]')!;
    ageInput.dispatchEvent(new CustomEvent('mth-input', { detail: { value: '25' }, bubbles: true }));
    await el.updateComplete;

    expect(el.submit()).toBe(true);
    expect(submittedPayloads.length).toBe(1);
    expect(submittedPayloads[0]).toEqual({
      email: 'ada@methane.dev',
      age: 25,
      role: 'member',
    });

    el.reset();
    await el.updateComplete;
    expect(el.values.email).toBe('');
  });

  it('supports updating schema-json dynamically and prevents checkbox/select mutations when readonly', async () => {
    const el = document.createElement('mth-schema-form') as MthSchemaForm;
    el.setAttribute(
      'schema-json',
      JSON.stringify({
        properties: {
          agree: { type: 'boolean', title: 'Agree', default: false },
          plan: { type: 'string', title: 'Plan', enum: ['free', 'pro'], default: 'free' },
        },
      }),
    );
    el.readonly = true;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.values.agree).toBe(false);
    expect(el.values.plan).toBe('free');

    const checkbox = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const select = el.shadowRoot!.querySelector<HTMLSelectElement>('select')!;
    expect(checkbox.disabled).toBe(true);
    expect(select.disabled).toBe(true);
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    select.value = 'pro';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;
    expect(el.values.agree).toBe(false);
    expect(el.values.plan).toBe('free');

    el.setAttribute(
      'schema-json',
      JSON.stringify({
        properties: {
          region: { type: 'string', title: 'Region', default: 'eu-west' },
        },
      }),
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('mth-input[name="region"]')).not.toBeNull();
    expect(el.values.region).toBe('eu-west');
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const schemaJson = JSON.stringify({
      title: 'Profile',
      properties: { username: { type: 'string', title: 'Username' } },
    });
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-schema-form schema-json=${schemaJson}></mth-schema-form>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-schema-form>', 'hyd-schema-form>')
      .replaceAll('<mth-schema-form', '<hyd-schema-form');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSchemaForm('hyd');
        customElements.upgrade(host);
        await (host as MthSchemaForm).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
