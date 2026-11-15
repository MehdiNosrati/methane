import '@angular/compiler';
import type { ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  METHANE_ANGULAR_DIRECTIVES,
  MthButtonDirective,
  MthCheckboxDirective,
  MthInputDirective,
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
    expect(METHANE_ANGULAR_DIRECTIVES).toContain(MthButtonDirective);
    expect(METHANE_ANGULAR_DIRECTIVES).toContain(MthInputDirective);

    const [btnMeta] = getAnnotations(MthButtonDirective);
    expect(btnMeta?.standalone).toBe(true);
    expect(btnMeta?.selector).toBe('mth-button');
    expect(btnMeta?.providers).toBeUndefined();

    const [inputMeta] = getAnnotations(MthInputDirective);
    expect(inputMeta?.standalone).toBe(true);
    expect(inputMeta?.selector).toBe('mth-input');
    expect(inputMeta?.providers?.[0]?.provide).toBe(NG_VALUE_ACCESSOR);
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

    const checkboxEl = document.createElement('mth-checkbox') as HTMLElement & Record<string, unknown>;
    const checkboxDir = new MthCheckboxDirective({
      nativeElement: checkboxEl,
    } as ElementRef<HTMLElement & Record<string, unknown>>);
    const checkedChanges: unknown[] = [];
    checkboxDir.registerOnChange((val) => checkedChanges.push(val));
    checkboxDir.writeValue(true);
    expect(checkboxEl['checked']).toBe(true);

    checkboxEl.dispatchEvent(new CustomEvent('mth-change', { detail: { checked: false } }));
    expect(checkedChanges).toEqual([false]);
    checkboxDir.ngOnDestroy();
  });
});
