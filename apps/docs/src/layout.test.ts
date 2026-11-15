// @vitest-environment jsdom
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(docsRoot, 'dist');

function collectCssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectCssFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      out.push(full);
    }
  }
  return out;
}

describe('@methane-ui/docs desktop app-shell layout (>= 960px / 60rem)', () => {
  it('places .docs-sidebar beside .docs-main in a 2-column grid with sticky header and sidebar', () => {
    const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf8');
    const doc = new DOMParser().parseFromString(indexHtml, 'text/html');

    const shell = doc.querySelector('.mth-app-shell');
    const header = shell?.querySelector(':scope > .docs-header');
    const sidebar = shell?.querySelector(':scope > .docs-sidebar');
    const main = shell?.querySelector(':scope > .docs-main');
    const aside = shell?.querySelector(
      ':scope > .mth-app-shell-aside, :scope > [data-region="aside"]',
    );

    expect(shell).not.toBeNull();
    expect(header).not.toBeNull();
    expect(sidebar).not.toBeNull();
    expect(main).not.toBeNull();
    expect(aside).toBeNull();

    const combinedCss = collectCssFiles(distDir)
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    // .mth-app-shell must NOT declare container-type: inline-size (which caused the @container self-query bug)
    expect(combinedCss).not.toMatch(/\.mth-app-shell\{[^}]*container-type:/);

    // Must provide desktop @media (width >= 60rem) / (min-width: 60rem) 2-col layout + sticky sidebar
    const mediaPattern =
      /@media\s*\(\s*(?:width\s*>=\s*60rem|min-width\s*:\s*60rem)\s*\)\s*\{([\s\S]*?\})\s*\}/g;
    const mediaBodies = [...combinedCss.matchAll(mediaPattern)].map((m) => m[1] ?? '').join('\n');

    expect(mediaBodies.length).toBeGreaterThan(0);
    expect(mediaBodies).toContain('sidebar main');
    expect(mediaBodies).toMatch(/minmax\(0,\s*1fr\)/);
    expect(mediaBodies).toContain('.docs-sidebar');
    expect(mediaBodies).toContain('position:sticky');
    expect(mediaBodies).toContain('inset-block-start:3.5rem');

    // Verify grid-area assignments place sidebar and main into separate side-by-side columns
    expect(combinedCss).toMatch(/\.mth-app-shell-sidebar[^{]*\{[^}]*grid-area:sidebar/);
    expect(combinedCss).toMatch(/\.mth-app-shell-main[^{]*\{[^}]*grid-area:main/);

    // Verify sticky header styles
    expect(combinedCss).toMatch(/\.docs-header\{[^}]*position:sticky/);
    expect(combinedCss).toMatch(/\.docs-header\{[^}]*inset-block-start:0/);
  });
});
