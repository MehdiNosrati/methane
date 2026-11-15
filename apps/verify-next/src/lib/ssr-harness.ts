import { registerUtilityElements } from '@methane/primitives';
import {
  renderNextHtml,
  transformNextResponse,
  type NextSsrOptions,
  type NextSsrResult,
} from '@methane/ssr-next';
import { registerAllComponents } from '@methane/ui';

function ensureServerWindowLocation(): void {
  const g = globalThis as unknown as { window?: { location?: unknown } };
  if (typeof g.window === 'object' && g.window !== null && !g.window.location) {
    Object.defineProperty(g.window, 'location', {
      value: new URL('http://127.0.0.1:3101/'),
      configurable: true,
      writable: true,
    });
  }
}

ensureServerWindowLocation();

export function buildVerifyNextMarkup(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Methane Next.js 15 SSR Verification</title>
  </head>
  <body>
    <mth-skip-link href="#main">Skip to verification harness</mth-skip-link>
    <main id="main" class="mth-container">
      <mth-stack gap="4">
        <header class="mth-card">
          <h1>Methane Next.js 15 RSC + React 19 Verification</h1>
          <mth-visually-hidden>Screen reader verification landmark</mth-visually-hidden>
        </header>
        <mth-error-boundary fallback-message="Next.js SSR harness boundary fallback">
          <section data-methane-canary-slot="true" aria-label="Canary mount harness">
            <mth-field label="Canary Email Field" hint="Work or personal email" required>
              <mth-input name="canary-input" type="email" label="Canary Input" value="next-rsc@methane.dev" placeholder="you@methane.dev"></mth-input>
            </mth-field>
            <mth-combobox name="canary-framework" label="Framework Target" value="lit" clearable>
              <mth-option-group label="Web Standards">
                <mth-option value="lit">Lit 3</mth-option>
                <mth-option value="wc">Custom Elements</mth-option>
              </mth-option-group>
            </mth-combobox>
            <mth-dialog label="Canary Dialog" description="Next.js top-layer modal verification" variant="confirm">Confirm canary verification</mth-dialog>
          </section>
        </mth-error-boundary>
      </mth-stack>
    </main>
  </body>
</html>`;
}

export async function renderVerifyNextDocument(
  options: NextSsrOptions = {},
): Promise<NextSsrResult> {
  ensureServerWindowLocation();
  registerUtilityElements();
  registerAllComponents();
  return renderNextHtml(buildVerifyNextMarkup(), {
    assetBase: '/methane/styles',
    hydrationModuleUrl: '/_next/static/methane-hydrate.js',
    ...options,
  });
}

export async function createVerifyNextResponse(
  options: NextSsrOptions = {},
): Promise<Response> {
  ensureServerWindowLocation();
  registerUtilityElements();
  registerAllComponents();
  const baseResponse = new Response(buildVerifyNextMarkup(), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  return transformNextResponse(baseResponse, {
    assetBase: '/methane/styles',
    hydrationModuleUrl: '/_next/static/methane-hydrate.js',
    ...options,
  });
}
