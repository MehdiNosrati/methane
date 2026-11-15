import { CommonModule } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MthButtonDirective,
  MthCheckboxDirective,
  MthInputDirective,
} from '@methane/angular';
import {
  MthErrorBoundaryHostDirective,
  MthSkipLinkHostDirective,
  MthVisuallyHiddenHostDirective,
} from './utility-directives.js';

function ensureJitDirectiveFactoryMetadata(directiveClass: object): void {
  const target = directiveClass as {
    ctorParameters?: () => ReadonlyArray<{ type: unknown }>;
  };
  if (typeof target.ctorParameters !== 'function') {
    target.ctorParameters = () => [{ type: ElementRef }];
  }
}

ensureJitDirectiveFactoryMetadata(MthInputDirective);
ensureJitDirectiveFactoryMetadata(MthCheckboxDirective);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MthButtonDirective,
    MthCheckboxDirective,
    MthInputDirective,
    MthSkipLinkHostDirective,
    MthVisuallyHiddenHostDirective,
    MthErrorBoundaryHostDirective,
  ],
  template: `
    <div>
      <mth-skip-link href="#main">Skip to Angular verification harness</mth-skip-link>
      <main id="main" class="mth-container">
        <header class="mth-card">
          <h1>Methane Angular 19 SSR + Reactive Forms Verification</h1>
          <mth-visually-hidden>Angular screen reader landmark</mth-visually-hidden>
        </header>
        <mth-error-boundary fallback-message="Angular SSR harness boundary fallback">
          <section data-methane-canary-slot="true">
            <form [formGroup]="verifyForm" (ngSubmit)="onSubmit()">
              <mth-input
                formControlName="email"
                name="canary-email"
                label="Verification Email"
                placeholder="engineer@methane.dev"
                [required]="true"
              ></mth-input>
              <mth-checkbox formControlName="accepted">Accept Methane verification terms</mth-checkbox>
              <mth-button variant="solid" type="submit">Verify Angular</mth-button>
            </form>
            <p data-testid="form-snapshot">{{ snapshot }}</p>
          </section>
        </mth-error-boundary>
      </main>
    </div>
  `,
})
export class AppComponent {
  readonly verifyForm = new FormGroup({
    email: new FormControl('angular-ssr@methane.dev', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    accepted: new FormControl(true, { nonNullable: true }),
  });

  submitted = false;

  get snapshot(): string {
    const raw = this.verifyForm.getRawValue();
    return `${raw.email}|${String(raw.accepted)}|${String(this.verifyForm.valid)}`;
  }

  onSubmit(): void {
    this.submitted = true;
  }
}
