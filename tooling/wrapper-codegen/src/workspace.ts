import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import type { ExtendedCustomElementsManifest } from './types.js';

export const PRIMITIVES_UTILITY_SPECS: ReadonlyArray<ComponentBehaviorSpec> = [
  {
    tag: 'mth-visually-hidden',
    package: '@methane-ui/primitives',
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
    package: '@methane-ui/primitives',
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
    package: '@methane-ui/primitives',
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

export const PRIMITIVES_UTILITY_MANIFEST: ExtendedCustomElementsManifest = {
  schemaVersion: '1.0.0',
  modules: [
    {
      path: 'packages/primitives/src/auto-loader.ts',
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

function discoverWorkspacePackageDirs(rootDir: string): string[] {
  const dirs: string[] = [];
  const uiDir = resolve(rootDir, 'packages/ui');
  if (existsSync(uiDir)) {
    dirs.push(uiDir);
  }
  for (const group of ['packages/kits', 'packages/satellites']) {
    const groupDir = resolve(rootDir, group);
    if (!existsSync(groupDir)) continue;
    const entries = readdirSync(groupDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
    for (const name of entries) {
      dirs.push(resolve(groupDir, name));
    }
  }
  return dirs;
}

export function hasWorkspaceManifests(rootDir: string): boolean {
  return existsSync(resolve(rootDir, 'packages/ui/custom-elements.json'));
}

/**
 * Discovers and merges `packages/ui`, `packages/kits/*`, `packages/satellites/*`
 * `custom-elements.json` manifests, `@methane-ui/primitives` utility elements, and
 * their `dist/specs.json` / `x-methane-spec` `ComponentBehaviorSpec` entries.
 */
export function loadWorkspaceManifestAndSpecs(rootDir: string): {
  manifest: ExtendedCustomElementsManifest;
  specs: ComponentBehaviorSpec[];
} {
  const packageDirs = discoverWorkspacePackageDirs(rootDir);
  const modules: Array<ExtendedCustomElementsManifest['modules'][number]> = [];
  const specByTag = new Map<string, ComponentBehaviorSpec>();

  for (const pkgDir of packageDirs) {
    const cemPath = resolve(pkgDir, 'custom-elements.json');
    if (existsSync(cemPath)) {
      const parsed = JSON.parse(readFileSync(cemPath, 'utf8')) as ExtendedCustomElementsManifest;
      for (const mod of parsed.modules ?? []) {
        modules.push(mod);
        for (const decl of mod.declarations ?? []) {
          const embeddedSpec = (decl as unknown as Record<string, unknown>)['x-methane-spec'];
          if (
            embeddedSpec &&
            typeof embeddedSpec === 'object' &&
            'tag' in embeddedSpec &&
            typeof (embeddedSpec as { tag?: unknown }).tag === 'string'
          ) {
            const spec = embeddedSpec as ComponentBehaviorSpec;
            specByTag.set(spec.tag, spec);
          }
        }
      }
    }

    const specsJsonPath = resolve(pkgDir, 'dist/specs.json');
    if (existsSync(specsJsonPath)) {
      const parsedSpecs = JSON.parse(readFileSync(specsJsonPath, 'utf8')) as unknown;
      if (Array.isArray(parsedSpecs)) {
        for (const entry of parsedSpecs) {
          if (entry && typeof entry === 'object' && 'tag' in entry && typeof entry.tag === 'string') {
            specByTag.set(entry.tag, entry as ComponentBehaviorSpec);
          }
        }
      }
    }
  }

  for (const mod of PRIMITIVES_UTILITY_MANIFEST.modules) {
    modules.push(mod);
  }
  for (const utilitySpec of PRIMITIVES_UTILITY_SPECS) {
    if (!specByTag.has(utilitySpec.tag)) {
      specByTag.set(utilitySpec.tag, utilitySpec);
    }
  }

  return {
    manifest: {
      schemaVersion: '1.0.0',
      modules,
    },
    specs: [...specByTag.values()],
  };
}
