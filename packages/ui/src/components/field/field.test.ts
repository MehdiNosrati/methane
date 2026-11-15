import { ContextConsumer } from '@lit/context';
import { FIELD_CONTEXT, UIElement, html, type FieldContextValue } from '@methane-ui/core';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { scanSameRootAria } from '@methane-ui/test-conformance';
import { afterEach, describe, expect, it } from 'vitest';
import { MthField, fieldSpec } from './index.js';

class TestFieldProbe extends UIElement {
  latestFieldContext: FieldContextValue | undefined;

  private readonly consumer = new ContextConsumer(this, {
    context: FIELD_CONTEXT,
    subscribe: true,
    callback: (val) => {
      this.latestFieldContext = val;
      this.requestUpdate();
    },
  });

  override connectedCallback(): void {
    super.connectedCallback();
    void this.consumer;
  }

  override render() {
    return html`<span>${this.latestFieldContext?.label ?? ''}</span>`;
  }
}

if (!customElements.get('mth-test-field-probe')) {
  customElements.define('mth-test-field-probe', TestFieldProbe);
}

describe('<mth-field>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, spec compilation, and same-root ARIA scan (never bridges ARIA)', async () => {
    const compiled = compileSpec(fieldSpec);
    expect(compiled.docs).toContain('`<mth-field>`');
    expect(compiled.a11yChecklist.items.length).toBeGreaterThanOrEqual(3);

    const report = await runBehaviorSpecAssertions(fieldSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const field = document.createElement('mth-field') as MthField;
    field.label = 'Account Name';
    field.hint = 'Visible to teammates';
    field.required = true;
    document.body.appendChild(field);
    await field.updateComplete;

    expect(field.hasCustomState('required')).toBe(true);
    expect(field.hasCustomState('disabled')).toBe(false);
    expect(field.hasCustomState('invalid')).toBe(false);

    // Must not bridge aria-labelledby / aria-describedby / aria-errormessage across roots
    const shadow = field.shadowRoot!;
    expect(shadow.querySelector('[aria-labelledby], [aria-describedby], [aria-errormessage]')).toBeNull();
    expect(scanSameRootAria(field).valid).toBe(true);
  });

  it('provides FIELD_CONTEXT via Community Context Protocol including slotted text', async () => {
    const field = document.createElement('mth-field') as MthField;
    field.label = 'Initial Label';
    field.hint = 'Initial Hint';
    field.required = true;
    field.density = 'compact';

    const probe = document.createElement('mth-test-field-probe') as TestFieldProbe;
    field.appendChild(probe);
    document.body.appendChild(field);

    await field.updateComplete;
    await probe.updateComplete;

    expect(probe.latestFieldContext).toMatchObject({
      version: 1,
      label: 'Initial Label',
      hint: 'Initial Hint',
      error: '',
      required: true,
      disabled: false,
    });

    const slottedError = document.createElement('span');
    slottedError.slot = 'error';
    slottedError.textContent = 'Custom slotted error';
    field.appendChild(slottedError);
    field.disabled = true;

    await new Promise((r) => setTimeout(r, 0));
    await field.updateComplete;
    await probe.updateComplete;

    expect(field.hasCustomState('invalid')).toBe(true);
    expect(field.hasCustomState('disabled')).toBe(true);
    expect(probe.latestFieldContext).toMatchObject({
      error: 'Custom slotted error',
      disabled: true,
    });
  });
});
