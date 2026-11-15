import '@angular/compiler';
import type { ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  METHANE_ANGULAR_DIRECTIVES,
  MthComboboxDirective,
  MthDialogDirective,
  MthInputDirective,
  MthSkipLinkDirective,
} from './index.js';

interface AngularDirectiveAnnotation {
  readonly selector: string;
  readonly standalone: boolean;
  readonly providers?: ReadonlyArray<{ readonly provide: unknown }>;
}

function getAnnotations(target: unknown): ReadonlyArray<AngularDirectiveAnnotation> {
  return (target as { readonly __annotations__?: ReadonlyArray<AngularDirectiveAnnotation> })
    .__annotations__ ?? [];
}

describe('@methane/angular', () => {
  it('emits real @angular/core standalone directives with NG_VALUE_ACCESSOR for formAssociated controls', () => {
    expect(METHANE_ANGULAR_DIRECTIVES).toContain(MthDialogDirective);
    expect(METHANE_ANGULAR_DIRECTIVES).toContain(MthInputDirective);
    expect(METHANE_ANGULAR_DIRECTIVES).toContain(MthComboboxDirective);
    expect(METHANE_ANGULAR_DIRECTIVES).toContain(MthSkipLinkDirective);

    const [dialogMeta] = getAnnotations(MthDialogDirective);
    expect(dialogMeta?.standalone).toBe(true);
    expect(dialogMeta?.selector).toBe('mth-dialog');
    expect(dialogMeta?.providers).toBeUndefined();

    const [inputMeta] = getAnnotations(MthInputDirective);
    expect(inputMeta?.standalone).toBe(true);
    expect(inputMeta?.selector).toBe('mth-input');
    expect(inputMeta?.providers?.[0]?.provide).toBe(NG_VALUE_ACCESSOR);

    const [comboMeta] = getAnnotations(MthComboboxDirective);
    expect(comboMeta?.standalone).toBe(true);
    expect(comboMeta?.selector).toBe('mth-combobox');
    expect(comboMeta?.providers?.[0]?.provide).toBe(NG_VALUE_ACCESSOR);
  });

  it('wires ControlValueAccessor to real CustomEvent and FocusEvent on nativeElement', () => {
    const inputEl = document.createElement('mth-input') as HTMLElement & Record<string, unknown>;
    const inputDir = new MthInputDirective({
      nativeElement: inputEl,
    } as ElementRef<HTMLElement & Record<string, unknown>>);

    const changes: unknown[] = [];
    let touchedCount = 0;
    inputDir.registerOnChange((val) => changes.push(val));
    inputDir.registerOnTouched(() => {
      touchedCount += 1;
    });

    inputDir.writeValue('abc');
    expect(inputEl['value']).toBe('abc');

    inputDir.setDisabledState(true);
    expect(inputEl['disabled']).toBe(true);

    inputEl.dispatchEvent(new CustomEvent('mth-input', { detail: { value: 'xyz' } }));
    inputEl.dispatchEvent(new FocusEvent('focusout'));
    expect(changes).toEqual(['xyz']);
    expect(touchedCount).toBe(1);

    inputDir.ngOnDestroy();
    inputEl.dispatchEvent(new CustomEvent('mth-input', { detail: { value: 'after-destroy' } }));
    expect(changes).toEqual(['xyz']);

    const comboEl = document.createElement('mth-combobox') as HTMLElement & Record<string, unknown>;
    const comboDir = new MthComboboxDirective({
      nativeElement: comboEl,
    } as ElementRef<HTMLElement & Record<string, unknown>>);
    const comboChanges: unknown[] = [];
    comboDir.registerOnChange((val) => comboChanges.push(val));
    comboDir.writeValue('apple');
    expect(comboEl['value']).toBe('apple');

    comboEl.dispatchEvent(new CustomEvent('mth-change', { detail: { value: 'banana' } }));
    expect(comboChanges).toEqual(['banana']);
    comboDir.ngOnDestroy();
  });
});
