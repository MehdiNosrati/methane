import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { artifactPaneSpec } from './artifact-pane.spec.js';
import { MthArtifactPane, registerMthArtifactPane } from './index.js';

describe('<mth-artifact-pane>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, version switch, copy/close, and sanitized preview', async () => {
    const compiled = compileSpec(artifactPaneSpec);
    expect(compiled.docs).toContain('`<mth-artifact-pane>`');

    const report = await runBehaviorSpecAssertions(artifactPaneSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const pane = document.createElement('mth-artifact-pane') as MthArtifactPane;
    pane.title = 'Widget';
    pane.kind = 'html';
    pane.versions = [
      { id: 'v1', label: 'v1', content: '<div>Safe</div><script>evil()</script>', kind: 'html' },
      { id: 'v2', label: 'v2', content: '<p onclick="evil()">Updated</p>', kind: 'html' },
    ];
    pane.activeVersion = 'v1';
    document.body.appendChild(pane);
    await pane.updateComplete;

    pane.setTab('preview');
    await pane.updateComplete;

    const preview = pane.shadowRoot!.querySelector('[part="preview-body"]')!;
    expect(preview.querySelector('script')).toBeNull();
    expect(preview.querySelector('div')?.textContent).toBe('Safe');

    const select = pane.shadowRoot!.querySelector<HTMLSelectElement>('select')!;
    select.value = 'v2';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await pane.updateComplete;
    expect(preview.querySelector('p')?.getAttribute('onclick')).toBeNull();
    expect(preview.querySelector('p')?.textContent).toBe('Updated');

    // Cancelable close check
    pane.addEventListener('mth-close', (e) => e.preventDefault(), { once: true });
    pane.shadowRoot!.querySelector<HTMLElement>('[part="close-button"]')?.click();
    await pane.updateComplete;
    expect(pane.open).toBe(true);

    pane.shadowRoot!.querySelector<HTMLElement>('[part="close-button"]')?.click();
    await pane.updateComplete;
    expect(pane.open).toBe(false);
    expect(scanSameRootAria(pane).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-artifact-pane title="Code" language="ts" content="const x = 1;"></mth-artifact-pane>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-artifact-pane', '<hyd-artifact-pane')
      .replaceAll('</mth-artifact-pane>', '</hyd-artifact-pane>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthArtifactPane('hyd');
        customElements.upgrade(host);
        await (host as MthArtifactPane).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('switches activeTab via roving ArrowRight and ignores ArrowRight on version select', async () => {
    const pane = document.createElement('mth-artifact-pane') as MthArtifactPane;
    pane.title = 'Demo';
    pane.kind = 'markdown';
    pane.content = '**Hello**';
    pane.versions = [
      { id: 'v1', label: 'v1', content: 'v1' },
      { id: 'v2', label: 'v2', content: 'v2' },
    ];
    document.body.appendChild(pane);
    await pane.updateComplete;

    const tabs = Array.from(pane.shadowRoot!.querySelectorAll<HTMLElement>('[role="tab"]'));
    expect(tabs[0]!.tabIndex).toBe(0);
    expect(tabs[1]!.tabIndex).toBe(-1);

    const select = pane.shadowRoot!.querySelector<HTMLSelectElement>('.version-select')!;
    select.focus();
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    expect(pane.activeTab).toBe('code');

    tabs[0]!.focus();
    tabs[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    await pane.updateComplete;
    expect(pane.activeTab).toBe('preview');
  });
});
