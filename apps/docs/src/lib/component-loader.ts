import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  compileA11yChecklist,
  compileSpecDocs,
  validateBehaviorSpec,
  type A11yChecklist,
  type ComponentBehaviorSpec,
} from '@methane/spec-compiler';
import {
  DEFAULT_BEHAVIOR_SPECS,
  DEFAULT_CEM_FIXTURE,
  normalizeManifest,
  type ExtendedCustomElementsManifest,
  type NormalizedComponentModel,
} from '@methane/wrapper-codegen';

export type PackageGroup = 'ui' | 'kits' | 'satellites' | 'primitives';

export interface ComponentDocEntry {
  readonly tagName: string;
  readonly className: string;
  readonly packageName: string;
  readonly packageGroup: PackageGroup;
  readonly description: string;
  readonly model: NormalizedComponentModel;
  readonly spec: ComponentBehaviorSpec | null;
  readonly specMarkdown: string | null;
  readonly a11yChecklist: A11yChecklist | null;
  readonly whenNotToUse: string;
  readonly bundleBadge: {
    readonly coldLabel: string;
    readonly marginalLabel: string;
  };
  readonly snippets: {
    readonly html: string;
    readonly react: string;
    readonly vue: string;
    readonly angular: string;
    readonly svelte: string;
  };
}

export interface LoadComponentDocsOptions {
  readonly repoRoot?: string;
}

const WHEN_NOT_TO_USE_MAP: Readonly<Record<string, string>> = {
  'mth-button': 'Do not use <mth-button> for navigation links that change the URL; use <mth-link> or a native <a>.',
  'mth-input': 'Do not use <mth-input> for multi-line editorial copy; use <mth-textarea> or @methane/editor.',
  'mth-checkbox': 'Do not use <mth-checkbox> for immediate live-toggling settings without form submit; use <mth-switch>.',
  'mth-dialog': 'Do not use <mth-dialog> for non-modal contextual hints; use <mth-popover> or <mth-tooltip>.',
  'mth-combobox': 'Do not use <mth-combobox> for 2–4 static choices without search; use <mth-radio-group> or native <select>.',
  'mth-visually-hidden':
    'Do not use <mth-visually-hidden> on interactive elements that must stay visible when focused; use <mth-skip-link> or native focusable controls.',
  'mth-skip-link':
    'Do not use <mth-skip-link> for ordinary page navigation links; reserve it for keyboard bypass links to landmark regions.',
  'mth-error-boundary':
    'Do not use <mth-error-boundary> for expected inline field validation errors; use <mth-field> error messages.',
};

const PRIMITIVES_UTILITY_SPECS: ReadonlyArray<ComponentBehaviorSpec> = [
  {
    tag: 'mth-visually-hidden',
    package: '@methane/primitives',
    conformance: [],
    controllers: [],
    focusModel: 'none',
    states: [],
    keyboard: [],
    props: [],
    events: [],
    slots: [{ name: '', description: 'Screen-reader-only accessible text.' }],
    parts: [],
    messages: {},
  },
  {
    tag: 'mth-skip-link',
    package: '@methane/primitives',
    conformance: [],
    controllers: [],
    focusModel: 'delegates-focus',
    states: [],
    keyboard: [
      { key: 'Enter', when: 'focused', expect: 'Jumps focus to target landmark element' },
    ],
    props: [{ name: 'href', attr: 'href', type: 'string', default: '#main' }],
    events: [],
    slots: [{ name: '', description: 'Skip link label' }],
    parts: [],
    messages: { skipToMain: 'Skip to main content' },
  },
  {
    tag: 'mth-error-boundary',
    package: '@methane/primitives',
    conformance: [],
    controllers: [],
    focusModel: 'none',
    states: [],
    keyboard: [],
    props: [{ name: 'fallbackMessage', attr: 'fallback-message', type: 'string' }],
    events: [
      { name: 'mth-error-captured', cancelable: false, detailType: '{ error: unknown }' },
      { name: 'mth-reset', cancelable: false, detailType: 'void' },
    ],
    slots: [
      { name: '', description: 'Protected subtree content.' },
      { name: 'fallback', description: 'Optional custom fallback UI.' },
    ],
    parts: [],
    messages: { errorFallback: 'Something went wrong.', retry: 'Retry' },
  },
];

