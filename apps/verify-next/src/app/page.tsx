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
            <mth-input name="canary-input" label="Canary Input" value="next-rsc" />
          </section>
        </mth-error-boundary>
      </mth-stack>
    </main>
  );
}
