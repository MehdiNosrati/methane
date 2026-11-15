import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withMethaneNextConfig, type NextConfigLike } from '@methane/ssr-next';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const ssrNextUrl = pathToFileURL(resolve(appRoot, '../../packages/ssr-next/dist/index.js')).href;
const primitivesUrl = pathToFileURL(
  resolve(appRoot, '../../packages/primitives/dist/index.js'),
).href;

function runNextSsrInNode(): {
  html: string;
  expandedTags: string[];
  linkHeader: string;
} {
  const script = `
    import { registerUtilityElements } from ${JSON.stringify(primitivesUrl)};
    import { renderNextHtml, transformNextResponse } from ${JSON.stringify(ssrNextUrl)};

    registerUtilityElements();
    const rawHtml = \`<!DOCTYPE html>
<html lang="en">
  <head><title>Next SSR</title></head>
  <body>
    <mth-skip-link href="#main">Skip to verification harness</mth-skip-link>
    <main id="main">
      <mth-visually-hidden>Screen reader verification landmark</mth-visually-hidden>
      <mth-error-boundary fallback-message="Next.js SSR harness boundary fallback">
        <section data-methane-canary-slot="true">Ready</section>
      </mth-error-boundary>
    </main>
  </body>
</html>\`;

    const rendered = await renderNextHtml(rawHtml, {
      assetBase: '/methane/styles',
      hydrationModuleUrl: '/_next/static/methane-hydrate.js',
    });
    const res = await transformNextResponse(
      new Response(rawHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
      { assetBase: '/methane/styles' },
    );
    process.stdout.write(JSON.stringify({
      html: rendered.html,
      expandedTags: rendered.expandedTags,
      linkHeader: res.headers.get('link') ?? '',
    }));
  `;

  const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: appRoot,
    encoding: 'utf8',
  });
  return JSON.parse(out) as {
    html: string;
    expandedTags: string[];
    linkHeader: string;
  };
}

describe('@methane/verify-next', () => {
  it('applies withMethaneNextConfig transpilePackages and serverExternalPackages', () => {
    const config = withMethaneNextConfig<NextConfigLike>({ reactStrictMode: true });
    expect(config.transpilePackages).toEqual([
      '@methane/ui',
      '@methane/core',
      '@methane/primitives',
    ]);
    expect(config.serverExternalPackages).toEqual(['@lit-labs/ssr', '@methane/ssr']);
  });

  it('expands Declarative Shadow DOM, hoists <link> preload tags, and emits HTTP Link header', () => {
    const result = runNextSsrInNode();
    expect(result.html).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
    expect(result.html).toContain('<link rel="preload" as="style" href="/methane/styles/');
    expect(result.html).toContain('/_next/static/methane-hydrate.js');
    expect(result.expandedTags).toContain('mth-skip-link');
    expect(result.expandedTags).toContain('mth-visually-hidden');
    expect(result.expandedTags).toContain('mth-error-boundary');
    expect(result.linkHeader).toContain('rel=preload; as=style');
  });
});
