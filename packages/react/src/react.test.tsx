import * as React from 'react';
import { describe, expect, it } from 'vitest';
import type {
  MthComboboxProps,
  MthDialogProps,
  MthErrorBoundaryProps,
  MthFieldProps,
  MthInputProps,
  MthSkipLinkProps,
} from './index.js';
import { MthCombobox, MthDialog, MthField, MthInput } from './legacy.js';

describe('@methane-ui/react', () => {
  it('supports React 19 zero-runtime JSX intrinsic element types for Phase 0 & primitives', () => {
    const fieldElement = React.createElement('mth-field', {
      label: 'Email',
      required: true,
    } satisfies MthFieldProps);
    expect(fieldElement.type).toBe('mth-field');

    const inputElement = React.createElement('mth-input', {
      value: 'hello',
      required: true,
      'onmth-input': (e) => {
        const val: string = e.detail.value;
        void val;
      },
    } satisfies MthInputProps);
    expect(inputElement.type).toBe('mth-input');

    const dialogElement = React.createElement('mth-dialog', {
      open: true,
      variant: 'confirm',
      'onmth-close': () => undefined,
    } satisfies MthDialogProps);
    expect(dialogElement.type).toBe('mth-dialog');

    const comboboxElement = React.createElement('mth-combobox', {
      value: 'apple',
      clearable: true,
      'onmth-change': (e) => {
        const vals: ReadonlyArray<string> = e.detail.selectedValues;
        void vals;
      },
    } satisfies MthComboboxProps);
    expect(comboboxElement.type).toBe('mth-combobox');

    const skipElement = React.createElement('mth-skip-link', {
      href: '#content',
    } satisfies MthSkipLinkProps);
    expect(skipElement.type).toBe('mth-skip-link');

    const boundaryElement = React.createElement('mth-error-boundary', {
      fallbackMessage: 'Oops',
      'onmth-reset': () => undefined,
    } satisfies MthErrorBoundaryProps);
    expect(boundaryElement.type).toBe('mth-error-boundary');
  });

  it('exports @lit/react legacy wrappers for React 18', () => {
    expect(MthField.displayName).toBe('MthField');
    expect(MthInput.displayName).toBe('MthInput');
    expect(MthDialog.displayName).toBe('MthDialog');
    expect(MthCombobox.displayName).toBe('MthCombobox');
  });
});