const PRIMITIVES_UTILITY_MANIFEST: ExtendedCustomElementsManifest = {
  schemaVersion: '1.0.0',
  modules: [
    {
      path: 'src/auto-loader.ts',
      declarations: [
        {
          name: 'MthVisuallyHidden',
          tagName: 'mth-visually-hidden',
          customElement: true,
          description:
            'Screen-reader-only Light-DOM wrapper using CSS logical properties.',
          slots: [{ name: '', description: 'Screen-reader-only accessible text.' }],
        },
        {
          name: 'MthSkipLink',
          tagName: 'mth-skip-link',
          customElement: true,
          description:
            'Focus-revealed skip link for keyboard navigation to landmark targets.',
          members: [
            {
              kind: 'field',
              name: 'href',
              attribute: 'href',
              type: { text: 'string' },
              default: "'#main'",
              description: 'Target hash fragment or URL for the skip link anchor.',
            },
          ],
          slots: [{ name: '', description: 'Skip link label (defaults to localized skipToMain).' }],
        },
        {
          name: 'MthErrorBoundary',
          tagName: 'mth-error-boundary',
          customElement: true,
          description:
            'Captures subtree errors and mth-error events to render a localized declarative fallback.',
          members: [
            {
              kind: 'field',
              name: 'fallbackMessage',
              attribute: 'fallback-message',
              type: { text: 'string' },
              description: 'Optional fallback error message override.',
            },
          ],
          events: [
            {
              name: 'mth-error-captured',
              type: { text: 'CustomEvent<{ error: unknown }>' },
              description: 'Dispatched when a subtree error is captured.',
            },
            {
              name: 'mth-reset',
              type: { text: 'CustomEvent<void>' },
              description: 'Dispatched when the error boundary resets.',
            },
          ],
          slots: [
            { name: '', description: 'Protected subtree content.' },
            { name: 'fallback', description: 'Optional custom fallback UI.' },
          ],
        },
      ],
    },
  ],
};

function findRepoRoot(): string {
  const candidates = [
    resolve(process.cwd(), '../..'),
    resolve(process.cwd()),
  ];
  for (const dir of candidates) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
  }
  return process.cwd();
}

function getWorkspacePackageDirs(repoRoot: string): string[] {
  const dirs: string[] = [];
  const roots = [
    resolve(repoRoot, 'packages'),
    resolve(repoRoot, 'packages/kits'),
    resolve(repoRoot, 'packages/satellites'),
  ];

  for (const parent of roots) {
    if (!existsSync(parent)) continue;
    for (const entry of readdirSync(parent, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'kits' || entry.name === 'satellites') continue;
      dirs.push(resolve(parent, entry.name));
    }
  }
  return dirs;
}

function discoverWorkspaceCems(packageDirs: ReadonlyArray<string>): ExtendedCustomElementsManifest[] {
  const manifests: ExtendedCustomElementsManifest[] = [];
  for (const pkgDir of packageDirs) {
    const cemPath = resolve(pkgDir, 'custom-elements.json');
    if (!existsSync(cemPath)) continue;
    try {
      const parsed = JSON.parse(readFileSync(cemPath, 'utf8')) as ExtendedCustomElementsManifest;
      if (Array.isArray(parsed.modules)) manifests.push(parsed);
    } catch {
      // Ignore invalid CEM files during discovery
    }
  }
  return manifests;
}

function collectSpecFiles(dir: string, out: string[]): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectSpecFiles(full, out);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.spec.json') ||
        entry.name.endsWith('.spec.js') ||
        entry.name.endsWith('.spec.mjs'))
    ) {
      out.push(full);
    }
  }
}

function tryAcceptSpec(candidate: unknown, out: Map<string, ComponentBehaviorSpec>): void {
  if (!candidate || typeof candidate !== 'object') return;
  const validation = validateBehaviorSpec(candidate as ComponentBehaviorSpec);
  if (validation.valid) {
    const spec = candidate as ComponentBehaviorSpec;
    out.set(spec.tag, spec);
  }
}

