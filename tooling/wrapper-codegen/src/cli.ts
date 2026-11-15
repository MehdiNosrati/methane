#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { generateAllWrappers } from './codegen.js';
import { DEFAULT_BEHAVIOR_SPECS, DEFAULT_CEM_FIXTURE } from './fixture.js';
import type { ExtendedCustomElementsManifest } from './types.js';

interface ParsedArgs {
  cemPath?: string;
  specsPath?: string;
  rootDir: string;
  write: boolean;
}

function parseCliArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    rootDir: process.cwd(),
    write: true,
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
    } else if (arg === '--dry-run') {
      parsed.write = false;
    }
  }

  return parsed;
}

const args = parseCliArgs(process.argv.slice(2));
const rootDir = resolve(args.rootDir);

const manifest: ExtendedCustomElementsManifest = args.cemPath
  ? (JSON.parse(readFileSync(resolve(rootDir, args.cemPath), 'utf8')) as ExtendedCustomElementsManifest)
  : DEFAULT_CEM_FIXTURE;

const specs: ReadonlyArray<ComponentBehaviorSpec> = args.specsPath
  ? (JSON.parse(readFileSync(resolve(rootDir, args.specsPath), 'utf8')) as ComponentBehaviorSpec[])
  : DEFAULT_BEHAVIOR_SPECS;

const result = generateAllWrappers(
  { manifest, specs },
  {
    write: args.write,
    reactDir: resolve(rootDir, 'packages/react/src'),
    vueDir: resolve(rootDir, 'packages/vue/src'),
    angularDir: resolve(rootDir, 'packages/angular/src'),
    svelteDir: resolve(rootDir, 'packages/svelte/src'),
    ideDir: resolve(rootDir, 'tooling/wrapper-codegen/ide'),
  },
);

process.stdout.write(
  `Generated wrappers for ${result.models.length} components (${result.writtenPaths.length} files written).\n`,
);
