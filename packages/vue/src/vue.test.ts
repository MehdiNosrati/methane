import { describe, expect, it } from 'vitest';
import { createApp, createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  METHANE_VUE_COMPILER_OPTIONS,
  MthCheckbox,
  MthDialog,
  MthInput,
  isMethaneVueTag,
} from './index.js';

describe('@methane/vue', () => {
  it('provides Volar GlobalComponents and isCustomElement preset', () => {
    expect(METHANE_VUE_COMPILER_OPTIONS.isCustomElement('mth-button')).toBe(true);
    expect(isMethaneVueTag('mth-input')).toBe(true);
    expect(isMethaneVueTag('span')).toBe(false);
  });

  it('renders custom elements in Vue SSR via renderToString', async () => {
    const app = createSSRApp({
      render: () =>
        h(MthInput, {
          modelValue: 'hello',
          variant: 'filled',
        }),
    });

    const html = await renderToString(app);
    expect(html).toContain('<mth-input');
    expect(html).toContain('variant="filled"');
    expect(html).toContain('value="hello"');
  });

  it('mounts real Vue 3 components and syncs v-model on Methane custom events', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const modelValues: unknown[] = [];
    const valueUpdates: unknown[] = [];
    const inputEvents: Event[] = [];
    const checkedUpdates: unknown[] = [];
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
          h(MthCheckbox, {
            modelValue: false,
            'onUpdate:modelValue': (val: unknown) => checkedUpdates.push(val),
            'onUpdate:checked': (val: unknown) => checkedUpdates.push(val),
          }),
          h(MthDialog, {
            modelValue: false,
            'onUpdate:modelValue': (val: unknown) => openUpdates.push(val),
            'onUpdate:open': (val: unknown) => openUpdates.push(val),
          }),
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

    const checkboxEl = container.querySelector('mth-checkbox');
    expect(checkboxEl).not.toBeNull();
    checkboxEl?.dispatchEvent(new CustomEvent('mth-change', { detail: { checked: true } }));
    expect(checkedUpdates).toEqual([true, true]);

    const dialogEl = container.querySelector('mth-dialog');
    expect(dialogEl).not.toBeNull();
    dialogEl?.dispatchEvent(new CustomEvent('mth-open'));
    dialogEl?.dispatchEvent(new CustomEvent('mth-close'));
    expect(openUpdates).toEqual([true, true, false, false]);

    app.unmount();
    container.remove();
  });
});
