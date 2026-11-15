import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { cardSpec } from './card.spec.js';
import { MthCard, registerMthCard } from './index.js';

describe('<mth-card>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, supports variants/interactive/slots, and same-root ARIA', async () => {
    const compiled = compileSpec(cardSpec);
    expect(compiled.docs).toContain('`<mth-card>`');

    const report = await runBehaviorSpecAssertions(cardSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const card = document.createElement('mth-card') as MthCard;
    card.variant = 'outlined';
    card.interactive = true;

    const header = document.createElement('h3');
    header.slot = 'header';
    header.textContent = 'Card Title';

    const body = document.createElement('p');
    body.textContent = 'Card body copy.';

    const footer = document.createElement('span');
    footer.slot = 'footer';
    footer.textContent = 'Footer meta';

    card.append(header, body, footer);
    document.body.appendChild(card);
    await card.updateComplete;
    await Promise.resolve();
    await card.updateComplete;

    expect(card.hasCustomState('interactive')).toBe(true);
    expect(card.shadowRoot!.querySelector('[part="media"]')?.hasAttribute('hidden')).toBe(true);
    expect(card.shadowRoot!.querySelector('[part="header"]')?.hasAttribute('hidden')).toBe(false);
    expect(card.shadowRoot!.querySelector('[part="footer"]')?.hasAttribute('hidden')).toBe(false);
    expect(scanSameRootAria(card).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-card variant="subtle">Body</mth-card>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-card>', 'hyd-card>').replaceAll('<mth-card', '<hyd-card');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCard('hyd');
        customElements.upgrade(host);
        await (host as MthCard).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
