import { CommonModule } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MthButtonDirective,
  MthCheckboxDirective,
  MthComboboxDirective,
  MthDialogDirective,
  MthFieldDirective,
  MthInputDirective,
  MthOptionDirective,
  MthOptionGroupDirective,
} from '@methane-ui/angular';
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
ensureJitDirectiveFactoryMetadata(MthComboboxDirective);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MthButtonDirective,
    MthCheckboxDirective,
    MthComboboxDirective,
    MthDialogDirective,
    MthFieldDirective,
    MthInputDirective,
    MthOptionDirective,
    MthOptionGroupDirective,
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
              <mth-field label="Verification Email Field" hint="Work or personal email" [required]="true">
                <mth-input
                  formControlName="email"
                  name="canary-email"
                  type="email"
                  label="Verification Email"
                  placeholder="engineer@methane.dev"
                  [required]="true"
                ></mth-input>
              </mth-field>
              <mth-combobox
                formControlName="framework"
                name="canary-framework"
                label="Framework Target"
                [clearable]="true"
              >
                <mth-option-group label="Web Standards">
                  <mth-option value="lit">Lit 3</mth-option>
                  <mth-option value="wc">Custom Elements</mth-option>
                </mth-option-group>
              </mth-combobox>
              <mth-checkbox formControlName="accepted">Accept Methane verification terms</mth-checkbox>
              <mth-button variant="solid" type="submit">Verify Angular</mth-button>
            </form>
            <mth-dialog
              label="Canary Dialog"
              description="Angular top-layer modal verification"
              variant="confirm"
            >
              Confirm Angular verification
            </mth-dialog>
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
    framework: new FormControl('lit', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    accepted: new FormControl(true, { nonNullable: true }),
  });

  submitted = false;

  get snapshot(): string {
    const raw = this.verifyForm.getRawValue();
    return `${raw.email}|${raw.framework}|${String(raw.accepted)}|${String(this.verifyForm.valid)}`;
  }

  onSubmit(): void {
    this.submitted = true;
  }
}
