#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { generateAllWrappers } from './codegen.js';
import { DEFAULT_BEHAVIOR_SPECS, DEFAULT_CEM_FIXTURE } from './fixture.js';
import type { ExtendedCustomElementsManifest, GeneratedFile } from './types.js';
import { hasWorkspaceManifests, loadWorkspaceManifestAndSpecs } from './workspace.js';

type CodegenTarget = 'react' | 'vue' | 'angular' | 'svelte' | 'ide';

interface ParsedArgs {
  cemPath?: string;
  specsPath?: string;
  rootDir: string;
  write: boolean;
  check: boolean;
  workspace: boolean;
  only?: CodegenTarget;
}

function parseCliArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    rootDir: process.cwd(),
    write: true,
    check: false,
    workspace: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--cem' && next) {
      parsed.cemPath = next;
      i += 1;
    } else if (arg === '--specs' && next) {
      parsed.specsPath = next;
      i += 1;
    } else if (arg === '--root' && next) {
      parsed.rootDir = next;
      i += 1;
    } else if (arg === '--only' && next) {
      if (next === 'react' || next === 'vue' || next === 'angular' || next === 'svelte' || next === 'ide') {
        parsed.only = next;
      } else {
        throw new Error(`Invalid --only target "${next}". Expected react|vue|angular|svelte|ide.`);
      }
      i += 1;
    } else if (arg === '--dry-run') {
      parsed.write = false;
    } else if (arg === '--check') {
      parsed.check = true;
      parsed.write = false;
    } else if (arg === '--workspace') {
      parsed.workspace = true;
    }
  }

  return parsed;
}

function verifyGeneratedGroup(
  baseDir: string | undefined,
  files: ReadonlyArray<GeneratedFile>,
  mismatches: string[],
): number {
  if (!baseDir) return 0;
  for (const file of files) {
    const absPath = resolve(baseDir, file.path);
    if (!existsSync(absPath)) {
      mismatches.push(`Missing generated file: ${absPath}`);
      continue;
    }
    const actual = readFileSync(absPath, 'utf8');
    if (actual !== file.content) {
      mismatches.push(`Out-of-date generated file: ${absPath}`);
    }
  }
  return files.length;
}

const args = parseCliArgs(process.argv.slice(2));
const rootDir = resolve(args.rootDir);

let manifest: ExtendedCustomElementsManifest;
let specs: ReadonlyArray<ComponentBehaviorSpec>;

if (args.cemPath) {
  manifest = JSON.parse(
    readFileSync(resolve(rootDir, args.cemPath), 'utf8'),
  ) as ExtendedCustomElementsManifest;
  specs = args.specsPath
    ? (JSON.parse(readFileSync(resolve(rootDir, args.specsPath), 'utf8')) as ComponentBehaviorSpec[])
    : DEFAULT_BEHAVIOR_SPECS;
} else if (args.workspace || hasWorkspaceManifests(rootDir)) {
  const discovered = loadWorkspaceManifestAndSpecs(rootDir);
  manifest = discovered.manifest;
  specs = args.specsPath
    ? [
        ...discovered.specs,
        ...(JSON.parse(
          readFileSync(resolve(rootDir, args.specsPath), 'utf8'),
        ) as ComponentBehaviorSpec[]),
      ]
    : discovered.specs;
} else {
  manifest = DEFAULT_CEM_FIXTURE;
  specs = args.specsPath
    ? (JSON.parse(readFileSync(resolve(rootDir, args.specsPath), 'utf8')) as ComponentBehaviorSpec[])
    : DEFAULT_BEHAVIOR_SPECS;
}

const includeTarget = (target: CodegenTarget): boolean => !args.only || args.only === target;

const targetDirs = {
  ...(includeTarget('react') ? { reactDir: resolve(rootDir, 'packages/react/src') } : {}),
  ...(includeTarget('vue') ? { vueDir: resolve(rootDir, 'packages/vue/src') } : {}),
  ...(includeTarget('angular') ? { angularDir: resolve(rootDir, 'packages/angular/src') } : {}),
  ...(includeTarget('svelte') ? { svelteDir: resolve(rootDir, 'packages/svelte/src') } : {}),
  ...(includeTarget('ide') ? { ideDir: resolve(rootDir, 'tooling/wrapper-codegen/ide') } : {}),
};

const result = generateAllWrappers(
  { manifest, specs },
  {
    write: args.write,
    ...targetDirs,
  },
);

if (args.check) {
  const mismatches: string[] = [];
  let checkedCount = 0;
  checkedCount += verifyGeneratedGroup(targetDirs.reactDir, result.reactFiles, mismatches);
  checkedCount += verifyGeneratedGroup(targetDirs.vueDir, result.vueFiles, mismatches);
  checkedCount += verifyGeneratedGroup(targetDirs.angularDir, result.angularFiles, mismatches);
  checkedCount += verifyGeneratedGroup(targetDirs.svelteDir, result.svelteFiles, mismatches);
  checkedCount += verifyGeneratedGroup(targetDirs.ideDir, result.ideFiles, mismatches);

  if (mismatches.length > 0) {
    process.stderr.write(`Codegen check failed (${mismatches.length} mismatch(es)):\n`);
    for (const msg of mismatches.slice(0, 20)) {
      process.stderr.write(`  - ${msg}\n`);
    }
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Codegen check passed for ${result.models.length} components (${checkedCount} files verified).\n`,
    );
  }
} else {
  process.stdout.write(
    `Generated wrappers for ${result.models.length} components (${result.writtenPaths.length} files written).\n`,
  );
}
