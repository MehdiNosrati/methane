import { ContextProvider } from '@lit/context';
import {
  FIELD_CONTEXT,
  FORM_CONTEXT,
  UIElement,
  html,
  property,
  registerLocaleMessages,
  type FieldContextValue,
  type FormContextValue,
} from '@methane-ui/core';
import { DataConsumerSuite, FormControlSuite } from '@methane-ui/test-conformance';
import { describe, expect, it, vi } from 'vitest';
import {
  DataController,
  FormControlController,
  InputController,
  MaskAndFormatEngine,
  SelectionController,
  SlotCollectionController,
  createArrayDataSource,
  type DataSource,
} from './index.js';

class TestFormFieldElement extends UIElement {
  static formAssociated = true;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  value = '';

  readonly formControl = new FormControlController(this, {
    internals: this.internals,
    defaultValue: '',
    onValueSync: (val) => {
      this.value = val;
    },
    onSetCustomState: (name, active) => {
      this.setCustomState(name, active);
    },
  });

  override onFormDisabled(disabled: boolean): void {
    this.formControl.handleFormDisabled(disabled);
  }

  override onFormReset(): void {
    this.formControl.handleFormReset();
  }

  override onFormStateRestore(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formControl.handleFormStateRestore(state, mode);
  }

  setInputValue(next: string): void {
    this.value = next;
    this.formControl.setValue(next);
  }

  override willUpdate(): void {
    this.formControl.hostDisabled = this.disabled;
    this.formControl.required = this.required;
  }

  override render() {
    return html`<slot></slot
      ><input
        .value=${this.value}
        ?disabled=${this.formControl.disabled}
        ?required=${this.formControl.required}
      />`;
  }
}

if (!customElements.get('mth-test-form-field')) {
  customElements.define('mth-test-form-field', TestFormFieldElement);
}

class TestSlotListElement extends UIElement {
  readonly collection = new SlotCollectionController<HTMLElement>(this, {
    selector: '[data-item]',
    attributeFilter: ['data-label'],
  });

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('mth-test-slot-list')) {
  customElements.define('mth-test-slot-list', TestSlotListElement);
}

interface ItemRow {
  id: string;
  label: string;
}

class TestDataConsumerElement extends UIElement {
  readonly data = new DataController<ItemRow, string>(this, {
    cacheTimeMs: 5000,
  });

  override render() {
    return html`<ul>
      ${this.data.items.map((item) => html`<li data-row>${item.label}</li>`)}
    </ul>`;
  }
}

if (!customElements.get('mth-test-data-consumer')) {
  customElements.define('mth-test-data-consumer', TestDataConsumerElement);
}

