import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { generateAngularFiles } from './generators/angular.js';
import { generateIdeFiles } from './generators/ide.js';
import { generateReactFiles } from './generators/react.js';
import { generateSvelteFiles } from './generators/svelte.js';
import { generateVueFiles } from './generators/vue.js';
import { normalizeManifest } from './normalize.js';
import type {
  CodegenInput,
  CodegenOptions,
  CodegenOutput,
  GeneratedFile,
} from './types.js';

function writeGeneratedGroup(
  baseDir: string | undefined,
  files: ReadonlyArray<GeneratedFile>,
  writtenPaths: string[],
): void {
  if (!baseDir) return;
  for (const file of files) {
    const absPath = resolve(baseDir, file.path);
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, file.content, 'utf8');
    writtenPaths.push(absPath);
  }
}

/**
 * Generates React 19/18, Vue, Angular, Svelte 5, and IDE metadata outputs
 * from a Custom Elements Manifest + `ComponentBehaviorSpec[]`.
 */
export function generateAllWrappers(
  input: CodegenInput,
  options: CodegenOptions = {},
): CodegenOutput {
  const models = normalizeManifest(input.manifest, input.specs);
  const reactFiles = generateReactFiles(models);
  const vueFiles = generateVueFiles(models);
  const angularFiles = generateAngularFiles(models);
  const svelteFiles = generateSvelteFiles(models);
  const ideFiles = generateIdeFiles(models, options.packageVersion ?? '0.1.0');

  const writtenPaths: string[] = [];
  if (options.write ?? false) {
    writeGeneratedGroup(options.reactDir, reactFiles, writtenPaths);
    writeGeneratedGroup(options.vueDir, vueFiles, writtenPaths);
    writeGeneratedGroup(options.angularDir, angularFiles, writtenPaths);
    writeGeneratedGroup(options.svelteDir, svelteFiles, writtenPaths);
    writeGeneratedGroup(options.ideDir, ideFiles, writtenPaths);
  }

  return {
    models,
    reactFiles,
    vueFiles,
    angularFiles,
    svelteFiles,
    ideFiles,
    writtenPaths,
  };
}
