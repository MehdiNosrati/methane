#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseMigrationManifest } from './manifest.js';
import { runCodemod } from './runner.js';
import type { MigrationManifest } from './types.js';

export const CLI_VERSION = '0.1.2';

export interface ParsedCliArgs {
  readonly targets: ReadonlyArray<string>;
  readonly manifestPath?: string;
  readonly fromPrefix: string;
  readonly toPrefix?: string;
  readonly fromTokenPrefix: string;
  readonly toTokenPrefix?: string;
  readonly dryRun: boolean;
  readonly check: boolean;
  readonly json: boolean;
  readonly help: boolean;
  readonly version: boolean;
}

export interface CliIo {
  stdout(text: string): void;
  stderr(text: string): void;
}

const HELP_TEXT = `methane-codemod v${CLI_VERSION}

Usage:
  methane-codemod [options] <paths...>

Options:
  -m, --manifest <file>           Path to JSON migration manifest
      --from-prefix <prefix>      Source element tag prefix (default: "mth-")
      --to-prefix <prefix>        Target element tag prefix (e.g. "acme-")
      --from-token-prefix <pref>  Source CSS token prefix (default: "--mth-")
      --to-token-prefix <pref>    Target CSS token prefix (e.g. "--acme-")
  -d, --dry-run                   Preview unified diffs without writing files
      --check                     Exit with code 1 if any file would change (implies --dry-run)
      --json                      Print JSON report instead of human diff output
  -h, --help                      Show this help message
  -v, --version                   Show CLI version
`;

export function parseCliArgs(argv: ReadonlyArray<string>): ParsedCliArgs {
  const targets: string[] = [];
  let manifestPath: string | undefined;
  let fromPrefix = 'mth-';
  let toPrefix: string | undefined;
  let fromTokenPrefix = '--mth-';
  let toTokenPrefix: string | undefined;
  let dryRun = false;
  let check = false;
  let json = false;
  let help = false;
  let version = false;

  function readValue(flag: string, idx: number, allowDoubleDash = false): string {
    const val = argv[idx + 1];
    if (val === undefined || (val.startsWith('-') && !(allowDoubleDash && val.startsWith('--')))) {
      throw new Error(`Missing value for option ${flag}`);
    }
    return val;
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '-h' || arg === '--help') {
      help = true;
    } else if (arg === '-v' || arg === '--version') {
      version = true;
    } else if (arg === '-d' || arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--check') {
      check = true;
      dryRun = true;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '-m' || arg === '--manifest') {
      manifestPath = readValue(arg, i);
      i += 1;
    } else if (arg.startsWith('--manifest=')) {
      manifestPath = arg.slice('--manifest='.length);
    } else if (arg === '--from-prefix') {
      fromPrefix = readValue(arg, i);
      i += 1;
    } else if (arg.startsWith('--from-prefix=')) {
      fromPrefix = arg.slice('--from-prefix='.length);
    } else if (arg === '--to-prefix') {
      toPrefix = readValue(arg, i);
      i += 1;
    } else if (arg.startsWith('--to-prefix=')) {
      toPrefix = arg.slice('--to-prefix='.length);
    } else if (arg === '--from-token-prefix') {
      fromTokenPrefix = readValue(arg, i, true);
      i += 1;
    } else if (arg.startsWith('--from-token-prefix=')) {
      fromTokenPrefix = arg.slice('--from-token-prefix='.length);
    } else if (arg === '--to-token-prefix') {
      toTokenPrefix = readValue(arg, i, true);
      i += 1;
    } else if (arg.startsWith('--to-token-prefix=')) {
      toTokenPrefix = arg.slice('--to-token-prefix='.length);
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      targets.push(arg);
    }
  }

  return {
    targets,
    ...(manifestPath !== undefined ? { manifestPath } : {}),
    fromPrefix,
    ...(toPrefix !== undefined ? { toPrefix } : {}),
    fromTokenPrefix,
    ...(toTokenPrefix !== undefined ? { toTokenPrefix } : {}),
    dryRun,
    check,
    json,
    help,
    version,
  };
}

function buildEffectiveManifest(parsed: ParsedCliArgs, cwd: string): MigrationManifest {
  let base: MigrationManifest = { version: '1.0.0' };
  if (parsed.manifestPath) {
    const raw = readFileSync(resolve(cwd, parsed.manifestPath), 'utf8');
    base = parseMigrationManifest(raw);
  }

  return {
    ...base,
    ...(parsed.toPrefix
      ? {
          tagPrefix: {
            fromPrefix: parsed.fromPrefix,
            toPrefix: parsed.toPrefix,
            ...(base.tagPrefix?.tags ? { tags: base.tagPrefix.tags } : {}),
          },
        }
      : {}),
    ...(parsed.toTokenPrefix
      ? {
          tokenPrefix: {
            fromPrefix: parsed.fromTokenPrefix,
            toPrefix: parsed.toTokenPrefix,
          },
        }
      : {}),
  };
}

export function runCli(
  argv: ReadonlyArray<string>,
  io: CliIo = {
    stdout: (t) => process.stdout.write(t),
    stderr: (t) => process.stderr.write(t),
  },
  cwd = process.cwd(),
): number {
  let parsed: ParsedCliArgs;
  try {
    parsed = parseCliArgs(argv);
  } catch (err) {
    io.stderr(`${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }

  if (parsed.help) {
    io.stdout(HELP_TEXT);
    return 0;
  }

  if (parsed.version) {
    io.stdout(`${CLI_VERSION}\n`);
    return 0;
  }

  if (parsed.targets.length === 0) {
    io.stderr('Error: at least one target file or directory path is required.\n');
    return 1;
  }

  let manifest: MigrationManifest;
  try {
    manifest = buildEffectiveManifest(parsed, cwd);
  } catch (err) {
    io.stderr(`${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }

  const report = runCodemod({
    targets: parsed.targets,
    manifest,
    dryRun: parsed.dryRun,
    cwd,
  });

  if (parsed.json) {
    io.stdout(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    if (parsed.dryRun) {
      for (const file of report.files) {
        if (file.changed && file.diff) {
          io.stdout(`${file.diff}\n`);
        }
      }
    }
    const mode = parsed.dryRun ? '[dry-run] ' : '';
    io.stdout(
      `${mode}Processed ${report.totalFiles} file(s): ${report.changedFiles} changed, ${report.totalEdits} edit(s).\n`,
    );
  }

  if (parsed.check && report.changedFiles > 0) {
    return 1;
  }

  return 0;
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  const code = runCli(process.argv.slice(2));
  process.exitCode = code;
}
