#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { dtcgSource } from '@methane/tokens';
import {
  DEFAULT_BEHAVIOR_SPECS,
  DEFAULT_CEM_FIXTURE,
  hasWorkspaceManifests,
  loadWorkspaceManifestAndSpecs,
} from '@methane/wrapper-codegen';
import { generateCodeConnectFiles } from './code-connect.js';
import { dtcgToFigmaVariables } from './variables.js';

interface ParsedArgs {
  rootDir: string;
  outDir?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { rootDir: process.cwd() };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--root' && next) {
      parsed.rootDir = next;
      i += 1;
    } else if (arg === '--out' && next) {
      parsed.outDir = next;
      i += 1;
    }
  }
  return parsed;
}

const args = parseArgs(process.argv.slice(2));
const rootDir = resolve(args.rootDir);
const outDir = resolve(rootDir, args.outDir ?? 'tooling/figma-sync/generated');

const input = hasWorkspaceManifests(rootDir)
  ? loadWorkspaceManifestAndSpecs(rootDir)
  : { manifest: DEFAULT_CEM_FIXTURE, specs: DEFAULT_BEHAVIOR_SPECS };

const codeConnectFiles = generateCodeConnectFiles(input);
const figmaVariables = dtcgToFigmaVariables(dtcgSource);

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}
mkdirSync(outDir, { recursive: true });

for (const file of codeConnectFiles) {
  const absPath = resolve(outDir, file.path);
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, file.content, 'utf8');
}

writeFileSync(
  resolve(outDir, 'figma-variables.json'),
  JSON.stringify(figmaVariables, null, 2) + '\n',
  'utf8',
);

process.stdout.write(
  `Generated ${codeConnectFiles.length} Code Connect files and figma-variables.json.\n`,
);
