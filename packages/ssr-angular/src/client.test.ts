// @vitest-environment jsdom
import { digestForTemplateResult } from '@methane/ssr/client';
import {
  initAngularHydration,
  isAngularHydrationReady,
  provideMethaneHydration,
  upgradeMethaneAngularElements,
} from './client.js';
import { LitElement, html } from 'lit';
import { describe, expect, it } from 'vitest';

const template = html`<span part="base">Ready</span>`;

class MthNgClientProbe extends LitElement {
  override render() {
    return template;
  }
}

describe('@methane/ssr-angular/client', () => {
  it('provides non-destructive Angular client hydration hook and element upgrade', async () => {
    expect(isAngularHydrationReady()).toBe(true);
    const provider = provideMethaneHydration(LitElement);
    expect(provider.name).toBe('MethaneHydrationProvider');
    expect(provider.initialize()).toBe(true);
    expect(initAngularHydration(LitElement)).toBe(true);

    const container = document.createElement('div');
    const host = document.createElement('mth-ng-client-probe');
    const shadow = host.attachShadow({ mode: 'open' });
    const commentStart = document.createComment(`lit-part ${digestForTemplateResult(template)}`);
    const span = document.createElement('span');
    span.setAttribute('part', 'base');
    span.textContent = 'Ready';
    const commentEnd = document.createComment('/lit-part');
    shadow.append(commentStart, span, commentEnd);
    container.appendChild(host);
    document.body.appendChild(container);

    if (!customElements.get('mth-ng-client-probe')) {
      customElements.define('mth-ng-client-probe', MthNgClientProbe);
    }

    const upgraded = upgradeMethaneAngularElements(container);
    expect(upgraded).toContain('mth-ng-client-probe');
    await (host as LitElement).updateComplete;
    expect(host.shadowRoot?.querySelector('span')).toBe(span);

    container.remove();
  });
});