async function discoverWorkspaceSpecs(
  packageDirs: ReadonlyArray<string>,
  manifests: ReadonlyArray<ExtendedCustomElementsManifest>,
): Promise<Map<string, ComponentBehaviorSpec>> {
  const specByTag = new Map<string, ComponentBehaviorSpec>(
    DEFAULT_BEHAVIOR_SPECS.map((s) => [s.tag, s]),
  );

  // 1. Extract inline `x-methane-spec` / `behaviorSpec` embedded in CEM declarations
  for (const manifest of manifests) {
    for (const mod of manifest.modules) {
      for (const decl of mod.declarations ?? []) {
        const record = decl as unknown as Record<string, unknown>;
        tryAcceptSpec(record['x-methane-spec'] ?? record['behaviorSpec'], specByTag);
      }
    }
  }

  // 2. Discover compiled `.spec.js`/`.spec.mjs` and `.spec.json` files across packages
  const specFiles: string[] = [];
  for (const pkgDir of packageDirs) {
    collectSpecFiles(resolve(pkgDir, 'dist'), specFiles);
    collectSpecFiles(resolve(pkgDir, 'src'), specFiles);
  }

  for (const file of specFiles) {
    try {
      if (file.endsWith('.json')) {
        const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown;
        tryAcceptSpec(raw, specByTag);
      } else {
        const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
        for (const exported of Object.values(mod)) {
          tryAcceptSpec(exported, specByTag);
        }
      }
    } catch {
      // Ignore un-loadable spec files during discovery
    }
  }

  return specByTag;
}

interface PackageRegistryInfo {
  readonly name: string;
  readonly dir: string;
  readonly group: PackageGroup;
  readonly exports: Record<string, unknown>;
}

function classifyPackageGroup(packageName: string, pkgDir: string): PackageGroup {
  if (packageName === '@methane/primitives') return 'primitives';
  if (pkgDir.includes('/packages/kits/') || pkgDir.endsWith('\\packages\\kits\\' + pkgDir.split(/[/\\]/).pop())) {
    return 'kits';
  }
  if (
    pkgDir.includes('/packages/satellites/') ||
    pkgDir.endsWith('\\packages\\satellites\\' + pkgDir.split(/[/\\]/).pop())
  ) {
    return 'satellites';
  }
  return 'ui';
}

