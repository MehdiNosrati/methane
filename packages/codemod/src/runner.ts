import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { createUnifiedDiff } from './diff.js';
import { createEmptyStats, mergeStats } from './edits.js';
import { compileManifest, type CompiledManifest } from './manifest.js';
import { transformCss } from './transforms/css.js';
import { transformHtml } from './transforms/html.js';
import { collectTypeScriptEdits, transformTypeScript } from './transforms/typescript.js';
import type {
  CodemodRunOptions,
  CodemodRunReport,
  FileTransformReport,
  MigrationManifest,
  TransformLanguage,
  TransformOptions,
  TransformResult,
} from './types.js';

export const DEFAULT_EXTENSIONS: ReadonlyArray<string> = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.html',
  '.htm',
  '.vue',
  '.svelte',
  '.astro',
  '.css',
];

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.astro',
]);

export function detectLanguage(
  filePath?: string,
  explicit?: TransformLanguage,
): TransformLanguage {
  if (explicit) return explicit;
  if (!filePath) return 'typescript';
  const ext = extname(filePath).toLowerCase();
  if (ext === '.css' || ext === '.pcss' || ext === '.scss') return 'css';
  if (
    ext === '.html' ||
    ext === '.htm' ||
    ext === '.vue' ||
    ext === '.svelte' ||
    ext === '.astro' ||
    ext === '.svg'
  ) {
    return 'html';
  }
  return 'typescript';
}

/**
 * Transform an in-memory source string idempotently using the appropriate AST transformer.
 */
export function transformCode(
  source: string,
  manifest: MigrationManifest | CompiledManifest,
  options?: TransformOptions,
): TransformResult {
  const compiled = 'rewriteTag' in manifest ? manifest : compileManifest(manifest);
  const language = detectLanguage(options?.filePath, options?.language);
  const filePath = options?.filePath ?? (language === 'css' ? 'styles.css' : language === 'html' ? 'index.html' : 'index.tsx');

  let result: TransformResult;
  if (language === 'css') {
    result = transformCss(source, compiled);
  } else if (language === 'html') {
    result = transformHtml(source, compiled, {
      collectScriptEdits(scriptCode, comp, edits, stats, baseOffset) {
        collectTypeScriptEdits(scriptCode, comp, edits, stats, baseOffset, 'inline-script.ts');
      },
    });
  } else {
    result = transformTypeScript(source, compiled, filePath);
  }

  if (options?.includeDiff) {
    return {
      ...result,
      diff: result.changed ? createUnifiedDiff(filePath, source, result.code) : '',
    };
  }

  return result;
}

function collectFiles(
  targets: ReadonlyArray<string>,
  cwd: string,
  allowedExts: ReadonlySet<string>,
): string[] {
  const collected = new Set<string>();

  function walk(absPath: string): void {
    const st = statSync(absPath);
    if (st.isFile()) {
      const ext = extname(absPath).toLowerCase();
      if (allowedExts.has(ext)) {
        collected.add(absPath);
      }
      return;
    }
    if (st.isDirectory()) {
      const entries = readdirSync(absPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name)) continue;
          walk(resolve(absPath, entry.name));
        } else if (entry.isFile()) {
          const fileAbs = resolve(absPath, entry.name);
          if (allowedExts.has(extname(entry.name).toLowerCase())) {
            collected.add(fileAbs);
          }
        }
      }
    }
  }

  for (const target of targets) {
    walk(resolve(cwd, target));
  }

  return [...collected].sort();
}

/**
 * Run the Methane codemod across files and directories, supporting `--dry-run` diff preview.
 */
export function runCodemod(options: CodemodRunOptions): CodemodRunReport {
  const cwd = options.cwd ?? process.cwd();
  const dryRun = options.dryRun ?? false;
  const allowedExts = new Set(
    (options.extensions ?? DEFAULT_EXTENSIONS).map((e) => e.toLowerCase()),
  );
  const compiled = compileManifest(options.manifest);
  const absFiles = collectFiles(options.targets, cwd, allowedExts);

  const reports: FileTransformReport[] = [];
  let totalEdits = 0;
  let changedFiles = 0;
  let totalStats = createEmptyStats();

  for (const absPath of absFiles) {
    const relPath = relative(cwd, absPath) || absPath;
    const language = detectLanguage(absPath);
    const original = readFileSync(absPath, 'utf8');
    const result = transformCode(original, compiled, {
      filePath: relPath,
      language,
      includeDiff: true,
    });

    if (result.changed) {
      changedFiles += 1;
      totalEdits += result.editsCount;
      totalStats = mergeStats(totalStats, result.stats);
      if (!dryRun) {
        writeFileSync(absPath, result.code, 'utf8');
      }
    }

    reports.push({
      filePath: relPath,
      language,
      changed: result.changed,
      editsCount: result.editsCount,
      stats: result.stats,
      diff: result.diff ?? '',
    });
  }

  return {
    dryRun,
    totalFiles: reports.length,
    changedFiles,
    totalEdits,
    files: reports,
    stats: totalStats,
  };
}
