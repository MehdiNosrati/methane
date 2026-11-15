import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { LitElement, type TemplateResult } from 'lit';

let patched = false;

export function ensureSsrHydrateSupport(): void {
  if (patched) return;
  const hook = (
    globalThis as { litElementHydrateSupport?: (arg: { LitElement: unknown }) => void }
  ).litElementHydrateSupport;
  if (hook && !Object.getOwnPropertyDescriptor(LitElement, 'observedAttributes')) {
    hook({ LitElement });
  }
  patched = true;
}

export async function renderLitDsdHtml(template: TemplateResult): Promise<string> {
  ensureSsrHydrateSupport();
  return collectResult(render(template));
}