function buildPackageRegistry(packageDirs: ReadonlyArray<string>): Map<string, PackageRegistryInfo> {
  const registry = new Map<string, PackageRegistryInfo>();
  for (const pkgDir of packageDirs) {
    const pkgJsonPath = resolve(pkgDir, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;
    try {
      const parsed = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as {
        name?: string;
        exports?: Record<string, unknown>;
      };
      if (!parsed.name) continue;
      registry.set(parsed.name, {
        name: parsed.name,
        dir: pkgDir,
        group: classifyPackageGroup(parsed.name, pkgDir),
        exports: parsed.exports && typeof parsed.exports === 'object' ? parsed.exports : {},
      });
    } catch {
      // Ignore unreadable package.json files
    }
  }
  return registry;
}

function resolveSnippetImportPath(
  packageName: string,
  tagName: string,
  packageRegistry: ReadonlyMap<string, PackageRegistryInfo>,
): string {
  if (packageName === '@methane/primitives') {
    return '@methane/primitives';
  }

  const slug = tagName.replace(/^mth-/, '');
  const pkgInfo = packageRegistry.get(packageName);
  if (!pkgInfo) {
    return packageName;
  }

  if (Object.prototype.hasOwnProperty.call(pkgInfo.exports, `./${slug}`)) {
    return `${packageName}/${slug}`;
  }

  if (Object.prototype.hasOwnProperty.call(pkgInfo.exports, './*')) {
    const hasSubpathTarget =
      existsSync(resolve(pkgInfo.dir, 'dist/components', slug, 'index.js')) ||
      existsSync(resolve(pkgInfo.dir, 'src/components', slug, 'index.ts'));
    if (hasSubpathTarget) {
      return `${packageName}/${slug}`;
    }
  }

  return packageName;
}

function unquoteDefaultValue(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return typeof parsed === 'string' ? parsed : String(parsed);
      } catch {
        return trimmed.slice(1, -1);
      }
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function escapeHtmlAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function extractFirstEnumLiteral(typeText: string): string | undefined {
  const literals: string[] = [];
  for (const branch of typeText.split('|')) {
    const match = /^(['"])(.*)\1$/.exec(branch.trim());
    if (match) {
      literals.push(match[2]!);
    }
  }
  return literals.find((lit) => lit.length > 0) ?? literals[0];
}

function buildComponentSnippets(
  model: NormalizedComponentModel,
  packageName: string,
  packageRegistry: ReadonlyMap<string, PackageRegistryInfo>,
) {
  const sampleAttrs = model.props
    .filter((p) => p.attr !== null)
    .flatMap((p) => {
      if (p.type === 'boolean') {
        return p.defaultValue === 'true' ? [p.attr!] : [];
      }
      const enumLit = extractFirstEnumLiteral(p.type);
      const unquoted = unquoteDefaultValue(p.defaultValue);
      const val =
        enumLit !== undefined && enumLit.length > 0
          ? enumLit
          : unquoted !== undefined && unquoted.length > 0
            ? unquoted
            : undefined;
      if (val === undefined) return [];
      return [`${p.attr!}="${escapeHtmlAttr(val)}"`];
    })
    .slice(0, 2)
    .join(' ');
  const attrStr = sampleAttrs ? ` ${sampleAttrs}` : '';
  const body = model.slots.some((s) => s.name === '') ? 'Example' : '';
  const importPath = resolveSnippetImportPath(packageName, model.tagName, packageRegistry);

  return {
    html: `<script type="module" src="${importPath}"></script>\n<${model.tagName}${attrStr}>${body}</${model.tagName}>`,
    react: `import '${importPath}';\nimport '@methane/react';\n\nexport function Example() {\n  return <${model.tagName}${attrStr}>${body}</${model.tagName}>;\n}`,
    vue: `<script setup lang="ts">\nimport '${importPath}';\n</script>\n\n<template>\n  <${model.tagName}${attrStr}>${body}</${model.tagName}>\n</template>`,
    angular: `import { ${model.className}Directive } from '@methane/angular';\n\n@Component({\n  standalone: true,\n  imports: [${model.className}Directive],\n  template: \`<${model.tagName}${attrStr}>${body}</${model.tagName}>\`,\n})\nexport class ExampleComponent {}`,
    svelte: `<script lang="ts">\n  import ${model.className} from '@methane/svelte/${model.className}.svelte';\n</script>\n\n<${model.className}${attrStr}>${body}</${model.className}>`,
  };
}

function buildBundleBadge(
  packageGroup: PackageGroup,
  controllerCount: number,
  isSatelliteConformance: boolean,
): ComponentDocEntry['bundleBadge'] {
  if (packageGroup === 'satellites' || isSatelliteConformance) {
    return {
      coldLabel: `~${(6.8 + controllerCount * 1.1).toFixed(1)} KB brotli shell + lazy engine`,
      marginalLabel: `~${(1.4 + controllerCount * 0.6).toFixed(1)} KB shell · lazy engine chunk`,
    };
  }
  if (packageGroup === 'primitives') {
    return {
      coldLabel: '~3.2 KB brotli (primitives + UIElement)',
      marginalLabel: '~0.9 KB marginal',
    };
  }
  if (packageGroup === 'kits') {
    return {
      coldLabel: `~${(6.8 + controllerCount * 1.1).toFixed(1)} KB brotli (kit + Lit)`,
      marginalLabel: `~${(1.4 + controllerCount * 0.6).toFixed(1)} KB marginal`,
    };
  }
  return {
    coldLabel: `~${(6.8 + controllerCount * 1.1).toFixed(1)} KB brotli (cold + Lit)`,
    marginalLabel: `~${(1.4 + controllerCount * 0.6).toFixed(1)} KB marginal`,
  };
}

function resolveTypeAliasFromSource(
  aliasName: string,
  pkgDir: string,
  modulePath?: string,
): string | null {
  const candidates: string[] = [];
  if (modulePath) {
    candidates.push(resolve(pkgDir, modulePath));
    const tsPath = modulePath.replace(/\.js$/, '.ts');
    candidates.push(resolve(pkgDir, tsPath));
    candidates.push(resolve(pkgDir, 'src', tsPath.replace(/^dist\//, '')));
  }

  const pattern = new RegExp(`export\\s+type\\s+${aliasName}\\s*=\\s*([^;]+);`);
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const content = readFileSync(file, 'utf8');
      const match = pattern.exec(content);
      if (match?.[1]) {
        return match[1].replace(/\s+/g, ' ').trim();
      }
    } catch {
      // Ignore unreadable source files
    }
  }
  return null;
}

function enrichModelPropTypes(
  model: NormalizedComponentModel,
  spec: ComponentBehaviorSpec | null,
  pkgDir: string | undefined,
  modulePath: string | undefined,
): NormalizedComponentModel {
  const specPropByName = new Map((spec?.props ?? []).map((p) => [p.name, p]));
  let changed = false;

  const props = model.props.map((prop) => {
    const rawType = prop.type.trim();
    if (
      rawType === 'boolean' ||
      rawType === 'string' ||
      rawType === 'number' ||
      rawType.includes('|') ||
      !/^[A-Z][A-Za-z0-9_]*$/.test(rawType)
    ) {
      return prop;
    }

    const fromSpec = specPropByName.get(prop.name)?.type.trim();
    if (fromSpec && fromSpec.includes('|')) {
      changed = true;
      return { ...prop, type: fromSpec };
    }

    if (pkgDir) {
      const fromSource = resolveTypeAliasFromSource(rawType, pkgDir, modulePath);
      if (fromSource && fromSource.includes('|')) {
        changed = true;
        return { ...prop, type: fromSource };
      }
    }

    return prop;
  });

  return changed ? { ...model, props } : model;
}

export async function loadComponentDocs(
  options: LoadComponentDocsOptions = {},
): Promise<ReadonlyArray<ComponentDocEntry>> {
  const repoRoot = options.repoRoot ?? findRepoRoot();
  const packageDirs = getWorkspacePackageDirs(repoRoot);
  const packageRegistry = buildPackageRegistry(packageDirs);
  const discovered = discoverWorkspaceCems(packageDirs);
  const manifests: ExtendedCustomElementsManifest[] =
    discovered.length > 0 ? [...discovered] : [DEFAULT_CEM_FIXTURE];
  if (existsSync(resolve(repoRoot, 'packages/primitives/src/auto-loader.ts'))) {
    manifests.push(PRIMITIVES_UTILITY_MANIFEST);
  }

  const specByTag = await discoverWorkspaceSpecs(packageDirs, manifests);
  if (existsSync(resolve(repoRoot, 'packages/primitives/src/auto-loader.ts'))) {
    for (const utilitySpec of PRIMITIVES_UTILITY_SPECS) {
      if (!specByTag.has(utilitySpec.tag)) {
        specByTag.set(utilitySpec.tag, utilitySpec);
      }
    }
  }
  const allSpecs = [...specByTag.values()];

  const byTag = new Map<string, { model: NormalizedComponentModel; modulePath: string | undefined }>();
  for (const manifest of manifests) {
    const modulePathByTag = new Map<string, string>();
    for (const mod of manifest.modules) {
      for (const decl of mod.declarations ?? []) {
        if (decl.tagName && mod.path) {
          modulePathByTag.set(decl.tagName, mod.path);
        }
      }
    }
    for (const model of normalizeManifest(manifest, allSpecs)) {
      byTag.set(model.tagName, { model, modulePath: modulePathByTag.get(model.tagName) });
    }
  }

  return [...byTag.values()]
    .sort((a, b) => a.model.tagName.localeCompare(b.model.tagName))
    .map(({ model: rawModel, modulePath }) => {
      const spec = specByTag.get(rawModel.tagName) ?? null;
      const packageName = spec?.package ?? '@methane/ui';
      const pkgInfo = packageRegistry.get(packageName);
      const model = enrichModelPropTypes(rawModel, spec, pkgInfo?.dir, modulePath);
      const isSatelliteConformance = Boolean(spec?.conformance.includes('satellite'));
      const packageGroup =
        packageRegistry.get(packageName)?.group ??
        (packageName === '@methane/primitives'
          ? 'primitives'
          : isSatelliteConformance
            ? 'satellites'
            : 'ui');
      const specMarkdown = spec ? compileSpecDocs(spec) : null;
      const a11yChecklist = spec ? compileA11yChecklist(spec) : null;
      const controllerCount = spec?.controllers.length ?? 0;

      return {
        tagName: model.tagName,
        className: model.className,
        packageName,
        packageGroup,
        description: model.description || `Methane ${model.tagName} custom element.`,
        model,
        spec,
        specMarkdown,
        a11yChecklist,
        whenNotToUse:
          WHEN_NOT_TO_USE_MAP[model.tagName] ??
          'Do not use a Shadow-DOM custom element when a 0 B JS Light-DOM @methane/css primitive suffices.',
        bundleBadge: buildBundleBadge(packageGroup, controllerCount, isSatelliteConformance),
        snippets: buildComponentSnippets(model, packageName, packageRegistry),
      };
    });
}
