import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditWorkflowFiles } from './index.js';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'methane-wf-audit-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('@methane-ui/security-gate GitHub workflows audit', () => {
  it('validates all repository .github/workflows/*.yml files pass security and provenance rules', () => {
    const result = auditWorkflowFiles();
    expect(result.filesChecked).toContain('ci.yml');
    expect(result.filesChecked).toContain('pages.yml');
    expect(result.filesChecked).toContain('release.yml');
    expect(result.findings).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('rejects duplicate pnpm version in setup-node/action-setup and missing provenance', () => {
    const dir = makeTempDir();
    writeFileSync(
      join(dir, 'ci.yml'),
      `name: CI
jobs:
  test:
    steps:
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - run: pnpm install
`,
      'utf8',
    );
    writeFileSync(
      join(dir, 'release.yml'),
      `name: Release
permissions: write-all
jobs:
  pub:
    steps:
      - run: pnpm publish
`,
      'utf8',
    );

    const audit = auditWorkflowFiles(dir);
    expect(audit.passed).toBe(false);
    const rules = audit.findings.map((f) => f.rule);
    expect(rules).toContain('no-duplicate-pnpm-version');
    expect(rules).toContain('frozen-lockfile');
    expect(rules).toContain('ci-cem-drift-check');
    expect(rules).toContain('pinned-permissions');
    expect(rules).toContain('release-oidc-permissions');
    expect(rules).toContain('release-provenance-env');
    expect(rules).toContain('release-publish-flags');
    expect(rules).toContain('release-nested-package-filter');
  });

  it('allows contents: write with id-token: write in release.yml and enforces CEM drift check in ci.yml', () => {
    const dir = makeTempDir();
    writeFileSync(
      join(dir, 'ci.yml'),
      `name: CI
jobs:
  verify:
    steps:
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm run codegen:check
`,
      'utf8',
    );
    writeFileSync(
      join(dir, 'release.yml'),
      `name: Release
permissions:
  contents: write
  id-token: write
env:
  NPM_CONFIG_PROVENANCE: 'true'
on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      dry_run:
        type: boolean
jobs:
  release:
    steps:
      - uses: actions/setup-node@v4
        with:
          registry-url: 'https://registry.npmjs.org'
      - run: echo "bundle-budget"
      - run: pnpm -r --filter "./packages/**" --filter "./tooling/*" --dry-run publish --provenance --access public
`,
      'utf8',
    );
    const audit = auditWorkflowFiles(dir);
    expect(audit.passed).toBe(false);
    expect(audit.findings.map((f) => f.rule)).toEqual(['ci-cem-drift-check']);
  });

  it('rejects shallow ./packages/* filter in release.yml that misses nested kits and satellites', () => {
    const dir = makeTempDir();
    writeFileSync(
      join(dir, 'release.yml'),
      `name: Release
permissions:
  contents: read
  id-token: write
env:
  NPM_CONFIG_PROVENANCE: 'true'
on:
  workflow_dispatch:
    inputs:
      dry_run:
        type: boolean
jobs:
  release:
    steps:
      - uses: actions/setup-node@v4
        with:
          registry-url: 'https://registry.npmjs.org'
      - run: echo "bundle-budget"
      - run: pnpm -r --filter "./packages/*" --dry-run publish --provenance --access public
`,
      'utf8',
    );
    const audit = auditWorkflowFiles(dir);
    expect(audit.passed).toBe(false);
    expect(audit.findings.map((f) => f.rule)).toContain('release-nested-package-filter');
  });
});