describe('Deliverable 2: Form, Input, Selection, SlotCollection, Data, Mask controllers', () => {
  it('FormControlController passes FormControlSuite conformance and handles Field/Form context & autofill bridge', async () => {
    let mountedField: TestFormFieldElement | null = null;
    const report = await FormControlSuite.run({
      mount: () => {
        mountedField = document.createElement('mth-test-form-field') as TestFormFieldElement;
        return mountedField;
      },
      setValue: (el, val) => {
        (el as TestFormFieldElement).setInputValue(val);
      },
      getValue: (el) => (el as TestFormFieldElement).value,
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mountedField) return null;
        return mountedField.formControl.disabled
          ? null
          : (mountedField.formControl.value as FormDataEntryValue | null);
      },
      getInternalDisabled: (el) => (el as TestFormFieldElement).formControl.formDisabled,
      isRequiredInvalid: (el) => !(el as TestFormFieldElement).formControl.checkValidity(),
    });
    expect(report.passed).toBe(true);

    const providerHost = document.createElement('div');
    const fieldProvider = new ContextProvider(providerHost, {
      context: FIELD_CONTEXT,
      initialValue: {
        version: 1,
        controlId: 'f1',
        required: true,
        invalid: false,
        disabled: false,
      } satisfies FieldContextValue,
    });
    const formProvider = new ContextProvider(providerHost, {
      context: FORM_CONTEXT,
      initialValue: {
        version: 1,
        disabled: false,
        readonly: false,
        density: 'compact',
      } satisfies FormContextValue,
    });

    const el = document.createElement('mth-test-form-field') as TestFormFieldElement;
    const slottedInput = document.createElement('input');
    slottedInput.setAttribute('slot', 'autofill');
    slottedInput.setAttribute('data-mth-autofill', '');
    el.appendChild(slottedInput);
    providerHost.appendChild(el);
    document.body.appendChild(providerHost);
    await el.updateComplete;

    expect(el.formControl.required).toBe(true);
    expect(el.formControl.userInvalid).toBe(false);
    // Hydration Purity: no data-mth-state-* Light-DOM attribute mutations on host
    expect(el.getAttributeNames().some((n) => n.startsWith('data-mth-state-'))).toBe(false);

    // Localized validation message resolved via @methane-ui/core i18n catalog
    registerLocaleMessages('fr', 'mth-form-control', { valueMissing: 'Champ requis.' });
    el.setAttribute('lang', 'fr');
    expect(el.formControl.validate()).toBe(false);
    expect(el.formControl.validationMessage).toBe('Champ requis.');
    el.removeAttribute('lang');

    // Simulate blur -> touched -> userInvalid turns true because required & empty
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(el.formControl.touched).toBe(true);
    expect(el.formControl.userInvalid).toBe(true);
    expect(el.hasCustomState('user-invalid')).toBe(true);

    // Light-DOM slotted <input> autofill syncs back into host
    const autofillListener = vi.fn();
    el.addEventListener('mth-autofill', autofillListener);
    slottedInput.value = 'jane@example.com';
    slottedInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.value).toBe('jane@example.com');
    expect(el.formControl.dirty).toBe(true);
    expect(el.formControl.userInvalid).toBe(false);
    expect(autofillListener).toHaveBeenCalledTimes(1);

    // Context disabled disables formControl without setting host `disabled` attribute
    formProvider.setValue({ version: 1, disabled: true, readonly: false, density: 'compact' });
    await el.updateComplete;
    expect(el.formControl.disabled).toBe(true);
    expect(el.hasAttribute('disabled')).toBe(false);
    fieldProvider.setValue({
      version: 1,
      controlId: 'f1',
      required: false,
      invalid: false,
      disabled: false,
    });

    el.formResetCallback();
    expect(el.value).toBe('');
    expect(el.formControl.dirty).toBe(false);
    expect(el.formControl.touched).toBe(false);
    providerHost.remove();
  });

  it('InputController manages IME composition, beforeinput guard, caret preservation, and visualViewport', async () => {
    const el = document.createElement('mth-test-form-field') as TestFormFieldElement;
    document.body.appendChild(el);
    await el.updateComplete;

    const commits: string[] = [];
    const viewportChanges: Array<{ inset: number; open: boolean }> = [];
    const inputCtrl = new InputController(el, {
      acceptInput: (_evt, nextVal) => /^\d*$/.test(nextVal),
      onCommitValue: (v) => commits.push(v),
      onViewportChange: (inset, open) => viewportChanges.push({ inset, open }),
    });

    const native = document.createElement('input');
    document.body.appendChild(native);
    inputCtrl.bind(native);

    // beforeinput rejects non-digits
    const badBefore = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: 'a',
      cancelable: true,
    });
    native.dispatchEvent(badBefore);
    expect(badBefore.defaultPrevented).toBe(true);

    // IME composition defers commit until compositionend
    native.dispatchEvent(new CompositionEvent('compositionstart'));
    expect(inputCtrl.isComposing).toBe(true);
    native.value = '12';
    native.dispatchEvent(new Event('input'));
    expect(commits).toEqual([]);
    native.dispatchEvent(new CompositionEvent('compositionend', { data: '12' }));
    expect(inputCtrl.isComposing).toBe(false);
    expect(commits).toEqual(['12']);

    // preserveCaret maintains relative cursor offset across formatted rewrite
    native.setSelectionRange(1, 1);
    inputCtrl.preserveCaret((target) => {
      target.value = '1234';
    });
    expect(native.selectionStart).toBe(3);

    // visualViewport simulation
    const listeners = new Map<string, Array<() => void>>();
    const mockVv = {
      height: 500,
      offsetTop: 0,
      addEventListener: (name: string, fn: () => void) => {
        const list = listeners.get(name) ?? [];
        list.push(fn);
        listeners.set(name, list);
      },
      removeEventListener: vi.fn(),
    };
    const originalVv = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    const origHeight = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: mockVv });
    inputCtrl.hostConnected();
    expect(inputCtrl.viewportInsetBottom).toBe(300);
    expect(inputCtrl.isVirtualKeyboardOpen).toBe(true);
    expect(viewportChanges.at(-1)).toEqual({ inset: 300, open: true });

    inputCtrl.hostDisconnected();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: origHeight });
    if (originalVv) {
      Object.defineProperty(window, 'visualViewport', originalVv);
    } else {
      Reflect.deleteProperty(window, 'visualViewport');
    }
    native.remove();
    el.remove();
  });

  it('SelectionController handles single, multi, Shift-range skipping disabled, and tri-state indeterminate', async () => {
    const el = document.createElement('mth-test-form-field') as TestFormFieldElement;
    const changes: Array<ReadonlyArray<string>> = [];
    const sel = new SelectionController<string>(el, {
      mode: 'multiple',
      items: [
        { value: 'a' },
        { value: 'b', disabled: true },
        { value: 'c' },
        { value: 'd' },
      ],
      onChange: (next) => changes.push(next),
    });

    expect(sel.checkState).toBe('unchecked');
    sel.select('a');
    expect(sel.checkState).toBe('indeterminate');

    // Shift-range from 'a' to 'd' skips disabled 'b'
    sel.select('d', { range: true });
    expect(sel.selectedValues).toEqual(['a', 'c', 'd']);
    expect(sel.isAllSelected).toBe(true);
    expect(sel.checkState).toBe('checked');

    // toggleAll clears all when checked
    sel.toggleAll();
    expect(sel.selectedValues).toEqual([]);
    expect(sel.checkState).toBe('unchecked');

    // switching to single collapses selection
    sel.select('a');
    sel.select('c', { additive: true });
    expect(sel.selectedValues).toEqual(['a', 'c']);
    sel.mode = 'single';
    expect(sel.selectedValues).toEqual(['a']);
    expect(changes.length).toBeGreaterThan(0);
  });

  it('SlotCollectionController unifies streaming Light-DOM children with JS array properties', async () => {
    const el = document.createElement('mth-test-slot-list') as TestSlotListElement;
    const a = document.createElement('div');
    a.setAttribute('data-item', '');
    a.textContent = 'First';
    el.appendChild(a);
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.collection.mode).toBe('slot');
    expect(el.collection.items.length).toBe(1);

    // Streaming insertion observed via MutationObserver / slotchange
    const b = document.createElement('div');
    b.setAttribute('data-item', '');
    b.textContent = 'Second';
    el.appendChild(b);
    await Promise.resolve();
    await el.updateComplete;
    expect(el.collection.items.length).toBe(2);

    // JS property override takes precedence, then null restores slot mode
    const propItems = [document.createElement('span')];
    el.collection.setPropertyItems(propItems);
    expect(el.collection.mode).toBe('property');
    expect(el.collection.items).toBe(propItems);
    el.collection.setPropertyItems(null);
    expect(el.collection.mode).toBe('slot');
    expect(el.collection.items.length).toBe(2);
    el.remove();
  });

  it('DataController passes DataConsumerSuite, handles AbortController race cancellation, caching, and pagination', async () => {
    const report = await DataConsumerSuite.run({
      mount: async (ds) => {
        const el = document.createElement('mth-test-data-consumer') as TestDataConsumerElement;
        el.data.setDataSource(ds as DataSource<ItemRow, string>);
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      triggerQuery: async (el, filter) => {
        const consumer = el as TestDataConsumerElement;
        await consumer.data.setFilter(filter);
        await consumer.updateComplete;
      },
      getState: (el) => (el as TestDataConsumerElement).data.status,
      getRenderedItemCount: (el) =>
        el.shadowRoot?.querySelectorAll('[data-row]').length ?? 0,
    });
    expect(report.passed).toBe(true);

    // Cursor pagination & caching
    let queryCount = 0;
    const pagedSource: DataSource<ItemRow, string> = {
      async query(req) {
        queryCount += 1;
        if (!req.cursor) {
          return {
            items: [{ id: '1', label: 'Alpha' }],
            total: 2,
            nextCursor: 'page-2',
          };
        }
        return {
          items: [{ id: '2', label: 'Beta' }],
          total: 2,
          nextCursor: null,
        };
      },
    };
    const host = document.createElement('mth-test-data-consumer') as TestDataConsumerElement;
    host.data.setDataSource(pagedSource);
    document.body.appendChild(host);
    await host.data.load();
    expect(host.data.items).toHaveLength(1);
    expect(host.data.status).toBe('ready');

    // Second load hits cache
    await host.data.load();
    expect(queryCount).toBe(1);

    // loadMore appends page 2
    await host.data.loadMore();
    expect(host.data.items.map((x) => x.label)).toEqual(['Alpha', 'Beta']);
    expect(queryCount).toBe(2);

    // Array data source helper works cleanly
    const arrayDs = createArrayDataSource([
      { id: '1', label: 'Zebra' },
      { id: '2', label: 'Apple' },
    ]);
    const res = await arrayDs.query({
      sort: [{ field: 'label', direction: 'asc' }],
      signal: new AbortController().signal,
    });
    expect(res.items.map((i) => i.label)).toEqual(['Apple', 'Zebra']);
    host.remove();
  });

  it('MaskAndFormatEngine formats patterns, numeric grouping, IBAN mod-97, and Luhn payment cards preserving caret', () => {
    const phoneMask = new MaskAndFormatEngine({ mode: 'pattern', pattern: '(000) 000-0000' });
    const phoneRes = phoneMask.format('4155551212', 3);
    expect(phoneRes.formatted).toBe('(415) 555-1212');
    expect(phoneRes.unmasked).toBe('4155551212');
    expect(phoneRes.caret).toBe(4);
    expect(phoneRes.isComplete).toBe(true);

    const numMask = new MaskAndFormatEngine({
      mode: 'numeric',
      decimals: 2,
      prefix: '$',
    });
    const numRes = numMask.format('1234567.89', 4);
    expect(numRes.formatted).toBe('$1,234,567.89');
    expect(numRes.unmasked).toBe('1234567.89');
    expect(numRes.caret).toBe(6);

    const ibanMask = new MaskAndFormatEngine({ mode: 'iban' });
    const validIban = ibanMask.format('de89370400440532013000');
    expect(validIban.formatted).toBe('DE89 3704 0044 0532 0130 00');
    expect(validIban.isValid).toBe(true);
    const badIban = ibanMask.format('DE00370400440532013000');
    expect(badIban.isValid).toBe(false);

    const cardMask = new MaskAndFormatEngine({ mode: 'card' });
    const amex = cardMask.format('378282246310005');
    expect(amex.formatted).toBe('3782 822463 10005');
    expect(amex.isComplete).toBe(true);
    expect(amex.isValid).toBe(true);
  });
});
