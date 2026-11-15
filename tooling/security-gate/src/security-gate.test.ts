import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  auditDsdHtmlForCsp,
  auditWorkspaceLicenses,
  auditWorkspacePackages,
  evaluateLicenseExpression,
  runStrictCspSuite,
} from './index.js';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'methane-sec-gate-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('@methane/security-gate', () => {
  it('passes end-to-end strict CSP & Trusted Types compliance across sanitize, core, primitives, and ssr', async () => {
    const result = await runStrictCspSuite();

    expect(result.unexpectedViolations).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.createdPolicies).toContain('methane-sanitize');
    expect(result.createdPolicies).toContain('lit-html');
    expect(result.negativeControlsVerified).toEqual([
      'Element.innerHTML(string)',
      'Element.outerHTML(string)',
      'Element.insertAdjacentHTML(string)',
      'ShadowRoot.innerHTML(string)',
      'eval(string)',
      'new Function(string)',
      'trustedTypes.createPolicy(unauthorized)',
    ]);

    expect(result.linkedSsrAudit.passed).toBe(true);
    expect(result.linkedSsrAudit.templateCount).toBeGreaterThanOrEqual(2);
    expect(result.linkedSsrAudit.linkCount).toBeGreaterThanOrEqual(2);

    expect(result.inlineSsrAudit.passed).toBe(true);
    expect(result.inlineSsrAudit.templateCount).toBeGreaterThanOrEqual(2);
    expect(result.inlineSsrAudit.styleTagCount).toBeGreaterThanOrEqual(2);
  });

  it('flags inline style attributes, inline event handlers, and <script> tags in DSD HTML audit', () => {
    const badDsd = `
      <mth-bad style="color: red" onclick="alert(1)">
        <template shadowrootmode="open">
          <div style="display:block"><script>evil()</script></div>
          <a href="javascript:alert(1)">x</a>
        </template>
      </mth-bad>
    `;
    const audit = auditDsdHtmlForCsp(badDsd);
    expect(audit.passed).toBe(false);
    expect(audit.violations.some((v) => v.directive === 'style-src-attr')).toBe(true);
    expect(audit.violations.some((v) => v.directive === 'script-elem')).toBe(true);
    expect(audit.violations.some((v) => v.directive === 'script-src')).toBe(true);
  });

  it('audits all installed workspace & node_modules packages for ADR-013 permissive licenses', () => {
    const audit = auditWorkspaceLicenses();
    expect(audit.totalPackages).toBeGreaterThan(50);
    expect(audit.violations).toEqual([]);
    expect(audit.passed).toBe(true);
  });

  it('rejects GPL, AGPL, LGPL, SSPL, BUSL, Commons Clause, and missing licenses', () => {
    expect(evaluateLicenseExpression('MIT').permissive).toBe(true);
    expect(evaluateLicenseExpression('(MPL-2.0 OR Apache-2.0)').permissive).toBe(true);
    expect(evaluateLicenseExpression('(BSD-3-Clause OR GPL-2.0)').permissive).toBe(true);
    expect(evaluateLicenseExpression('(MIT OR GPL-3.0)').permissive).toBe(true);
    expect(evaluateLicenseExpression('(MIT AND GPL-3.0)').permissive).toBe(false);

    for (const bad of [
      'GPL-3.0',
      'GPL-2.0-only',
      'AGPL-3.0-or-later',
      'LGPL-2.1',
      'SSPL-1.0',
      'BUSL-1.1',
      'Apache-2.0 WITH Commons-Clause',
      'UNLICENSED',
      'MISSING',
    ]) {
      expect(evaluateLicenseExpression(bad).permissive, `Expected ${bad} to be rejected`).toBe(
        false,
      );
    }

    // Synthetic workspace test: private apps/* optional binaries are ignored by default,
    // while packages/** / tooling/** / root dependencies fail on copyleft licenses.
    const fakeWs = makeTempDir();
    writeFileSync(join(fakeWs, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n", 'utf8');
    mkdirSync(join(fakeWs, 'apps/docs/node_modules/@img/sharp-libvips-linux-x64'), {
      recursive: true,
    });
    writeFileSync(
      join(fakeWs, 'apps/docs/node_modules/@img/sharp-libvips-linux-x64/package.json'),
      JSON.stringify({
        name: '@img/sharp-libvips-linux-x64',
        version: '1.0.0',
        license: 'LGPL-3.0-or-later',
      }),
      'utf8',
    );
    expect(auditWorkspaceLicenses({ workspaceRoot: fakeWs }).passed).toBe(true);

    mkdirSync(join(fakeWs, 'node_modules/hyperformula'), { recursive: true });
    writeFileSync(
      join(fakeWs, 'node_modules/hyperformula/package.json'),
      JSON.stringify({ name: 'hyperformula', version: '2.0.0', license: 'GPL-3.0-only' }),
      'utf8',
    );
    const fakeAudit = auditWorkspaceLicenses({ workspaceRoot: fakeWs });
    expect(fakeAudit.passed).toBe(false);
    expect(fakeAudit.violations).toHaveLength(1);
    expect(fakeAudit.violations[0]?.name).toBe('hyperformula');
  });

  it('enforces ADR-007 workspace package hygiene (no dual dep+peerDep, strict ^0.1.0 peers, uniform 0.1.0 versions, README.md >= 300B)', () => {
    const realAudit = auditWorkspacePackages();
    expect(realAudit.totalManifests).toBeGreaterThanOrEqual(45);
    expect(realAudit.publishableCount).toBe(41);
    expect(realAudit.violations).toEqual([]);
    expect(realAudit.passed).toBe(true);

    const fakeWs = makeTempDir();
    writeFileSync(join(fakeWs, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n", 'utf8');
    mkdirSync(join(fakeWs, 'packages/bad-pkg'), { recursive: true });
    writeFileSync(
      join(fakeWs, 'packages/bad-pkg/package.json'),
      JSON.stringify({
        name: '@methane/bad-pkg',
        version: '1.0.0',
        dependencies: { '@methane/core': 'workspace:^' },
        peerDependencies: { '@methane/core': '^0.1.0 || ^1.0.0' },
      }),
      'utf8',
    );

    const badAudit = auditWorkspacePackages({ workspaceRoot: fakeWs });
    expect(badAudit.passed).toBe(false);
    expect(badAudit.violations.map((v) => v.rule).sort()).toEqual([
      'duplicate-dep-and-peer',
      'invalid-methane-peer-range',
      'missing-readme',
      'version-skew',
    ]);
  });
});
