import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import {
  messageComposerSpec,
  MthMessageComposer,
  registerMthMessageComposer,
} from './index.js';

describe('<mth-message-composer>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(messageComposerSpec);
    expect(compiled.tests).toContain('<mth-message-composer>');

    let mounted: MthMessageComposer | null = null;
    const report = await runBehaviorSpecAssertions(messageComposerSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-message-composer') as MthMessageComposer;
          mounted.label = 'Chat message';
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthMessageComposer).value = val;
          await (el as MthMessageComposer).updateComplete;
        },
        getValue: (el) => (el as MthMessageComposer).value,
        nextValue: 'Hello team',
        getFormDataValue: (fd, name) => {
          const nativeVal = fd.get(name);
          if (nativeVal !== null) return nativeVal;
          const hasNativeFace =
            typeof ElementInternals !== 'undefined' &&
            typeof ElementInternals.prototype.setFormValue === 'function';
          if (hasNativeFace || !mounted) return null;
          return mounted.isEffectivelyDisabled ? null : mounted.value;
        },
        getInternalDisabled: (el) =>
          Boolean((el as MthMessageComposer).shadowRoot!.querySelector('textarea')?.disabled),
        isRequiredInvalid: (el) => !(el as MthMessageComposer).checkValidity(),
      },
    });
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-message-composer') as MthMessageComposer;
    el.label = 'Reply';
    document.body.append(el);
    await el.updateComplete;
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('guards IME composition on Enter and emits mth-submit / mth-stop', async () => {
    const el = document.createElement('mth-message-composer') as MthMessageComposer;
    el.value = 'Ready';
    document.body.append(el);
    await el.updateComplete;

    const submits: string[] = [];
    el.addEventListener('mth-submit', (e) => {
      submits.push((e as CustomEvent<{ value: string }>).detail.value);
    });

    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>('[part="textarea"]')!;
    textarea.dispatchEvent(new Event('compositionstart', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(submits).toEqual([]);

    textarea.dispatchEvent(new Event('compositionend', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(submits).toEqual(['Ready']);

    el.streaming = true;
    await el.updateComplete;
    let stopped = 0;
    el.addEventListener('mth-stop', () => {
      stopped++;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="stop-button"]')!.click();
    expect(stopped).toBe(1);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthMessageComposer();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-message-composer label="Message"></mth-message-composer>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-message-composer>', 'hyd-message-composer>')
      .replaceAll('<mth-message-composer', '<hyd-message-composer');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMessageComposer('hyd');
        customElements.upgrade(host);
        await (host as MthMessageComposer).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });

  it('preserves dirty state on reparent and surfaces validation error immediately on empty submit', async () => {
    const el = document.createElement('mth-message-composer') as MthMessageComposer;
    el.defaultValue = 'initial';
    el.value = 'initial';
    el.required = true;
    document.body.append(el);
    await el.updateComplete;

    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>('[part="textarea"]')!;
    textarea.value = 'edited draft';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(el.dirty).toBe(true);

    // Reparenting must not overwrite defaultValue or clear dirty
    el.remove();
    document.body.append(el);
    await el.updateComplete;
    expect(el.dirty).toBe(true);
    expect(el.defaultValue).toBe('initial');

    textarea.value = '';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(el.submitMessage()).toBe(false);
    await el.updateComplete;
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });
});
