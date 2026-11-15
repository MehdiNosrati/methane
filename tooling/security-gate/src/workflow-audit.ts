import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export interface WorkflowFinding {
  readonly file: string;
  readonly rule: string;
  readonly message: string;
}

export interface WorkflowAuditResult {
  readonly passed: boolean;
  readonly workflowsDir: string;
  readonly filesChecked: ReadonlyArray<string>;
  readonly findings: ReadonlyArray<WorkflowFinding>;
}

function findWorkflowsDir(startDir = process.cwd()): string {
  let current = resolve(startDir);
  for (let i = 0; i < 12; i++) {
    const candidate = join(current, '.github', 'workflows');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return resolve(startDir, '.github', 'workflows');
}

function hasDuplicatePnpmVersion(yamlText: string): boolean {
  const lines = yamlText.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/uses:\s*pnpm\/action-setup@/.test(line)) {
      const baseIndent = line.search(/\S/);
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j] ?? '';
        if (next.trim() === '' || next.trim().startsWith('#')) continue;
        const nextIndent = next.search(/\S/);
        if (nextIndent <= baseIndent && !next.trim().startsWith('-')) break;
        if (/^\s*-\s+name:/.test(next)) break;
        if (/^\s*version\s*:/.test(next)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Validates all `.github/workflows/*.yml` files for CI/supply-chain hygiene:
 * - No `pnpm/action-setup` step specifies `version:` (must use `packageManager` from `package.json`)
 * - Any `permissions:` block uses least-privilege (`contents: read` or explicit scopes, never `write-all`)
 * - `release.yml` enforces Sigstore npm provenance (`id-token: write`, `NPM_CONFIG_PROVENANCE: 'true'`, `--provenance`, `--access public`, `@methane-ui/bundle-budget`, `--frozen-lockfile`, and `dry_run`)
 */
export function auditWorkflowFiles(workflowsDir = findWorkflowsDir()): WorkflowAuditResult {
  const resolvedDir = resolve(workflowsDir);
  const findings: WorkflowFinding[] = [];

  if (!existsSync(resolvedDir)) {
    findings.push({
      file: resolvedDir,
      rule: 'workflows-dir-exists',
      message: 'Workflows directory does not exist.',
    });
    return {
      passed: false,
      workflowsDir: resolvedDir,
      filesChecked: [],
      findings,
    };
  }

  const files = readdirSync(resolvedDir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort();

  for (const fileName of files) {
    const fullPath = join(resolvedDir, fileName);
    const content = readFileSync(fullPath, 'utf8');

    if (hasDuplicatePnpmVersion(content)) {
      findings.push({
        file: fileName,
        rule: 'no-duplicate-pnpm-version',
        message:
          'pnpm/action-setup must not specify `with: version:`; let it read `packageManager` from root package.json.',
      });
    }

    if (/permissions\s*:\s*write-all/i.test(content)) {
      findings.push({
        file: fileName,
        rule: 'pinned-permissions',
        message: 'Workflow must not grant broad `permissions: write-all`.',
      });
    }

    if (content.includes('pnpm install') && !content.includes('pnpm install --frozen-lockfile')) {
      findings.push({
        file: fileName,
        rule: 'frozen-lockfile',
        message: 'Workflow must run `pnpm install --frozen-lockfile`.',
      });
    }

    if (fileName === 'ci.yml') {
      if (!content.includes("git diff --exit-code -- '**/custom-elements.json'")) {
        findings.push({
          file: fileName,
          rule: 'ci-cem-drift-check',
          message:
            "ci.yml must run `git diff --exit-code -- '**/custom-elements.json'` after building to catch CEM manifest drift.",
        });
      }
    }

    if (fileName === 'release.yml') {
      if (!/permissions\s*:/.test(content)) {
        findings.push({
          file: fileName,
          rule: 'release-pinned-permissions',
          message: 'release.yml must declare explicit `permissions:`.',
        });
      }
      if (!/contents\s*:\s*(?:read|write)/.test(content) || !/id-token\s*:\s*write/.test(content)) {
        findings.push({
          file: fileName,
          rule: 'release-oidc-permissions',
          message:
            'release.yml must pin `contents: read` or `contents: write` and `id-token: write` for Sigstore OIDC.',
        });
      }
      if (!/NPM_CONFIG_PROVENANCE\s*:\s*['"]?true['"]?/.test(content)) {
        findings.push({
          file: fileName,
          rule: 'release-provenance-env',
          message: 'release.yml must set `NPM_CONFIG_PROVENANCE: true`.',
        });
      }
      if (!content.includes('--provenance') || !content.includes('--access public')) {
        findings.push({
          file: fileName,
          rule: 'release-publish-flags',
          message: 'release.yml publish step must pass `--provenance --access public`.',
        });
      }
      if (!content.includes('registry.npmjs.org')) {
        findings.push({
          file: fileName,
          rule: 'release-registry-url',
          message: 'release.yml must configure `registry-url: https://registry.npmjs.org`.',
        });
      }
      if (!content.includes('bundle-budget')) {
        findings.push({
          file: fileName,
          rule: 'release-bundle-budget',
          message: 'release.yml must run `@methane-ui/bundle-budget` before publishing.',
        });
      }
      if (!content.includes('dry_run') || !content.includes('--dry-run')) {
        findings.push({
          file: fileName,
          rule: 'release-dry-run',
          message: 'release.yml must support `workflow_dispatch` `dry_run` mode.',
        });
      }
      if (
        /--filter\s+["']\.\/packages\/\*["']/.test(content) ||
        !content.includes('./packages/**') ||
        !content.includes('./tooling/*')
      ) {
        findings.push({
          file: fileName,
          rule: 'release-nested-package-filter',
          message:
            'release.yml must filter `./packages/**` and `./tooling/*` (never shallow `./packages/*`) so nested kits, satellites, and tooling publish.',
        });
      }
      const hasPlaywrightBrowsers =
        /playwright\s+install\b[^\n]*\bchromium\b[^\n]*\bwebkit\b/.test(content) ||
        (/playwright\s+install\b/.test(content) &&
          content.includes('chromium') &&
          content.includes('webkit'));
      if (!hasPlaywrightBrowsers || !/\bpnpm\s+test:e2e\b/.test(content)) {
        findings.push({
          file: fileName,
          rule: 'release-browser-e2e',
          message:
            'release.yml must install Playwright `chromium` and `webkit` browsers and run `pnpm test:e2e` before publishing.',
        });
      }
      if (
        !content.includes('METHANE_EXPECTED_VERSION') ||
        !content.includes('GITHUB_REF_NAME') ||
        !content.includes('auditWorkspacePackages')
      ) {
        findings.push({
          file: fileName,
          rule: 'release-tag-version-parity',
          message:
            'release.yml must verify `GITHUB_REF_NAME` tag parity against package manifest versions via `METHANE_EXPECTED_VERSION` and `auditWorkspacePackages`.',
        });
      }
      if (
        content.includes('oidc/token/exchange') &&
        !content.includes('::add-mask::$TOKEN')
      ) {
        findings.push({
          file: fileName,
          rule: 'release-mask-exchanged-token',
          message:
            'release.yml must mask dynamically exchanged npm tokens with `echo "::add-mask::$TOKEN"` immediately after obtaining them.',
        });
      }
    }

    if (fileName === 'pages.yml') {
      if (!/permissions\s*:/.test(content) || !/pages\s*:\s*write/.test(content)) {
        findings.push({
          file: fileName,
          rule: 'pages-pinned-permissions',
          message: 'pages.yml must pin `pages: write` permission.',
        });
      }
    }
  }

  if (!files.includes('release.yml')) {
    findings.push({
      file: 'release.yml',
      rule: 'release-workflow-exists',
      message: 'Missing `.github/workflows/release.yml` Sigstore provenance workflow.',
    });
  }

  return {
    passed: findings.length === 0,
    workflowsDir: resolvedDir,
    filesChecked: files,
    findings,
  };
}
