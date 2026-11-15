import { describe, expect, it } from 'vitest';
import { createApp, createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  METHANE_VUE_COMPILER_OPTIONS,
  MthCombobox,
  MthDialog,
  MthField,
  MthInput,
  MthSkipLink,
  isMethaneVueTag,
} from './index.js';

describe('@methane-ui/vue', () => {
  it('provides Volar GlobalComponents and isCustomElement preset', () => {
    expect(METHANE_VUE_COMPILER_OPTIONS.isCustomElement('mth-combobox')).toBe(true);
    expect(isMethaneVueTag('mth-input')).toBe(true);
    expect(isMethaneVueTag('mth-skip-link')).toBe(true);
    expect(isMethaneVueTag('span')).toBe(false);
  });

  it('renders custom elements in Vue SSR via renderToString', async () => {
    const app = createSSRApp({
      render: () =>
        h(MthField, { label: 'Email' }, () =>
          h(MthInput, {
            modelValue: 'hello',
            type: 'email',
          }),
        ),
    });

    const html = await renderToString(app);
    expect(html).toContain('<mth-field');
    expect(html).toContain('<mth-input');
    expect(html).toContain('value="hello"');
  });

  it('mounts real Vue 3 components and syncs v-model on Methane custom events', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const modelValues: unknown[] = [];
    const valueUpdates: unknown[] = [];
    const inputEvents: Event[] = [];
    const comboboxUpdates: unknown[] = [];
    const openUpdates: unknown[] = [];

    const app = createApp({
      render: () =>
        h('div', [
          h(MthInput, {
            modelValue: 'initial',
            'onUpdate:modelValue': (val: unknown) => modelValues.push(val),
            'onUpdate:value': (val: unknown) => valueUpdates.push(val),
            onMthInput: (ev: CustomEvent<{ value: string }>) => inputEvents.push(ev),
          }),
          h(MthCombobox, {
            modelValue: 'apple',
            'onUpdate:modelValue': (val: unknown) => comboboxUpdates.push(val),
            'onUpdate:value': (val: unknown) => comboboxUpdates.push(val),
          }),
          h(MthDialog, {
            modelValue: false,
            'onUpdate:modelValue': (val: unknown) => openUpdates.push(val),
            'onUpdate:open': (val: unknown) => openUpdates.push(val),
          }),
          h(MthSkipLink, { href: '#main' }),
        ]),
    });

    app.config.compilerOptions = { ...METHANE_VUE_COMPILER_OPTIONS };
    app.mount(container);

    const inputEl = container.querySelector('mth-input') as (HTMLElement & { value?: string }) | null;
    expect(inputEl).not.toBeNull();
    expect(inputEl?.value ?? inputEl?.getAttribute('value')).toBe('initial');

    inputEl?.dispatchEvent(new CustomEvent('mth-input', { detail: { value: 'typed' } }));
    expect(modelValues).toEqual(['typed']);
    expect(valueUpdates).toEqual(['typed']);
    expect(inputEvents).toHaveLength(1);

    const comboboxEl = container.querySelector('mth-combobox');
    expect(comboboxEl).not.toBeNull();
    comboboxEl?.dispatchEvent(new CustomEvent('mth-change', { detail: { value: 'banana' } }));
    expect(comboboxUpdates).toEqual(['banana', 'banana']);

    const dialogEl = container.querySelector('mth-dialog');
    expect(dialogEl).not.toBeNull();
    dialogEl?.dispatchEvent(new CustomEvent('mth-open'));
    dialogEl?.dispatchEvent(new CustomEvent('mth-close'));
    expect(openUpdates).toEqual([true, true, false, false]);

    app.unmount();
    container.remove();
  });
});
