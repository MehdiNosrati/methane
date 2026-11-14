import * as React from 'react';
import { describe, expect, it } from 'vitest';
import type { MthButtonProps, MthInputProps } from './index.js';
import { MthButton, MthInput } from './legacy.js';

describe('@methane/react', () => {
  it('supports React 19 zero-runtime JSX intrinsic element types', () => {
    const btnElement = React.createElement('mth-button', {
      variant: 'solid',
      size: 'md',
      'onmth-press': () => undefined,
    } satisfies MthButtonProps);
    expect(btnElement.type).toBe('mth-button');

    const inputElement = React.createElement('mth-input', {
      value: 'hello',
      required: true,
      'onmth-input': (e) => {
        const val: string = e.detail.value;
        void val;
      },
    } satisfies MthInputProps);
    expect(inputElement.type).toBe('mth-input');
  });

  it('exports @lit/react legacy wrappers for React 18', () => {
    expect(MthButton.displayName).toBe('MthButton');
    expect(MthInput.displayName).toBe('MthInput');
  });
});
