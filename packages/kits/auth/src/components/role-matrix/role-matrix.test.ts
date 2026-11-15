import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthRoleMatrix, registerMthRoleMatrix, roleMatrixSpec } from './index.js';

const SAMPLE_ROLES = [
  { id: 'admin', name: 'Admin' },
  { id: 'editor', name: 'Editor' },
  { id: 'viewer', name: 'Viewer' },
];

const SAMPLE_PERMS = [
  { id: 'read', label: 'Read documents', category: 'Content' },
  { id: 'write', label: 'Write documents', category: 'Content' },
];

describe('<mth-role-matrix>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, 2D arrow navigation, and HydrationPuritySuite', async () => {
    const compiled = compileSpec(roleMatrixSpec);
    expect(compiled.docs).toContain('`<mth-role-matrix>`');

    const rfAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-role-matrix') as MthRoleMatrix;
        el.dir = dir;
        el.roles = SAMPLE_ROLES;
        el.permissions = SAMPLE_PERMS;
        el.grants = { admin: ['read', 'write'], editor: ['read'] };
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) => (el as MthRoleMatrix).getCellControls(),
      orientation: 'horizontal' as const,
      loop: false,
    };

    const report = await runBehaviorSpecAssertions(roleMatrixSpec, {
      rovingFocus: rfAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const rf = await RovingFocusSuite.run(rfAdapter);
    expect(rf.failures).toEqual([]);
    expect(rf.passed).toBe(true);

    const rawSsr = await renderLitDsdHtml(litHtml`<mth-role-matrix></mth-role-matrix>`);
    const ssrHtml = rawSsr
      .replaceAll('<mth-role-matrix', '<hyd-role-matrix')
      .replaceAll('</mth-role-matrix>', '</hyd-role-matrix>');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthRoleMatrix('hyd');
        customElements.upgrade(host);
        await (host as MthRoleMatrix).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });

  it('supports ArrowDown row navigation, emits mth-change, and blocks mutation when readonly', async () => {
    const matrix = document.createElement('mth-role-matrix') as MthRoleMatrix;
    matrix.roles = SAMPLE_ROLES;
    matrix.permissions = SAMPLE_PERMS;
    matrix.grants = { admin: ['read', 'write'], editor: ['read'], viewer: [] };
    document.body.appendChild(matrix);
    await matrix.updateComplete;

    const cells = matrix.getCellControls();
    expect(cells).toHaveLength(6);

    cells[0]!.focus();
    cells[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
    );
    expect(cells[3]!.tabIndex).toBe(0);

    let lastChange: { roleId: string; permissionId: string; granted: boolean } | null = null;
    matrix.addEventListener('mth-change', ((ev: CustomEvent) => {
      lastChange = ev.detail;
    }) as EventListener);

    cells[4]!.click();
    await matrix.updateComplete;
    expect(lastChange).toMatchObject({ roleId: 'editor', permissionId: 'write', granted: true });
    expect(matrix.isGranted('editor', 'write')).toBe(true);

    matrix.readonly = true;
    await matrix.updateComplete;

    lastChange = null;
    const viewerRead = matrix.getCellControls()[2]!;
    viewerRead.click();
    await matrix.updateComplete;
    expect(lastChange).toBeNull();
    expect(matrix.isGranted('viewer', 'read')).toBe(false);
    expect(viewerRead.checked).toBe(false);

    const aria = scanSameRootAria(matrix.shadowRoot!);
    expect(aria.valid).toBe(true);
  });
});
