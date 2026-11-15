import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { collabCursorsSpec, MthCollabCursors, registerMthCollabCursors } from './index.js';

describe('<mth-collab-cursors>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, renders coordinates cleanly, and scans ARIA', async () => {
    const compiled = compileSpec(collabCursorsSpec);
    expect(compiled.tests).toContain('<mth-collab-cursors>');
    const report = await runBehaviorSpecAssertions(collabCursorsSpec, {});
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-collab-cursors') as MthCollabCursors;
    el.cursors = [
      {
        id: 'u1',
        name: 'Ada Lovelace',
        color: 'oklch(0.6 0.2 140)',
        x: 120,
        y: 48,
        selection: { x: 100, y: 40, width: 80, height: 22 },
      },
    ];
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelectorAll('[part="cursor"]').length).toBe(1);
    expect(el.shadowRoot!.querySelector('[part="name"]')?.textContent?.trim()).toBe('Ada Lovelace');
    expect(el.shadowRoot!.querySelector('[part="selection"]')).not.toBeNull();
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('rejects non-finite coordinates and unsafe CSS/HTML injection payloads', async () => {
    const el = document.createElement('mth-collab-cursors') as MthCollabCursors;
    el.cursors = [
      {
        id: 'bad"] { background: url(https://evil.example/x); } /*',
        name: 'Bob\u0000\u0007',
        color: 'red; background: url(https://evil.example/y)',
        x: Number.NaN,
        y: 20,
      },
      {
        id: 'ok"] { color: red',
        name: 'Grace',
        color: 'red; background: url(https://evil.example/z)',
        x: 42,
        y: -15,
        selection: { x: Number.POSITIVE_INFINITY, y: 10, width: 30, height: 12 },
      },
    ];
    document.body.append(el);
    await el.updateComplete;

    // NaN cursor skipped, valid cursor clamped and CSS injection neutralized
    const cursors = el.shadowRoot!.querySelectorAll('[part="cursor"]');
    expect(cursors.length).toBe(1);
    expect(cursors[0]!.getAttribute('data-cursor-idx')).toBe('0');

    const sheets = el.shadowRoot!.adoptedStyleSheets ?? [];
    const cssText = sheets
      .map((sheet) =>
        Array.from(sheet.cssRules ?? [])
          .map((rule) => rule.cssText)
          .join('\n'),
      )
      .join('\n');
    expect(cssText).not.toContain('evil.example');
    expect(cssText).not.toContain('NaN');
    expect(cssText).not.toContain('Infinity');
    expect(cssText).toContain('--_cursor-x: 42px');
    expect(cssText).toContain('--_cursor-y: 0px');
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthCollabCursors();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-collab-cursors label="Live cursors"></mth-collab-cursors>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-collab-cursors>', 'hyd-collab-cursors>')
      .replaceAll('<mth-collab-cursors', '<hyd-collab-cursors');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCollabCursors('hyd');
        customElements.upgrade(host);
        await (host as MthCollabCursors).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
