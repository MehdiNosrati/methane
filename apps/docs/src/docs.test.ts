import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MTH_CSS_PRIMITIVES } from '@methane/css';
import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { compileDtcgTokens } from '@methane/tokens';
import { describe, expect, it } from 'vitest';
import { ADRS } from './lib/adrs.js';
import { loadComponentDocs } from './lib/component-loader.js';
import { CSS_PRIMITIVE_CATALOG } from './lib/css-catalog.js';
import { BASE_PATH } from './lib/links.js';
import {
  DEFAULT_THEME_CONFIG,
  compileThemeDtcgCss,
  generateThemeCssOverrides,
  generateThemeDtcgDocument,
} from './lib/theme-builder.js';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(docsRoot, 'dist');

function collectFiles(dir: string, suffix: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full, suffix));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      out.push(full);
    }
  }
  return out;
}

describe('@methane/docs catalog, loaders, theme builder, and built Astro site', () => {
  it('covers all 23 @methane/css primitives with When NOT to use guidance and 5 framework snippets', () => {
    expect(CSS_PRIMITIVE_CATALOG).toHaveLength(23);
    const ids = new Set(CSS_PRIMITIVE_CATALOG.map((c) => c.id));
    for (const expected of MTH_CSS_PRIMITIVES) {
      expect(ids.has(expected)).toBe(true);
    }
    for (const item of CSS_PRIMITIVE_CATALOG) {
      expect(item.whenNotToUse.length).toBeGreaterThan(10);
      expect(item.snippets.html).toContain(item.subpath);
      expect(item.snippets.react).toContain(item.subpath);
      expect(item.snippets.vue).toContain(item.subpath);
      expect(item.snippets.angular).toContain(item.subpath);
      expect(item.snippets.svelte).toContain(item.subpath);
    }
  });

  it('loads CEM + ComponentBehaviorSpec entries across full catalog with package-scoped snippets and bundle badges', async () => {
    const components = await loadComponentDocs();
    expect(components.length).toBeGreaterThanOrEqual(230);

    const packages = new Set(components.map((c) => c.packageName));
    for (const expectedPkg of [
      '@methane/ui',
      '@methane/primitives',
      '@methane/admin',
      '@methane/ai',
      '@methane/auth',
      '@methane/chat',
      '@methane/commerce',
      '@methane/3d',
      '@methane/charts',
      '@methane/code',
      '@methane/datagrid',
      '@methane/editor',
      '@methane/flow',
      '@methane/maps',
      '@methane/media',
      '@methane/pdf',
      '@methane/rtc',
      '@methane/spreadsheet',
    ]) {
      expect(packages.has(expectedPkg), `Missing package ${expectedPkg}`).toBe(true);
    }

    const combobox = components.find((c) => c.tagName === 'mth-combobox');
    expect(combobox).toBeDefined();
    expect(combobox!.specMarkdown).toContain('mth-combobox');
    expect(combobox!.a11yChecklist?.items.length).toBeGreaterThan(0);
    expect(combobox!.bundleBadge.coldLabel).toContain('brotli');
    expect(combobox!.whenNotToUse.length).toBeGreaterThan(10);

    const button = components.find((c) => c.tagName === 'mth-button');
    expect(button?.snippets.html).toContain('@methane/ui/button');
    expect(button?.snippets.angular).toContain('CUSTOM_ELEMENTS_SCHEMA');
    expect(button?.snippets.angular).toContain("import '@methane/ui/button';");
    expect(button?.snippets.svelte).toContain("import '@methane/ui/button';");
    expect(button?.snippets.svelte).toContain("import MthButton from '@methane/svelte/MthButton.svelte';");
    expect(button?.snippets.svelte).not.toContain("from '@methane/svelte';");

    const skipLink = components.find((c) => c.tagName === 'mth-skip-link');
    expect(skipLink?.snippets.html).toContain('src="@methane/primitives"');
    expect(skipLink?.snippets.react).toContain("import '@methane/primitives';");

    const authForm = components.find((c) => c.tagName === 'mth-auth-form');
    expect(authForm?.packageGroup).toBe('kits');
    expect(authForm?.snippets.html).toContain('@methane/auth/auth-form');
    expect(authForm?.snippets.react).not.toContain('@methane/ui/');

    const datagrid = components.find((c) => c.tagName === 'mth-datagrid');
    expect(datagrid?.packageGroup).toBe('satellites');
    expect(datagrid?.bundleBadge.coldLabel).toContain('lazy engine');
    expect(datagrid?.snippets.html).toContain('@methane/datagrid/datagrid');
    expect(datagrid?.snippets.react).not.toContain('@methane/ui/');

    for (const entry of components) {
      if (entry.packageName !== '@methane/ui') {
        expect(entry.snippets.html).not.toContain('@methane/ui/');
        expect(entry.snippets.react).not.toContain('@methane/ui/');
      }
      for (const snippet of Object.values(entry.snippets)) {
        expect(snippet, `Malformed quotes in ${entry.tagName}`).not.toContain('"""');
        expect(snippet, `Double-quoted attr in ${entry.tagName}`).not.toMatch(/=""[A-Za-z0-9#]/);
        expect(snippet, `Union misparse in ${entry.tagName}`).not.toContain('" | "');
      }
    }
  });

  it('dynamically discovers non-fixture workspace CEM and ComponentBehaviorSpec files (spec.js and x-methane-spec)', async () => {
    const tmpRoot = mkdtempSync(resolve(tmpdir(), 'methane-docs-loader-'));
    try {
      const uiDir = resolve(tmpRoot, 'packages/ui');
      const uiDistDir = resolve(uiDir, 'dist');
      mkdirSync(uiDistDir, { recursive: true });

      const customSpec: ComponentBehaviorSpec = {
        tag: 'mth-spark-gauge',
        package: '@methane/ui',
        conformance: ['roving-focus'],
        controllers: ['RovingFocusController', 'MotionController'],
        focusModel: 'host',
        role: 'slider',
        states: ['active'],
        keyboard: [
          { key: 'ArrowRight', dir: 'ltr', when: 'focused', expect: 'Increments gauge value' },
          { key: 'ArrowLeft', dir: 'rtl', when: 'focused', expect: 'Increments gauge value in RTL' },
        ],
        props: [{ name: 'value', attr: 'value', type: 'number', default: 50 }],
        events: [{ name: 'mth-change', cancelable: false, detailType: '{ value: number }' }],
        slots: [{ name: '', description: 'Accessible label' }],
        parts: [{ name: 'base', description: 'Root gauge track' }],
        messages: { label: 'Gauge' },
      };

      writeFileSync(
        resolve(uiDistDir, 'mth-spark-gauge.spec.js'),
        `export const sparkGaugeSpec = ${JSON.stringify(customSpec)};\n`,
        'utf8',
      );

      writeFileSync(
        resolve(uiDir, 'custom-elements.json'),
        JSON.stringify({
          schemaVersion: '1.0.0',
          modules: [
            {
              path: 'src/mth-spark-gauge.ts',
              declarations: [
                {
                  kind: 'class',
                  name: 'MthSparkGauge',
                  tagName: 'mth-spark-gauge',
                  customElement: true,
                  description: 'Non-fixture spark gauge component.',
                  members: [{ kind: 'field', name: 'value', attribute: 'value', type: { text: 'number' } }],
                },
                {
                  kind: 'class',
                  name: 'MthInlineCard',
                  tagName: 'mth-inline-card',
                  customElement: true,
                  description: 'Component with embedded x-methane-spec.',
                  'x-methane-spec': {
                    tag: 'mth-inline-card',
                    package: '@methane/ui',
                    conformance: ['overlay'],
                    controllers: ['OverlayController'],
                    focusModel: 'host',
                    role: 'region',
                    states: ['open'],
                    keyboard: [{ key: 'Escape', when: 'expanded', expect: 'Collapses card' }],
                    props: [],
                    events: [],
                    slots: [{ name: '', description: 'Card body' }],
                    parts: [{ name: 'base', description: 'Surface' }],
                    messages: { close: 'Close' },
                  },
                },
              ],
            },
          ],
        }),
        'utf8',
      );

      const loaded = await loadComponentDocs({ repoRoot: tmpRoot });
      const gauge = loaded.find((c) => c.tagName === 'mth-spark-gauge');
      expect(gauge).toBeDefined();
      expect(gauge!.spec?.keyboard).toHaveLength(2);
      expect(gauge!.specMarkdown).toContain('Increments gauge value');
      expect(gauge!.a11yChecklist?.items.some((i) => i.category === 'keyboard')).toBe(true);
      expect(gauge!.snippets.svelte).toContain("import MthSparkGauge from '@methane/svelte/MthSparkGauge.svelte';");

      const inlineCard = loaded.find((c) => c.tagName === 'mth-inline-card');
      expect(inlineCard).toBeDefined();
      expect(inlineCard!.spec?.keyboard[0]?.key).toBe('Escape');
      expect(inlineCard!.a11yChecklist?.items.length).toBeGreaterThan(0);
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('re-derives brand ramp and accent tokens on #tb-preview from --mth-color-seed-brand', () => {
    const docsCss = readFileSync(resolve(docsRoot, 'src/styles/docs.css'), 'utf8');
    expect(docsCss).toContain("#tb-preview:not([data-mth-contrast='high'])");
    expect(docsCss).toContain('--mth-color-brand-500: oklch(from var(--mth-color-seed-brand) l c h);');
    expect(docsCss).toContain('--mth-color-accent: light-dark(var(--mth-color-brand-500), var(--mth-color-brand-400));');
    expect(docsCss).toContain('--mth-color-accent-subtle: light-dark(var(--mth-color-brand-50), var(--mth-color-brand-950));');

    const builtCssFiles = collectFiles(distDir, '.css');
    expect(builtCssFiles.length).toBeGreaterThan(0);
    const combinedBuiltCss = builtCssFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(combinedBuiltCss).toContain('#tb-preview');
    expect(combinedBuiltCss).toContain('--mth-color-brand-500');
    expect(combinedBuiltCss).toContain('--mth-color-accent:');
  });

  it('generates valid --mth-* CSS overrides and compilable DTCG JSON from Theme Builder config', () => {
    const customConfig = {
      ...DEFAULT_THEME_CONFIG,
      brandLightness: 0.58,
      brandChroma: 0.19,
      brandHue: 195,
      radiusPreset: 'rounded' as const,
      density: 'compact' as const,
    };
    const cssOverrides = generateThemeCssOverrides(customConfig);
    expect(cssOverrides).toContain('--mth-color-seed-brand: oklch(0.58 0.19 195);');
    expect(cssOverrides).toContain('--mth-density: 0.8;');

    const dtcg = generateThemeDtcgDocument(customConfig);
    const compiled = compileDtcgTokens(dtcg);
    expect(compiled.css).toContain('--mth-color-seed-brand: oklch(0.58 0.19 195);');
    expect(compileThemeDtcgCss(customConfig)).toBe(compiled.css);
  });

  it('produces apps/docs/dist/index.html and all required routes with zero broken internal links', () => {
    expect(existsSync(resolve(distDir, 'index.html'))).toBe(true);

    const requiredRoutes = [
      'index.html',
      'architecture/index.html',
      'quickstart/index.html',
      'adrs/index.html',
      'guides/skills/index.html',
      'guides/ssr/index.html',
      'guides/theming/index.html',
      'guides/forms-a11y/index.html',
      'guides/security/index.html',
      'tokens/index.html',
      'css/index.html',
      'components/index.html',
      'theme-builder/index.html',
    ];
    for (const route of requiredRoutes) {
      expect(existsSync(resolve(distDir, route)), `Missing built route ${route}`).toBe(true);
    }

    const htmlFiles = collectFiles(distDir, '.html');
    expect(htmlFiles.length).toBeGreaterThanOrEqual(20);

    const brokenLinks: string[] = [];
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      const matches = html.matchAll(/\shref="([^"]+)"/g);
      for (const m of matches) {
        const href = m[1]!;
        if (!href.startsWith(BASE_PATH)) continue;
        const cleanHref = href.split('#')[0]!.split('?')[0]!;
        const rel = cleanHref.slice(BASE_PATH.length).replace(/^\/+/, '');
        const candidates =
          rel === ''
            ? [resolve(distDir, 'index.html')]
            : [
                resolve(distDir, rel),
                resolve(distDir, rel, 'index.html'),
                resolve(distDir, `${rel}.html`),
              ];
        const found = candidates.some(
          (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
        );
        if (!found) {
          brokenLinks.push(`${file}: ${href}`);
        }
      }
    }
    expect(brokenLinks).toEqual([]);
  });

  it('renders all 23 CSS primitives, When NOT to use, ADRs 001-015, Svelte 5 subpath import, and Theme Builder in built HTML', () => {
    const cssHtml = readFileSync(resolve(distDir, 'css/index.html'), 'utf8');
    for (const primitive of MTH_CSS_PRIMITIVES) {
      expect(cssHtml).toContain(primitive);
    }
    expect(cssHtml).toContain('When NOT to use:');

    const adrsHtml = readFileSync(resolve(distDir, 'adrs/index.html'), 'utf8');
    expect(ADRS).toHaveLength(15);
    for (const adr of ADRS) {
      expect(adrsHtml).toContain(adr.id);
    }

    const buttonHtml = readFileSync(resolve(distDir, 'components/mth-button/index.html'), 'utf8');
    expect(buttonHtml).toContain('@methane/svelte/MthButton.svelte');
    expect(buttonHtml).toContain('Live Interactive Preview');
    expect(buttonHtml).toContain('data-preview-stage');
    expect(buttonHtml).toContain('data-preview-theme');
    expect(buttonHtml).toContain('data-preview-dir');
    expect(buttonHtml.indexOf('data-preview-stage')).toBeLessThan(
      buttonHtml.indexOf('Multi-Framework Playground'),
    );

    const shippedTags = [
      'mth-button',
      'mth-checkbox',
      'mth-switch',
      'mth-input',
      'mth-field',
      'mth-combobox',
      'mth-option',
      'mth-option-group',
      'mth-dialog',
      'mth-visually-hidden',
      'mth-skip-link',
      'mth-error-boundary',
    ] as const;
    for (const tag of shippedTags) {
      const compHtml = readFileSync(resolve(distDir, `components/${tag}/index.html`), 'utf8');
      expect(compHtml).toContain(`data-preview-tag="${tag}"`);
      expect(compHtml).toContain('data-preview-upcoming="false"');
      expect(compHtml).toContain('Live Custom Element');
      expect(compHtml).toContain(`<${tag}`);
    }

    const builtComponentPages = collectFiles(resolve(distDir, 'components'), '.html');
    expect(builtComponentPages.length).toBeGreaterThanOrEqual(231);
    for (const page of builtComponentPages) {
      const html = readFileSync(page, 'utf8');
      expect(html).not.toContain('data-preview-upcoming="true"');
    }

    const componentsIndexHtml = readFileSync(resolve(distDir, 'components/index.html'), 'utf8');
    expect(componentsIndexHtml).toContain('data-comp-search');
    expect(componentsIndexHtml).toContain('data-group-filter="kits"');
    expect(componentsIndexHtml).toContain('data-group-filter="satellites"');
    expect(componentsIndexHtml).toContain('@methane/auth');
    expect(componentsIndexHtml).toContain('@methane/datagrid');

    const clientSrc = readFileSync(resolve(docsRoot, 'src/lib/astro-client.ts'), 'utf8');
    expect(clientSrc).toContain('registerUtilityElements()');
    expect(clientSrc).toContain('registerAllComponents()');

    const builtJsFiles = collectFiles(distDir, '.js');
    const combinedBuiltJs = builtJsFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(combinedBuiltJs).toContain('mth-visually-hidden');
    expect(combinedBuiltJs).toContain('mth-dialog');

    const tbHtml = readFileSync(resolve(distDir, 'theme-builder/index.html'), 'utf8');
    expect(tbHtml).toContain('Interactive OKLCH Theme Builder');
    expect(tbHtml).toContain('--mth-color-seed-brand');
    expect(tbHtml).toContain('id="tb-radius" class="mth-select docs-select"');

    const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf8');
    expect(indexHtml).toContain('docs-hero-studio');
    expect(indexHtml).toContain('variant="outline"');
    expect(indexHtml).toContain('<mth-select');
    expect(indexHtml).toContain('id="docs-theme-select" class="mth-select docs-select"');

    expect(buttonHtml).toContain('data-variants-showcase');
    expect(buttonHtml).toContain('data-preview-prop="loading"');
    expect(buttonHtml).toContain('data-preview-prop-name="variant"');
  });

  it('ships valid .agents/skills.json and skills/*/SKILL.md frontmatter and relative links', () => {
    const repoRoot = resolve(docsRoot, '../..');
    const skillsConfigPath = resolve(repoRoot, '.agents/skills.json');
    expect(existsSync(skillsConfigPath)).toBe(true);

    const skillsConfig = JSON.parse(readFileSync(skillsConfigPath, 'utf8')) as {
      entries?: Array<{ path?: string }>;
    };
    expect(skillsConfig.entries).toEqual([{ path: 'skills' }]);

    const skillsDir = resolve(repoRoot, 'skills');
    const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(skillDirs).toEqual([
      'methane-contribute',
      'methane-ssr',
      'methane-theming',
      'methane-ui',
    ]);

    for (const dirName of skillDirs) {
      const skillDir = resolve(skillsDir, dirName);
      const skillMdPath = resolve(skillDir, 'SKILL.md');
      expect(existsSync(skillMdPath), `Missing ${skillMdPath}`).toBe(true);

      const content = readFileSync(skillMdPath, 'utf8');
      const lines = content.split('\n');
      expect(lines.length).toBeLessThanOrEqual(150);

      const fmMatch = /^---\n([\s\S]*?)\n---\n/.exec(content);
      expect(fmMatch, `Missing YAML frontmatter in ${skillMdPath}`).not.toBeNull();

      const frontmatter = fmMatch![1]!;
      const nameMatch = /^name:\s*(.+)$/m.exec(frontmatter);
      const descMatch = /^description:\s*(.+)$/m.exec(frontmatter);
      expect(nameMatch?.[1]?.trim()).toBe(dirName);
      expect((descMatch?.[1]?.trim() ?? '').length).toBeGreaterThan(20);

      for (const linkMatch of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const target = linkMatch[1]!;
        if (/^(?:https?:|mailto:|#)/.test(target)) continue;
        const cleanTarget = target.split('#')[0]!;
        const resolved = resolve(skillDir, cleanTarget);
        expect(existsSync(resolved), `Broken relative link "${target}" in ${skillMdPath}`).toBe(
          true,
        );
      }
    }
  });

  it('uses natural product copy without internal spec-sheet jargon on home page and navbar', () => {
    const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf8');
    const forbidden = [
      '23 CSS Primitives',
      'UI deliverables',
      '0 B JS',
      'strictly acyclic',
    ];

    for (const phrase of forbidden) {
      expect(indexHtml.toLowerCase()).not.toContain(phrase.toLowerCase());
    }

    expect(indexHtml).toContain('Accessible UI components that work in every framework.');
    expect(indexHtml).toContain('CSS Layouts');
    expect(indexHtml).toContain('Browse Components');
    expect(indexHtml).toContain('/methane/guides/skills');

    const skillsGuideHtml = readFileSync(resolve(distDir, 'guides/skills/index.html'), 'utf8');
    expect(skillsGuideHtml).toContain('npx skills add MehdiNosrati/methane');
    expect(skillsGuideHtml).toContain('methane-ui');
    expect(skillsGuideHtml).toContain('methane-theming');
    expect(skillsGuideHtml).toContain('methane-ssr');
    expect(skillsGuideHtml).toContain('methane-contribute');
  });

  it('verifies every @methane/* named import and subpath in ssr.astro and quickstart.astro resolves against actual package exports', async () => {
    const repoRoot = resolve(docsRoot, '../..');
    const packageMap = new Map<string, { dir: string; exports: Record<string, unknown> }>();

    const scanPackages = (baseDir: string) => {
      for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const pkgDir = resolve(baseDir, entry.name);
        const pkgJsonPath = resolve(pkgDir, 'package.json');
        if (existsSync(pkgJsonPath)) {
          const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as {
            name?: string;
            exports?: Record<string, unknown>;
          };
          if (pkgJson.name && pkgJson.exports) {
            packageMap.set(pkgJson.name, { dir: pkgDir, exports: pkgJson.exports });
          }
        }
      }
    };

    scanPackages(resolve(repoRoot, 'packages'));
    scanPackages(resolve(repoRoot, 'packages/kits'));
    scanPackages(resolve(repoRoot, 'packages/satellites'));

    const resolveExportTarget = (
      specifier: string,
    ): { dir: string; defaultPath: string; typesPath?: string } => {
      const parts = specifier.split('/');
      const pkgName = `${parts[0]}/${parts[1]}`;
      const subpath = parts.length > 2 ? `./${parts.slice(2).join('/')}` : '.';
      const pkgInfo = packageMap.get(pkgName);
      expect(pkgInfo, `Unknown workspace package ${pkgName} in "${specifier}"`).toBeDefined();

      let target = pkgInfo!.exports[subpath];
      if (!target) {
        for (const [pattern, val] of Object.entries(pkgInfo!.exports)) {
          if (!pattern.includes('*')) continue;
          const regex = new RegExp(`^${pattern.replaceAll('.', '\\.').replaceAll('*', '(.+)')}$`);
          const match = regex.exec(subpath);
          if (match) {
            const wildcardVal = match[1]!;
            const substitute = (entry: unknown): unknown => {
              if (typeof entry === 'string') return entry.replaceAll('*', wildcardVal);
              if (entry && typeof entry === 'object') {
                return Object.fromEntries(
                  Object.entries(entry as Record<string, unknown>).map(([k, v]) => [
                    k,
                    substitute(v),
                  ]),
                );
              }
              return entry;
            };
            target = substitute(val);
            break;
          }
        }
      }

      expect(target, `Missing export "${subpath}" on ${pkgName}`).toBeDefined();
      const defaultRel =
        typeof target === 'string'
          ? target
          : ((target as { default?: string; svelte?: string }).default ??
            (target as { svelte?: string }).svelte);
      const typesRel =
        typeof target === 'object' && target !== null
          ? (target as { types?: string }).types
          : undefined;
      expect(defaultRel, `Missing default target for "${specifier}"`).toBeTruthy();

      const defaultPath = resolve(pkgInfo!.dir, defaultRel!);
      expect(existsSync(defaultPath), `Missing built export file ${defaultPath}`).toBe(true);
      return {
        dir: pkgInfo!.dir,
        defaultPath,
        ...(typesRel ? { typesPath: resolve(pkgInfo!.dir, typesRel) } : {}),
      };
    };

    const collectDeclText = (entryPath: string, seen = new Set<string>()): string => {
      if (seen.has(entryPath) || !existsSync(entryPath)) return '';
      seen.add(entryPath);
      const text = readFileSync(entryPath, 'utf8');
      const chunks = [text];
      for (const reexport of text.matchAll(/export\s+(?:\*|\{[^}]*\})\s+from\s+['"](\.[^'"]+)['"]/g)) {
        const rel = reexport[1]!.replace(/\.(?:m?js)$/, '.d.ts');
        const nextPath = resolve(entryPath, '..', rel.endsWith('.d.ts') ? rel : `${rel}.d.ts`);
        chunks.push(collectDeclText(nextPath, seen));
      }
      return chunks.join('\n');
    };

    const docFiles = [
      resolve(docsRoot, 'src/pages/guides/ssr.astro'),
      resolve(docsRoot, 'src/pages/quickstart.astro'),
    ];

    for (const file of docFiles) {
      const source = readFileSync(file, 'utf8');

      for (const namedMatch of source.matchAll(
        /import\s*\{([^}]+)\}\s*from\s*['"](@methane\/[^'"]+)['"]/g,
      )) {
        const names = namedMatch[1]!
          .split(',')
          .map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]!.trim())
          .filter(Boolean);
        const specifier = namedMatch[2]!;
        const resolved = resolveExportTarget(specifier);

        if (resolved.defaultPath.endsWith('.js')) {
          try {
            const mod = (await import(pathToFileURL(resolved.defaultPath).href)) as Record<
              string,
              unknown
            >;
            for (const symbol of names) {
              expect(
                Object.prototype.hasOwnProperty.call(mod, symbol),
                `Missing runtime export "${symbol}" in "${specifier}" (referenced in ${file})`,
              ).toBe(true);
            }
          } catch {
            const declSource = collectDeclText(resolved.typesPath ?? resolved.defaultPath);
            for (const symbol of names) {
              expect(
                declSource.includes(symbol),
                `Missing declaration for "${symbol}" in "${specifier}" (referenced in ${file})`,
              ).toBe(true);
            }
          }
        }
      }

      for (const sideEffectMatch of source.matchAll(
        /(?:import\s+['"]|src=['"])(@methane\/[^'"]+)['"]/g,
      )) {
        resolveExportTarget(sideEffectMatch[1]!);
      }
    }

    const quickstartSrc = readFileSync(resolve(docsRoot, 'src/pages/quickstart.astro'), 'utf8');
    expect(quickstartSrc).toContain('CUSTOM_ELEMENTS_SCHEMA');
    expect(quickstartSrc).toContain("import '@methane/ui/button';");
  });
});
