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
  } else {
    // `@lit-labs/ssr` overwrites `LitElement.prototype.createRenderRoot` when imported;
    // restore the hydrate flag check when `litElementHydrateSupport` ran beforehand.
    const proto = LitElement.prototype as unknown as {
      createRenderRoot: (
        this: LitElement & { _$AG?: boolean; _$needsHydration?: boolean },
      ) => HTMLElement | DocumentFragment;
    };
    const orig = proto.createRenderRoot;
    const src = String(orig);
    if (!src.includes('_$AG') && !src.includes('_$needsHydration')) {
      proto.createRenderRoot = function () {
        if (this.shadowRoot) {
          this._$AG = true;
          this._$needsHydration = true;
          return this.shadowRoot;
        }
        return orig.call(this);
      };
    }
  }
  patched = true;
}

export async function renderLitDsdHtml(template: TemplateResult): Promise<string> {
  ensureSsrHydrateSupport();
  return collectResult(render(template));
}
