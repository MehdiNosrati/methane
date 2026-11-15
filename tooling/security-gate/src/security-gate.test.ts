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

describe('@methane-ui/security-gate', () => {
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

  it('enforces ADR-007 workspace package hygiene (no dual dep+peerDep, strict ^X.Y.Z peers, uniform versions, public-depends-on-private, README.md >= 300B)', () => {
    const realAudit = auditWorkspacePackages();
    expect(realAudit.totalManifests).toBeGreaterThanOrEqual(45);
    expect(realAudit.publishableCount).toBe(35);
    expect(realAudit.violations).toEqual([]);
    expect(realAudit.passed).toBe(true);

    const fakeWs = makeTempDir();
    writeFileSync(join(fakeWs, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n  - 'tooling/*'\n", 'utf8');
    writeFileSync(
      join(fakeWs, 'package.json'),
      JSON.stringify({
        name: 'bad-root',
        private: true,
        pnpm: { peerDependencyRules: { allowedVersions: { '@methane-ui/core': '*' } } },
      }),
      'utf8',
    );
    mkdirSync(join(fakeWs, 'tooling/internal-tool'), { recursive: true });
    writeFileSync(
      join(fakeWs, 'tooling/internal-tool/package.json'),
      JSON.stringify({
        name: '@methane-ui/internal-tool',
        version: '0.1.0',
        private: true,
      }),
      'utf8',
    );
    mkdirSync(join(fakeWs, 'packages/bad-pkg'), { recursive: true });
    writeFileSync(
      join(fakeWs, 'packages/bad-pkg/package.json'),
      JSON.stringify({
        name: '@methane-ui/bad-pkg',
        version: '1.0.0',
        dependencies: {
          '@methane-ui/core': 'workspace:^',
          '@methane-ui/internal-tool': 'workspace:^',
        },
        peerDependencies: { '@methane-ui/core': '^0.1.0 || ^1.0.0' },
      }),
      'utf8',
    );

    const badAudit = auditWorkspacePackages({ workspaceRoot: fakeWs, expectedVersion: '0.1.0' });
    expect(badAudit.passed).toBe(false);
    expect(badAudit.violations.map((v) => v.rule).sort()).toEqual([
      'duplicate-dep-and-peer',
      'forbidden-peer-dependency-rules',
      'invalid-methane-peer-range',
      'missing-readme',
      'public-depends-on-private',
      'publishable-core-dependency',
      'version-skew',
    ]);
  });

  it('infers uniform semver version and ^X.Y.Z peer range when expectedVersion is omitted, and rejects version skew or tag mismatch', () => {
    const fakeWs = makeTempDir();
    writeFileSync(join(fakeWs, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n", 'utf8');
    writeFileSync(
      join(fakeWs, 'package.json'),
      JSON.stringify({ name: 'ws-root', private: true }),
      'utf8',
    );
    const readmeBody = 'x'.repeat(350);
    for (const [dirName, pkgName, ver] of [
      ['pkg-a', '@methane-ui/pkg-a', '0.2.0'],
      ['pkg-b', '@methane-ui/pkg-b', '0.2.0'],
    ]) {
      mkdirSync(join(fakeWs, 'packages', dirName), { recursive: true });
      writeFileSync(
        join(fakeWs, 'packages', dirName, 'package.json'),
        JSON.stringify({
          name: pkgName,
          version: ver,
          peerDependencies: dirName === 'pkg-b' ? { '@methane-ui/pkg-a': '^0.2.0' } : undefined,
        }),
        'utf8',
      );
      writeFileSync(join(fakeWs, 'packages', dirName, 'README.md'), readmeBody, 'utf8');
    }

    // Uniform 0.2.0 infers cleanly when expectedVersion is omitted
    const inferredOk = auditWorkspacePackages({ workspaceRoot: fakeWs });
    expect(inferredOk.passed).toBe(true);
    expect(inferredOk.publishableCount).toBe(2);

    // Explicit expectedVersion or METHANE_EXPECTED_VERSION mismatch fails
    const explicitMismatch = auditWorkspacePackages({ workspaceRoot: fakeWs, expectedVersion: '0.3.0' });
    expect(explicitMismatch.passed).toBe(false);
    expect(explicitMismatch.violations.some((v) => v.rule === 'version-skew')).toBe(true);
    expect(explicitMismatch.violations.some((v) => v.rule === 'invalid-methane-peer-range')).toBe(true);

    const prevEnv = process.env['METHANE_EXPECTED_VERSION'];
    try {
      process.env['METHANE_EXPECTED_VERSION'] = '0.3.0';
      const envMismatch = auditWorkspacePackages({ workspaceRoot: fakeWs });
      expect(envMismatch.passed).toBe(false);
      expect(envMismatch.violations.filter((v) => v.rule === 'version-skew')).toHaveLength(2);

      process.env['METHANE_EXPECTED_VERSION'] = '0.2.0';
      const envMatch = auditWorkspacePackages({ workspaceRoot: fakeWs });
      expect(envMatch.passed).toBe(true);
    } finally {
      if (prevEnv === undefined) {
        delete process.env['METHANE_EXPECTED_VERSION'];
      } else {
        process.env['METHANE_EXPECTED_VERSION'] = prevEnv;
      }
    }

    // Skew between two publishable packages without expectedVersion is also caught
    writeFileSync(
      join(fakeWs, 'packages/pkg-b/package.json'),
      JSON.stringify({
        name: '@methane-ui/pkg-b',
        version: '0.2.1',
        peerDependencies: { '@methane-ui/pkg-a': '^0.2.0' },
      }),
      'utf8',
    );
    const skewAudit = auditWorkspacePackages({ workspaceRoot: fakeWs });
    expect(skewAudit.passed).toBe(false);
    expect(skewAudit.violations.map((v) => v.rule)).toEqual(['version-skew']);
  });

  it('forbids publishable packages from depending on private workspace packages in dependencies or peerDependencies while allowing devDependencies', () => {
    const fakeWs = makeTempDir();
    writeFileSync(join(fakeWs, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n  - 'tooling/*'\n", 'utf8');
    writeFileSync(
      join(fakeWs, 'package.json'),
      JSON.stringify({ name: 'ws-root', private: true }),
      'utf8',
    );
    mkdirSync(join(fakeWs, 'tooling/priv'), { recursive: true });
    writeFileSync(
      join(fakeWs, 'tooling/priv/package.json'),
      JSON.stringify({ name: '@methane-ui/priv', version: '0.1.0', private: true }),
      'utf8',
    );
    mkdirSync(join(fakeWs, 'packages/pub'), { recursive: true });
    writeFileSync(join(fakeWs, 'packages/pub/README.md'), 'x'.repeat(350), 'utf8');

    // Allowed in devDependencies
    writeFileSync(
      join(fakeWs, 'packages/pub/package.json'),
      JSON.stringify({
        name: '@methane-ui/pub',
        version: '0.1.0',
        devDependencies: { '@methane-ui/priv': 'workspace:^' },
      }),
      'utf8',
    );
    expect(auditWorkspacePackages({ workspaceRoot: fakeWs }).passed).toBe(true);

    // Forbidden in peerDependencies
    writeFileSync(
      join(fakeWs, 'packages/pub/package.json'),
      JSON.stringify({
        name: '@methane-ui/pub',
        version: '0.1.0',
        peerDependencies: { '@methane-ui/priv': '^0.1.0' },
      }),
      'utf8',
    );
    const peerBad = auditWorkspacePackages({ workspaceRoot: fakeWs });
    expect(peerBad.passed).toBe(false);
    expect(peerBad.violations.map((v) => v.rule)).toEqual(['public-depends-on-private']);

    // Forbidden in dependencies
    writeFileSync(
      join(fakeWs, 'packages/pub/package.json'),
      JSON.stringify({
        name: '@methane-ui/pub',
        version: '0.1.0',
        dependencies: { '@methane-ui/priv': 'workspace:^' },
      }),
      'utf8',
    );
    const depBad = auditWorkspacePackages({ workspaceRoot: fakeWs });
    expect(depBad.passed).toBe(false);
    expect(depBad.violations.map((v) => v.rule)).toEqual(['public-depends-on-private']);
  });
});
