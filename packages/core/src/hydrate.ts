import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { LitElement } from 'lit';

const ownDesc = Object.getOwnPropertyDescriptor(LitElement, 'observedAttributes');
if (!ownDesc || ownDesc.configurable) {
  const hook = (
    globalThis as { litElementHydrateSupport?: (arg: { LitElement: unknown }) => void }
  ).litElementHydrateSupport;
  hook?.({ LitElement });
}

export {};
