import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';
import * as esbuild from 'esbuild';

export interface BundleSizeMetrics {
  readonly rawBytes: number;
  readonly gzipBytes: number;
  readonly brotliBytes: number;
}

export interface BundleMeasureOptions {
  readonly external?: ReadonlyArray<string>;
  readonly target?: string;
  readonly platform?: 'browser' | 'neutral' | 'node';
  readonly define?: Readonly<Record<string, string>>;
  readonly stdin?: {
    readonly contents: string;
    readonly resolveDir: string;
    readonly loader?: 'js' | 'ts';
  };
}

export interface BundleBudgetTarget {
  readonly name: string;
  readonly entryPoint: string;
  readonly stdin?: {
    readonly contents: string;
    readonly resolveDir: string;
    readonly loader?: 'js' | 'ts';
  };
  readonly sharedExternals?: ReadonlyArray<string>;
  readonly maxColdRawBytes?: number;
  readonly maxColdGzipBytes?: number;
  readonly maxColdBrotliBytes?: number;
  readonly maxMarginalRawBytes?: number;
  readonly maxMarginalGzipBytes?: number;
  readonly maxMarginalBrotliBytes?: number;
  readonly define?: Readonly<Record<string, string>>;
}

export interface ComponentBudgetResult {
  readonly name: string;
  readonly entryPoint: string;
  readonly cold: BundleSizeMetrics;
  readonly marginal: BundleSizeMetrics;
  readonly passed: boolean;
  readonly violations: ReadonlyArray<string>;
}

export interface BudgetReport {
  readonly passed: boolean;
  readonly results: ReadonlyArray<ComponentBudgetResult>;
  readonly markdown: string;
}

export const DEFAULT_SHARED_EXTERNALS: ReadonlyArray<string> = [
  'lit',
  'lit/*',
  '@lit/*',
  '@methane-ui/core',
  '@methane-ui/core/*',
  '@methane-ui/primitives',
  '@methane-ui/primitives/*',
  '@methane-ui/sanitize',
];

export function compressSizes(buffer: Uint8Array): BundleSizeMetrics {
  const brotli = brotliCompressSync(buffer, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
    },
  });
  const gzip = gzipSync(buffer, { level: 9 });
  return {
    rawBytes: buffer.byteLength,
    gzipBytes: gzip.byteLength,
    brotliBytes: brotli.byteLength,
  };
}

export async function measureBundleBytes(
  entryPoint: string,
  options?: BundleMeasureOptions,
): Promise<BundleSizeMetrics> {
  const result = await esbuild.build({
    ...(options?.stdin ? { stdin: options.stdin } : { entryPoints: [entryPoint] }),
    bundle: true,
    minify: true,
    treeShaking: true,
    format: 'esm',
    platform: options?.platform ?? 'browser',
    target: options?.target ?? 'es2023',
    write: false,
    external: options?.external ? [...options.external] : [],
    define: {
      'process.env.NODE_ENV': '"production"',
      __DEV__: 'false',
      ...(options?.define ?? {}),
    },
  });

  const output = result.outputFiles?.[0];
  if (!output) {
    throw new Error(`esbuild produced no output for "${entryPoint}"`);
  }
  return compressSizes(output.contents);
}

export async function measureComponentBudget(
  target: BundleBudgetTarget,
): Promise<ComponentBudgetResult> {
  const sharedExternals = target.sharedExternals ?? DEFAULT_SHARED_EXTERNALS;
  const baseOptions: BundleMeasureOptions = {
    ...(target.define !== undefined ? { define: target.define } : {}),
    ...(target.stdin !== undefined ? { stdin: target.stdin } : {}),
  };

  const [cold, marginal] = await Promise.all([
    measureBundleBytes(target.entryPoint, baseOptions),
    measureBundleBytes(target.entryPoint, { ...baseOptions, external: sharedExternals }),
  ]);

  const violations: string[] = [];
  if (
    target.maxColdRawBytes !== undefined &&
    cold.rawBytes > target.maxColdRawBytes
  ) {
    violations.push(
      `Cold raw ${cold.rawBytes} B exceeds budget ${target.maxColdRawBytes} B`,
    );
  }
  if (
    target.maxColdGzipBytes !== undefined &&
    cold.gzipBytes > target.maxColdGzipBytes
  ) {
    violations.push(
      `Cold gzip ${cold.gzipBytes} B exceeds budget ${target.maxColdGzipBytes} B`,
    );
  }
  if (
    target.maxColdBrotliBytes !== undefined &&
    cold.brotliBytes > target.maxColdBrotliBytes
  ) {
    violations.push(
      `Cold brotli ${cold.brotliBytes} B exceeds budget ${target.maxColdBrotliBytes} B`,
    );
  }
  if (
    target.maxMarginalRawBytes !== undefined &&
    marginal.rawBytes > target.maxMarginalRawBytes
  ) {
    violations.push(
      `Marginal raw ${marginal.rawBytes} B exceeds budget ${target.maxMarginalRawBytes} B`,
    );
  }
  if (
    target.maxMarginalGzipBytes !== undefined &&
    marginal.gzipBytes > target.maxMarginalGzipBytes
  ) {
    violations.push(
      `Marginal gzip ${marginal.gzipBytes} B exceeds budget ${target.maxMarginalGzipBytes} B`,
    );
  }
  if (
    target.maxMarginalBrotliBytes !== undefined &&
    marginal.brotliBytes > target.maxMarginalBrotliBytes
  ) {
    violations.push(
      `Marginal brotli ${marginal.brotliBytes} B exceeds budget ${target.maxMarginalBrotliBytes} B`,
    );
  }

  return {
    name: target.name,
    entryPoint: target.entryPoint,
    cold,
    marginal,
    passed: violations.length === 0,
    violations,
  };
}

export function formatBundleBudgetMarkdown(
  results: ReadonlyArray<ComponentBudgetResult>,
): string {
  const rows = results
    .map((r) => {
      const status = r.passed ? 'PASS' : `FAIL (${r.violations.join('; ')})`;
      return `| \`${r.name}\` | ${r.cold.brotliBytes} B | ${r.marginal.brotliBytes} B | ${r.cold.rawBytes} B | ${status} |`;
    })
    .join('\n');

  return [
    '| Component | Cold Standalone (Brotli) | Marginal (Brotli) | Cold Minified | Status |',
    '| :--- | ---: | ---: | ---: | :--- |',
    rows,
    '',
  ].join('\n');
}

export async function checkBundleBudgets(
  targets: ReadonlyArray<BundleBudgetTarget>,
): Promise<BudgetReport> {
  const results = await Promise.all(targets.map((t) => measureComponentBudget(t)));
  const passed = results.every((r) => r.passed);
  const markdown = formatBundleBudgetMarkdown(results);
  return { passed, results, markdown };
}
