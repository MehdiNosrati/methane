import '@methane/react';
import type {} from '../types/custom-elements';

export default function VerifyNextPage() {
  return (
    <main id="main" className="mth-container">
      <mth-stack gap="4">
        <header className="mth-card">
          <h1>Methane Next.js 15 RSC + React 19 Verification</h1>
          <mth-visually-hidden>Screen reader verification landmark</mth-visually-hidden>
        </header>
        <mth-error-boundary fallback-message="Next.js SSR harness boundary fallback">
          <section data-methane-canary-slot="true" aria-label="Canary mount harness">
            <mth-field label="Canary Email Field" hint="Work or personal email" required>
              <mth-input
                name="canary-input"
                type="email"
                label="Canary Input"
                value="next-rsc@methane.dev"
                placeholder="you@methane.dev"
              />
            </mth-field>
            <mth-combobox name="canary-framework" label="Framework Target" value="lit" clearable>
              <mth-option-group label="Web Standards">
                <mth-option value="lit">Lit 3</mth-option>
                <mth-option value="wc">Custom Elements</mth-option>
              </mth-option-group>
            </mth-combobox>
            <mth-dialog
              label="Canary Dialog"
              description="Next.js top-layer modal verification"
              variant="confirm"
            >
              Confirm canary verification
            </mth-dialog>
          </section>
        </mth-error-boundary>
      </mth-stack>
    </main>
  );
}
