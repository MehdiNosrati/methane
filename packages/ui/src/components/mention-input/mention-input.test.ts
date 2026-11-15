import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import {
  mentionInputSpec,
  MthMentionInput,
  registerMthMentionInput,
  type MentionChangeDetail,
  type MentionOption,
  type MentionSelectDetail,
} from './index.js';

const SAMPLE_MENTIONS: ReadonlyArray<MentionOption> = [
  { value: 'ada', label: 'Ada Lovelace' },
  { value: 'grace', label: 'Grace Hopper' },
  { value: 'alan', label: 'Alan Turing', disabled: true },
];

describe('<mth-mention-input>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, OverlaySuite, ListboxSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(mentionInputSpec);
    expect(compiled.tests).toContain('<mth-mention-input>');

    let mounted: MthMentionInput | null = null;
    const specReport = await runBehaviorSpecAssertions(mentionInputSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-mention-input') as MthMentionInput;
          mounted.label = 'Comment';
          mounted.options = SAMPLE_MENTIONS;
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthMentionInput).value = val;
          await (el as MthMentionInput).updateComplete;
        },
        getValue: (el) => (el as MthMentionInput).value,
        nextValue: 'Hello @ada',
        getFormDataValue: (formData, name) => {
          const nativeVal = formData.get(name);
          if (nativeVal !== null) return nativeVal;
          const hasNativeFace =
            typeof ElementInternals !== 'undefined' &&
            typeof ElementInternals.prototype.setFormValue === 'function';
          if (hasNativeFace || !mounted) return null;
          return mounted.isEffectivelyDisabled ? null : mounted.value;
        },
        getInternalDisabled: (el) =>
          Boolean((el as MthMentionInput).shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')?.disabled),
        isRequiredInvalid: (el) => !(el as MthMentionInput).checkValidity(),
      },
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'External';
          const el = document.createElement('mth-mention-input') as MthMentionInput;
          el.label = 'Mention';
          el.options = SAMPLE_MENTIONS;
          return { overlay: el, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthMentionInput).show();
        },
        close: async (overlay) => {
          await (overlay as MthMentionInput).hide();
        },
        isOpen: (overlay) => (overlay as MthMentionInput).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: true,
      },
      listbox: {
        mount: async () => {
          const el = document.createElement('mth-mention-input') as MthMentionInput;
          el.label = 'Mention';
          el.options = SAMPLE_MENTIONS;
          document.body.appendChild(el);
          await el.updateComplete;
          await el.show();
          await el.updateComplete;
          return el;
        },
        getListboxRoot: (el) => (el as MthMentionInput).shadowRoot!,
        getOptions: (el) =>
          Array.from((el as MthMentionInput).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
        getActiveOption: (el) => {
          const m = el as MthMentionInput;
          const id = m.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-activedescendant');
          return id ? m.shadowRoot!.getElementById(id) : null;
        },
        getSelectedOptions: (el) =>
          Array.from(
            (el as MthMentionInput).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
          ),
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    let standaloneFormEl: MthMentionInput | null = null;
    const formReport = await FormControlSuite.run({
      mount: () => {
        standaloneFormEl = document.createElement('mth-mention-input') as MthMentionInput;
        standaloneFormEl.label = 'Note';
        standaloneFormEl.options = SAMPLE_MENTIONS;
        return standaloneFormEl;
      },
      setValue: async (el, val) => {
        (el as MthMentionInput).value = val;
        await (el as MthMentionInput).updateComplete;
      },
      getValue: (el) => (el as MthMentionInput).value,
      nextValue: 'Ping @grace',
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !standaloneFormEl) return null;
        return standaloneFormEl.isEffectivelyDisabled ? null : standaloneFormEl.value;
      },
      getInternalDisabled: (el) =>
        Boolean((el as MthMentionInput).shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')?.disabled),
      isRequiredInvalid: (el) => !(el as MthMentionInput).checkValidity(),
    });
    expect(formReport.passed).toBe(true);

    const overlayReport = await OverlaySuite.run({
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Trigger';
        const el = document.createElement('mth-mention-input') as MthMentionInput;
        el.label = 'Mention';
        el.options = SAMPLE_MENTIONS;
        return { overlay: el, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthMentionInput).show();
      },
      close: async (overlay) => {
        await (overlay as MthMentionInput).hide();
      },
      isOpen: (overlay) => (overlay as MthMentionInput).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: true,
    });
    expect(overlayReport.passed).toBe(true);

    const listboxReport = await ListboxSuite.run({
      mount: async () => {
        const el = document.createElement('mth-mention-input') as MthMentionInput;
        el.label = 'Mention';
        el.options = SAMPLE_MENTIONS;
        document.body.appendChild(el);
        await el.updateComplete;
        await el.show();
        await el.updateComplete;
        return el;
      },
      getListboxRoot: (el) => (el as MthMentionInput).shadowRoot!,
      getOptions: (el) =>
        Array.from((el as MthMentionInput).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')),
      getActiveOption: (el) => {
        const m = el as MthMentionInput;
        const id = m.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-activedescendant');
        return id ? m.shadowRoot!.getElementById(id) : null;
      },
      getSelectedOptions: (el) =>
        Array.from(
          (el as MthMentionInput).shadowRoot!.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'),
        ),
    });
    expect(listboxReport.passed).toBe(true);

    const ariaEl = document.createElement('mth-mention-input') as MthMentionInput;
    ariaEl.label = 'Reply';
    ariaEl.hint = 'Use @ to tag teammates';
    ariaEl.options = SAMPLE_MENTIONS;
    document.body.append(ariaEl);
    await ariaEl.updateComplete;
    await ariaEl.show();
    await ariaEl.updateComplete;
    expect(scanSameRootAria(ariaEl.shadowRoot!).issues).toEqual([]);
  });

  it('opens on trigger input, filters candidates, and inserts mention token cleanly', async () => {
    const el = document.createElement('mth-mention-input') as MthMentionInput;
    el.label = 'Message';
    el.options = SAMPLE_MENTIONS;
    document.body.append(el);
    await el.updateComplete;

    const changes: MentionChangeDetail[] = [];
    const selects: MentionSelectDetail[] = [];
    el.addEventListener('mth-change', (e) => {
      changes.push((e as CustomEvent<MentionChangeDetail>).detail);
    });
    el.addEventListener('mth-mention-select', (e) => {
      selects.push((e as CustomEvent<MentionSelectDetail>).detail);
    });

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    input.value = 'Hey @gr';
    input.setSelectionRange(7, 7);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    expect(el.open).toBe(true);
    const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
    expect(options.length).toBe(1);
    expect(options[0]!.getAttribute('data-value')).toBe('grace');

    options[0]!.click();
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    expect(el.open).toBe(false);
    expect(el.value).toBe('Hey @grace ');
    expect(el.mentions).toEqual(['grace']);
    expect(selects).toHaveLength(1);
    expect(selects[0]!.option.value).toBe('grace');
    expect(changes.at(-1)!.mentions).toEqual(['grace']);
  });

  it('supports multiline textarea and keyboard selection', async () => {
    const el = document.createElement('mth-mention-input') as MthMentionInput;
    el.label = 'Bio';
    el.multiline = true;
    el.options = SAMPLE_MENTIONS;
    document.body.append(el);
    await el.updateComplete;

    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>('textarea[part="input"]')!;
    expect(textarea).toBeTruthy();

    textarea.value = 'Review with @';
    textarea.setSelectionRange(13, 13);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    expect(el.open).toBe(true);

    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    expect(el.value).toBe('Review with @ada ');
    expect(el.mentions).toEqual(['ada']);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthMentionInput();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-mention-input name="msg" label="Message" placeholder="Say hello"></mth-mention-input>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-mention-input>', 'hyd-mention-input>')
      .replaceAll('<mth-mention-input', '<hyd-mention-input');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMentionInput('hyd');
        customElements.upgrade(host);
        await (host as MthMentionInput).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
