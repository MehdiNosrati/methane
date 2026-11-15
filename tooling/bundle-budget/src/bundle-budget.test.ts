import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  checkBundleBudgets,
  compressSizes,
  measureBundleBytes,
  measureComponentBudget,
} from './index.js';

const tempDirs: string[] = [];

function createTempFixture(): { dir: string; entry: string; sharedPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'methane-budget-'));
  tempDirs.push(dir);

  const sharedPath = join(dir, 'shared-runtime.js');
  writeFileSync(
    sharedPath,
    `
export function createSharedCoordinator(name) {
  const items = new Map();
  return {
    register(key, value) { items.set(name + ':' + key, value); },
    lookup(key) { return items.get(name + ':' + key) ?? null; },
    size() { return items.size; },
    clear() { items.clear(); },
  };
}
export const SHARED_CONSTANTS = Array.from({ length: 64 }, (_, i) => 'token-' + i + '-value').join('|');
`,
    'utf8',
  );

  const entry = join(dir, 'component.js');
  writeFileSync(
    entry,
    `
import { createSharedCoordinator, SHARED_CONSTANTS } from './shared-runtime.js';
export function mountWidget() {
  const coord = createSharedCoordinator('widget');
  coord.register('label', SHARED_CONSTANTS);
  return coord.lookup('label');
}
`,
    'utf8',
  );

  return { dir, entry, sharedPath };
}

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('@methane-ui/bundle-budget', () => {
  it('measures cold standalone brotli and marginal brotli sizes via esbuild + zlib.brotliCompressSync', async () => {
    const { entry } = createTempFixture();

    const cold = await measureBundleBytes(entry);
    const marginal = await measureBundleBytes(entry, { external: ['./shared-runtime.js'] });

    expect(cold.rawBytes).toBeGreaterThan(marginal.rawBytes);
    expect(cold.brotliBytes).toBeGreaterThan(marginal.brotliBytes);
    expect(cold.brotliBytes).toBeGreaterThan(0);
    expect(marginal.brotliBytes).toBeGreaterThan(0);
  });

  it('evaluates cold and marginal budget thresholds and formats Markdown table', async () => {
    const { entry } = createTempFixture();

    const passing = await measureComponentBudget({
      name: 'mth-widget',
      entryPoint: entry,
      sharedExternals: ['./shared-runtime.js'],
      maxColdBrotliBytes: 5000,
      maxMarginalBrotliBytes: 1000,
    });
    expect(passing.passed).toBe(true);
    expect(passing.violations).toHaveLength(0);

    const failingReport = await checkBundleBudgets([
      {
        name: 'mth-widget',
        entryPoint: entry,
        sharedExternals: ['./shared-runtime.js'],
        maxColdBrotliBytes: 10,
        maxMarginalBrotliBytes: 5,
      },
    ]);
    expect(failingReport.passed).toBe(false);
    expect(failingReport.results[0]?.violations).toHaveLength(2);
    expect(failingReport.markdown).toContain('| `mth-widget` |');
    expect(failingReport.markdown).toContain('Cold Standalone (Brotli)');
  });

  it('compressSizes computes raw, gzip, and brotli metrics', () => {
    const sample = Buffer.from('export const x = "hello methane world ".repeat(10);', 'utf8');
    const metrics = compressSizes(sample);
    expect(metrics.rawBytes).toBe(sample.byteLength);
    expect(metrics.gzipBytes).toBeGreaterThan(0);
    expect(metrics.brotliBytes).toBeGreaterThan(0);
  });
});
