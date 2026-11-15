import '@angular/compiler';
import { ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MthCheckboxDirective, MthInputDirective } from '@methane/angular';
import { describe, expect, it } from 'vitest';
import { renderVerifyAngularSsr } from './server.js';

describe('@methane/verify-angular', () => {
  it('renders Angular 19 SSR with Reactive Forms, DSD shadow roots, <head> link hoisting, and ng markers without CUSTOM_ELEMENTS_SCHEMA', async () => {
    const result = await renderVerifyAngularSsr();

    expect(result.preservedAngularMarkers).toBe(true);
    expect(result.html).toContain('ng-version=');
    expect(result.html).toContain('ng-server-context=');
    expect(result.html).toContain('Methane Angular 19 SSR + Reactive Forms Verification');
    expect(result.html).toContain('angular-ssr@methane.dev|true|true');
    expect(result.html).toContain('data-methane-canary-slot="true"');
    expect(result.html).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
    expect(result.html).toContain('/assets/methane-angular-hydrate.js');
    expect(result.links.length).toBeGreaterThan(0);

    const headEnd = result.html.indexOf('</head>');
    const firstLinkIndex = result.html.indexOf('<link rel="preload" as="style"');
    expect(headEnd).toBeGreaterThan(-1);
    expect(firstLinkIndex).toBeGreaterThan(-1);
    expect(firstLinkIndex).toBeLessThan(headEnd);
  });

  it('wires ControlValueAccessor on MthInputDirective and MthCheckboxDirective with Reactive FormControl events', () => {
    const inputHost = {
      value: '',
      disabled: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as HTMLElement & Record<string, unknown>;
    const inputRef = new ElementRef(inputHost);
    const inputDirective = new MthInputDirective(inputRef);
    const emailControl = new FormControl('initial@methane.dev', { nonNullable: true });

    inputDirective.writeValue(emailControl.value);
    expect(inputHost['value']).toBe('initial@methane.dev');

    let latestEmail: unknown;
    let touched = false;
    inputDirective.registerOnChange((next) => {
      latestEmail = next;
      emailControl.setValue(String(next));
    });
    inputDirective.registerOnTouched(() => {
      touched = true;
      emailControl.markAsTouched();
    });
    inputDirective.setDisabledState(true);
    expect(inputHost['disabled']).toBe(true);

    const inputEvent = new CustomEvent('mth-input', {
      detail: { value: 'updated@methane.dev' },
    });
    inputDirective.handleValueEvent(inputEvent);
    inputDirective.handleHostBlur();

    expect(latestEmail).toBe('updated@methane.dev');
    expect(emailControl.value).toBe('updated@methane.dev');
    expect(touched).toBe(true);
    expect(emailControl.touched).toBe(true);

    const checkboxHost = {
      checked: false,
      disabled: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as HTMLElement & Record<string, unknown>;
    const checkboxDirective = new MthCheckboxDirective(new ElementRef(checkboxHost));
    checkboxDirective.writeValue(true);
    expect(checkboxHost['checked']).toBe(true);

    let latestChecked: unknown;
    checkboxDirective.registerOnChange((next) => {
      latestChecked = next;
    });
    checkboxDirective.handleValueEvent(
      new CustomEvent('mth-change', { detail: { checked: false } }),
    );
    expect(latestChecked).toBe(false);

    inputDirective.ngOnDestroy();
    checkboxDirective.ngOnDestroy();
  });
});
