import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import '@methane/ui/input';
import '@methane/ui/checkbox';
import { formSpec } from './form.spec.js';
import { MthForm, registerMthForm } from './index.js';

describe('<mth-form>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, validation failure (mth-invalid), and valid submission (mth-submit)', async () => {
    const compiled = compileSpec(formSpec);
    expect(compiled.docs).toContain('`<mth-form>`');

    const report = await runBehaviorSpecAssertions(formSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const form = document.createElement('mth-form') as MthForm;
    const email = document.createElement('mth-input');
    email.id = 'email-field';
    email.setAttribute('name', 'email');
    email.setAttribute('label', 'Email');
    email.setAttribute('required', '');

    const agree = document.createElement('mth-checkbox');
    agree.setAttribute('name', 'agree');
    agree.setAttribute('value', 'yes');

    form.append(email, agree);
    document.body.appendChild(form);

    await form.updateComplete;
    await (email as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    await (agree as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    const onInvalid = vi.fn();
    const onSubmit = vi.fn();
    form.addEventListener('mth-invalid', onInvalid);
    form.addEventListener('mth-submit', onSubmit);

    expect(form.requestSubmit()).toBe(false);
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();

    const invalidDetail = onInvalid.mock.calls[0]?.[0]?.detail as {
      errors: Array<{ id: string; name: string; message: string }>;
    };
    expect(invalidDetail.errors.some((e) => e.name === 'email')).toBe(true);

    (email as unknown as { value: string }).value = 'ada@example.com';
    (agree as unknown as { checked: boolean }).checked = true;
    await (email as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    await (agree as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    expect(form.requestSubmit()).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitDetail = onSubmit.mock.calls[0]?.[0]?.detail as {
      values: Record<string, string>;
    };
    expect(submitDetail.values).toEqual({
      email: 'ada@example.com',
      agree: 'yes',
    });

    const aria = scanSameRootAria(form.shadowRoot!);
    expect(aria.valid, JSON.stringify(aria.issues)).toBe(true);
  });

  it('supports novalidate, submitting/disabled propagation via FormContext, and reset()', async () => {
    const form = document.createElement('mth-form') as MthForm;
    form.novalidate = true;

    const input = document.createElement('mth-input');
    input.setAttribute('name', 'username');
    input.setAttribute('value', 'initial');
    input.setAttribute('required', '');
    form.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    form.appendChild(submitBtn);

    document.body.appendChild(form);
    await form.updateComplete;
    await (input as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    (input as unknown as { value: string }).value = 'edited';
    await (input as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    const onSubmit = vi.fn();
    form.addEventListener('mth-submit', onSubmit);
    submitBtn.click();
    expect(onSubmit).toHaveBeenCalledTimes(1);

    form.submitting = true;
    await form.updateComplete;
    await Promise.resolve();
    await (input as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    expect(input.shadowRoot!.querySelector('input')?.disabled).toBe(true);
    expect(form.requestSubmit()).toBe(false);

    form.submitting = false;
    await form.updateComplete;
    form.reset();
    await (input as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    expect((input as unknown as { value: string }).value).toBe('initial');
  });

  it('submits on Enter in single-line inputs (ignoring textarea) and preserves delegation across reconnect', async () => {
    const form = document.createElement('mth-form') as MthForm;
    const input = document.createElement('mth-input');
    input.setAttribute('name', 'city');
    input.setAttribute('value', 'Seattle');
    const textarea = document.createElement('textarea');
    textarea.name = 'notes';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    form.append(input, textarea, submitBtn);
    document.body.appendChild(form);

    await form.updateComplete;
    await (input as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    const onSubmit = vi.fn();
    form.addEventListener('mth-submit', onSubmit);

    // Textarea Enter must not submit
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    expect(onSubmit).not.toHaveBeenCalled();

    // Single-line mth-input Enter must submit
    const innerInput = input.shadowRoot!.querySelector('input')!;
    innerInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Reconnect lifecycle preserves delegated click & Enter listeners
    form.remove();
    const wrapper = document.createElement('div');
    wrapper.appendChild(form);
    document.body.appendChild(wrapper);
    await form.updateComplete;

    submitBtn.click();
    expect(onSubmit).toHaveBeenCalledTimes(2);
    innerInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    expect(onSubmit).toHaveBeenCalledTimes(3);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-form novalidate></mth-form>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-form>', 'hyd-form>')
      .replaceAll('<mth-form', '<hyd-form');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthForm('hyd');
        customElements.upgrade(host);
        await (host as MthForm).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
