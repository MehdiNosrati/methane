import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { parseCliArgs, runCli } from '../cli.js';
import { createUnifiedDiff } from '../diff.js';
import { parseMigrationManifest } from '../manifest.js';
import { runCodemod } from '../runner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, 'fixtures');
const PACKAGE_ROOT = resolve(__dirname, '../..');

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'methane-codemod-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('@methane-ui/codemod diff, fixtures & CLI', () => {
  it('generates unified diffs and returns empty string when unchanged', () => {
    expect(createUnifiedDiff('a.html', '<mth-button></mth-button>', '<mth-button></mth-button>')).toBe('');

    const diff = createUnifiedDiff(
      'src/app.html',
      '<div>\n  <mth-button kind="primary">Hi</mth-button>\n</div>\n',
      '<div>\n  <app-button variant="solid">Hi</app-button>\n</div>\n',
    );
    expect(diff).toContain('--- a/src/app.html');
    expect(diff).toContain('+++ b/src/app.html');
    expect(diff).toContain('-  <mth-button kind="primary">Hi</mth-button>');
    expect(diff).toContain('+  <app-button variant="solid">Hi</app-button>');
  });

  it('migrates HTML, CSS, and TS fixtures via --manifest with --dry-run diff preview and idempotent write', () => {
    const tmp = makeTempDir();
    const manifestJson = readFileSync(join(FIXTURES_DIR, 'manifest.json'), 'utf8');
    const pageIn = readFileSync(join(FIXTURES_DIR, 'page.input.html'), 'utf8');
    const pageExpected = readFileSync(join(FIXTURES_DIR, 'page.expected.html'), 'utf8');
    const themeIn = readFileSync(join(FIXTURES_DIR, 'theme.input.css'), 'utf8');
    const themeExpected = readFileSync(join(FIXTURES_DIR, 'theme.expected.css'), 'utf8');
    const appIn = readFileSync(join(FIXTURES_DIR, 'app.input.ts'), 'utf8');
    const appExpected = readFileSync(join(FIXTURES_DIR, 'app.expected.ts'), 'utf8');

    writeFileSync(join(tmp, 'manifest.json'), manifestJson, 'utf8');
    writeFileSync(join(tmp, 'page.html'), pageIn, 'utf8');
    writeFileSync(join(tmp, 'theme.css'), themeIn, 'utf8');
    writeFileSync(join(tmp, 'app.ts'), appIn, 'utf8');

    // 1. Dry-run via CLI previews diffs without modifying files on disk
    let stdout = '';
    let stderr = '';
    const dryCode = runCli(
      ['--manifest', 'manifest.json', '--dry-run', '.'],
      {
        stdout: (t) => {
          stdout += t;
        },
        stderr: (t) => {
          stderr += t;
        },
      },
      tmp,
    );

    expect(stderr).toBe('');
    expect(dryCode).toBe(0);
    expect(stdout).toContain('--- a/page.html');
    expect(stdout).toContain('--- a/theme.css');
    expect(stdout).toContain('--- a/app.ts');
    expect(stdout).toContain('[dry-run] Processed 3 file(s): 3 changed');

    // Disk files untouched during --dry-run
    expect(readFileSync(join(tmp, 'page.html'), 'utf8')).toBe(pageIn);
    expect(readFileSync(join(tmp, 'theme.css'), 'utf8')).toBe(themeIn);
    expect(readFileSync(join(tmp, 'app.ts'), 'utf8')).toBe(appIn);

    // 2. --check returns exit code 1 when pending changes exist
    const checkBefore = runCli(
      ['--manifest', 'manifest.json', '--check', '--json', '.'],
      { stdout: () => {}, stderr: () => {} },
      tmp,
    );
    expect(checkBefore).toBe(1);

    // 3. Apply writes and compare exact fixture outputs
    let writeOut = '';
    const applyCode = runCli(
      ['--manifest', 'manifest.json', '.'],
      {
        stdout: (t) => {
          writeOut += t;
        },
        stderr: () => {},
      },
      tmp,
    );
    expect(applyCode).toBe(0);
    expect(writeOut).toContain('Processed 3 file(s): 3 changed');
    expect(readFileSync(join(tmp, 'page.html'), 'utf8')).toBe(pageExpected);
    expect(readFileSync(join(tmp, 'theme.css'), 'utf8')).toBe(themeExpected);
    expect(readFileSync(join(tmp, 'app.ts'), 'utf8')).toBe(appExpected);

    // 4. Re-running is strictly idempotent (--check exits 0, 0 changed files)
    let jsonOut = '';
    const checkAfter = runCli(
      ['--manifest', 'manifest.json', '--check', '--json', '.'],
      {
        stdout: (t) => {
          jsonOut += t;
        },
        stderr: () => {},
      },
      tmp,
    );
    expect(checkAfter).toBe(0);
    const parsedReport = JSON.parse(jsonOut) as { changedFiles: number; totalEdits: number };
    expect(parsedReport.changedFiles).toBe(0);
    expect(parsedReport.totalEdits).toBe(0);
  });

  it('supports direct --to-prefix and --to-token-prefix CLI flags and runCodemod API', () => {
    const tmp = makeTempDir();
    writeFileSync(
      join(tmp, 'card.html'),
      '<mth-card style="--mth-radius-md: 8px"><mth-button>Go</mth-button></mth-card>',
      'utf8',
    );

    const parsed = parseCliArgs(['--to-prefix=acme-', '--to-token-prefix', '--acme-', '--dry-run', 'card.html']);
    expect(parsed.toPrefix).toBe('acme-');
    expect(parsed.toTokenPrefix).toBe('--acme-');
    expect(parsed.dryRun).toBe(true);

    let out = '';
    const code = runCli(
      ['--to-prefix', 'acme-', '--to-token-prefix', '--acme-', 'card.html'],
      {
        stdout: (t) => {
          out += t;
        },
        stderr: () => {},
      },
      tmp,
    );
    expect(code).toBe(0);
    expect(out).toContain('1 changed');
    expect(readFileSync(join(tmp, 'card.html'), 'utf8')).toBe(
      '<acme-card style="--acme-radius-md: 8px"><acme-button>Go</acme-button></acme-card>',
    );

    const manifest = parseMigrationManifest(readFileSync(join(FIXTURES_DIR, 'manifest.json'), 'utf8'));
    const report = runCodemod({ targets: ['card.html'], manifest, dryRun: true, cwd: tmp });
    expect(report.totalFiles).toBe(1);
    expect(report.changedFiles).toBe(0);
  });

  it('handles --help, --version, invalid options, and built CLI binary execution', () => {
    let helpOut = '';
    expect(
      runCli(['--help'], { stdout: (t) => (helpOut += t), stderr: () => {} }),
    ).toBe(0);
    expect(helpOut).toContain('methane-codemod');
    expect(helpOut).toContain('--dry-run');

    let verOut = '';
    expect(
      runCli(['--version'], { stdout: (t) => (verOut += t), stderr: () => {} }),
    ).toBe(0);
    expect(verOut.trim()).toBe('0.1.1');

    let errOut = '';
    expect(
      runCli(['--unknown-flag'], { stdout: () => {}, stderr: (t) => (errOut += t) }),
    ).toBe(1);
    expect(errOut).toContain('Unknown option');

    const distCli = resolve(PACKAGE_ROOT, 'dist/cli.js');
    if (existsSync(distCli)) {
      const res = spawnSync(process.execPath, [distCli, '--version'], { encoding: 'utf8' });
      expect(res.status).toBe(0);
      expect(res.stdout.trim()).toBe('0.1.1');
    }
  });
});
