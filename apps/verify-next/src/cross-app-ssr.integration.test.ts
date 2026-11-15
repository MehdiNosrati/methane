import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer as createNetServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
const appRoot = resolve(__dirname, '..');
const rootRequire = createRequire(resolve(repoRoot, 'package.json'));
const appRequire = createRequire(resolve(appRoot, 'package.json'));
const vitestRequire = createRequire(rootRequire.resolve('vitest'));
const viteModuleUrl = pathToFileURL(vitestRequire.resolve('vite')).href;
const sveltePluginUrl = pathToFileURL(
  createRequire(resolve(repoRoot, 'apps/verify-sveltekit/package.json')).resolve(
    '@sveltejs/vite-plugin-svelte',
  ),
).href;
const jsdomUrl = pathToFileURL(rootRequire.resolve('jsdom')).href;
const ssrClientUrl = pathToFileURL(resolve(repoRoot, 'packages/ssr/dist/client.js')).href;
const primitivesUrl = pathToFileURL(resolve(repoRoot, 'packages/primitives/dist/index.js')).href;
const uiComponentsDir = resolve(repoRoot, 'packages/ui/dist/components');
const uiElementUrls = {
  'mth-field': pathToFileURL(resolve(uiComponentsDir, 'field/element.js')).href,
  'mth-input': pathToFileURL(resolve(uiComponentsDir, 'input/element.js')).href,
  'mth-dialog': pathToFileURL(resolve(uiComponentsDir, 'dialog/element.js')).href,
  'mth-combobox': pathToFileURL(resolve(uiComponentsDir, 'combobox/element.js')).href,
  'mth-option-group': pathToFileURL(resolve(uiComponentsDir, 'option-group/element.js')).href,
  'mth-option': pathToFileURL(resolve(uiComponentsDir, 'option/element.js')).href,
} as const;
const conformanceUrl = pathToFileURL(appRequire.resolve('@methane/test-conformance')).href;

const VERIFIED_TAGS = [
  'mth-skip-link',
  'mth-visually-hidden',
  'mth-error-boundary',
  'mth-field',
  'mth-input',
  'mth-dialog',
  'mth-combobox',
  'mth-option-group',
  'mth-option',
] as const;

function collectTagSnippets(html: string): Record<string, string> {
  const snippets: Record<string, string> = {};
  for (const tag of VERIFIED_TAGS) {
    snippets[tag] = extractFirstElementSnippet(html, tag);
  }
  return snippets;
}

interface StartedHttpHarness {
  readonly baseUrl: string;
  readonly close: () => Promise<void>;
}

async function getFreePort(): Promise<number> {
  return new Promise((resolvePort, rejectPort) => {
    const srv = createNetServer();
    srv.unref();
    srv.on('error', rejectPort);
    srv.listen(0, '127.0.0.1', () => {
      const address = srv.address();
      if (!address || typeof address === 'string') {
        srv.close(() => rejectPort(new Error('Failed to allocate ephemeral port')));
        return;
      }
      const { port } = address;
      srv.close((err) => {
        if (err) rejectPort(err);
        else resolvePort(port);
      });
    });
  });
}

async function startBuiltHttpServer(
  command: string,
  args: ReadonlyArray<string>,
  env: Record<string, string>,
  probeUrl: string,
): Promise<StartedHttpHarness & { readonly probeUrl: string }> {
  const child = spawn(command, [...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });

  const stop = async (): Promise<void> => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
    await new Promise<void>((resolveExit) => {
      if (child.exitCode !== null) {
        resolveExit();
        return;
      }
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        resolveExit();
      }, 2000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolveExit();
      });
    });
  };

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Built server exited early (${String(child.exitCode)}): ${stderr}`);
    }
    try {
      const response = await fetch(probeUrl);
      if (response.status >= 500) {
        const body = await response.text();
        await stop();
        throw new Error(`Built server returned HTTP ${response.status} at ${probeUrl}: ${body.slice(0, 300)}`);
      }
      if (response.ok) {
        return {
          baseUrl: new URL(probeUrl).origin,
          probeUrl,
          close: stop,
        };
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Built server returned HTTP')) {
        throw err;
      }
      // Server still booting
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  await stop();
  throw new Error(`Timed out waiting for built server at ${probeUrl}: ${stderr}`);
}

async function startMultiFrameworkSsrHttpServer(): Promise<StartedHttpHarness> {
  const serverScript = `
    import http from 'node:http';
    const { createServer } = await import(${JSON.stringify(viteModuleUrl)});
    const { svelte } = await import(${JSON.stringify(sveltePluginUrl)});

    const nextVite = await createServer({
      root: ${JSON.stringify(resolve(repoRoot, 'apps/verify-next'))},
      appType: 'custom',
      logLevel: 'silent',
      configFile: false,
      server: { middlewareMode: true, hmr: false },
    });
    const nuxtVite = await createServer({
      root: ${JSON.stringify(resolve(repoRoot, 'apps/verify-nuxt'))},
      appType: 'custom',
      logLevel: 'silent',
      configFile: false,
      server: { middlewareMode: true, hmr: false },
    });
    const angularVite = await createServer({
      root: ${JSON.stringify(resolve(repoRoot, 'apps/verify-angular'))},
      appType: 'custom',
      logLevel: 'silent',
      configFile: false,
      server: { middlewareMode: true, hmr: false },
    });
    const svelteVite = await createServer({
      root: ${JSON.stringify(resolve(repoRoot, 'apps/verify-sveltekit'))},
      appType: 'custom',
      logLevel: 'silent',
      configFile: false,
      plugins: [svelte()],
      server: { middlewareMode: true, hmr: false },
    });

    const server = http.createServer(async (req, res) => {
      try {
        let html = '';
        if (req.url === '/next') {
          const mod = await nextVite.ssrLoadModule('/src/lib/ssr-harness.ts');
          html = (await mod.renderVerifyNextDocument()).html;
        } else if (req.url === '/nuxt') {
          const mod = await nuxtVite.ssrLoadModule('/src/nuxt-harness.ts');
          html = (await mod.renderVerifyNuxtSsr()).fullHtml;
        } else if (req.url === '/angular') {
          const mod = await angularVite.ssrLoadModule('/src/server.ts');
          html = (await mod.renderVerifyAngularSsr()).html;
        } else if (req.url === '/sveltekit') {
          const mod = await svelteVite.ssrLoadModule('/src/lib/ssr-harness.ts');
          html = (await mod.renderVerifySvelteKitSsr()).html;
        } else {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(html);
      } catch (err) {
        res.statusCode = 500;
        res.end(String(err instanceof Error ? err.stack ?? err.message : err));
      }
    });

    await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
    const addr = server.address();
    process.stdout.write(JSON.stringify({ port: addr.port }) + '\\n');

    process.on('SIGTERM', async () => {
      server.close();
      await Promise.all([
        nextVite.close(),
        nuxtVite.close(),
        angularVite.close(),
        svelteVite.close(),
      ]);
      process.exit(0);
    });
  `;

  const child = spawn(process.execPath, ['--input-type=module', '-e', serverScript], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const port = await new Promise<number>((resolvePort, rejectPort) => {
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
      const line = stdout.split('\n')[0]?.trim();
      if (line) {
        try {
          const parsed = JSON.parse(line) as { port: number };
          resolvePort(parsed.port);
        } catch {
          // Wait for complete JSON line
        }
      }
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('exit', (code) => {
      rejectPort(new Error(`SSR HTTP server exited early (${String(code)}): ${stderr}`));
    });
  });

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
      await new Promise<void>((resolveExit) => {
        if (child.exitCode !== null) {
          resolveExit();
          return;
        }
        child.once('exit', () => resolveExit());
      });
    },
  };
}

function extractFirstElementSnippet(html: string, tagName: string): string {
  const match = new RegExp(`<${tagName}(?=[\\s>])`).exec(html);
  const start = match ? match.index : -1;
  const endTag = `</${tagName}>`;
  const end = start === -1 ? -1 : html.indexOf(endTag, start);
  if (start === -1 || end === -1) {
    throw new Error(`Could not find <${tagName}> in HTTP SSR HTML`);
  }
  return html.slice(start, end + endTag.length);
}

function verifyHydrationPurityInFreshJsdom(snippetsByTag: Record<string, string>): void {
  const script = `
    import { JSDOM } from ${JSON.stringify(jsdomUrl)};
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
    for (const key of ['window', 'document', 'Document', 'DocumentFragment', 'HTMLElement', 'HTMLTemplateElement', 'Element', 'Node', 'NodeFilter', 'Comment', 'Text', 'ShadowRoot', 'CSSStyleSheet', 'DOMParser', 'MutationObserver', 'customElements', 'Event', 'CustomEvent']) {
      Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
    }
    const { enableHydrationSupport, isHydrationSupported } = await import(${JSON.stringify(ssrClientUrl)});
    enableHydrationSupport();
    if (!isHydrationSupported()) {
      throw new Error('Hydration support was not enabled');
    }
    const primitives = await import(${JSON.stringify(primitivesUrl)});
    const [fieldMod, inputMod, dialogMod, comboboxMod, optionGroupMod, optionMod] = await Promise.all([
      import(${JSON.stringify(uiElementUrls['mth-field'])}),
      import(${JSON.stringify(uiElementUrls['mth-input'])}),
      import(${JSON.stringify(uiElementUrls['mth-dialog'])}),
      import(${JSON.stringify(uiElementUrls['mth-combobox'])}),
      import(${JSON.stringify(uiElementUrls['mth-option-group'])}),
      import(${JSON.stringify(uiElementUrls['mth-option'])}),
    ]);
    const { HydrationPuritySuite, scanSameRootAria } = await import(${JSON.stringify(conformanceUrl)});

    const classes = {
      'mth-skip-link': primitives.MthSkipLinkElement,
      'mth-visually-hidden': primitives.MthVisuallyHiddenElement,
      'mth-error-boundary': primitives.MthErrorBoundaryElement,
      'mth-field': fieldMod.MthField,
      'mth-input': inputMod.MthInput,
      'mth-dialog': dialogMod.MthDialog,
      'mth-combobox': comboboxMod.MthCombobox,
      'mth-option-group': optionGroupMod.MthOptionGroup,
      'mth-option': optionMod.MthOption,
    };

    function materializeDescendantDsd(root) {
      for (const template of Array.from(root.querySelectorAll('template[shadowrootmode]'))) {
        const host = template.parentElement;
        if (!host || host === root || host.shadowRoot) continue;
        const mode = template.getAttribute('shadowrootmode') === 'closed' ? 'closed' : 'open';
        const shadow = host.attachShadow({ mode });
        shadow.appendChild(template.content.cloneNode(true));
        template.remove();
      }
    }

    const snippets = ${JSON.stringify(snippetsByTag)};
    for (const [tagName, snippet] of Object.entries(snippets)) {
      const report = await HydrationPuritySuite.run({
        ssrHtml: snippet,
        async upgradeElement(host) {
          materializeDescendantDsd(host);
          enableHydrationSupport();
          if (!isHydrationSupported()) {
            throw new Error('Hydration support was not enabled');
          }
          if (!customElements.get(tagName)) {
            customElements.define(tagName, classes[tagName]);
          }
          customElements.upgrade(host);
          await host.updateComplete;
          const ariaResult = scanSameRootAria(host);
          if (ariaResult.issues.length > 0) {
            throw new Error(tagName + ' ARIA issues: ' + JSON.stringify(ariaResult.issues));
          }
        },
      });
      if (!report.passed) {
        throw new Error(tagName + ': ' + JSON.stringify(report.checks));
      }
    }
  `;

  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

describe('Cross-app HTTP SSR + HydrationPuritySuite integration', () => {
  it(
    'serves DSD shadowrootmode HTML over HTTP and achieves 0 shadow-DOM mutations on hydration across Next, Nuxt, Angular, and SvelteKit',
    async () => {
      const harness = await startMultiFrameworkSsrHttpServer();
      try {
        const expectations = [
          { path: '/next', marker: 'Methane Next.js 15 RSC + React 19 Verification' },
          { path: '/nuxt', marker: 'Verify Nuxt' },
          { path: '/angular', marker: 'angular-ssr@methane.dev|lit|true|true' },
          { path: '/sveltekit', marker: 'sveltekit-ssr@methane.dev|lit|true|false' },
        ] as const;

        for (const target of expectations) {
          const response = await fetch(`${harness.baseUrl}${target.path}`);
          expect(response.status, target.path).toBe(200);
          expect(response.headers.get('content-type')).toContain('text/html');
          const html = await response.text();
          expect(html, target.path).toContain(target.marker);
          expect(html, target.path).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
          expect(html, target.path).toContain('<link rel="preload" as="style"');

          verifyHydrationPurityInFreshJsdom(collectTagSnippets(html));
        }
      } finally {
        await harness.close();
      }
    },
    120_000,
  );

  it(
    'verifies the built production HTTP servers (Next, Nuxt, Angular, SvelteKit) return HTTP 200 DSD HTML when build artifacts exist',
    async () => {
      const nextBin = resolve(repoRoot, 'apps/verify-next/node_modules/.bin/next');
      const nextBuildId = resolve(repoRoot, 'apps/verify-next/.next/BUILD_ID');
      const nuxtEntry = resolve(repoRoot, 'apps/verify-nuxt/.output/server/index.mjs');
      const angularEntry = resolve(repoRoot, 'apps/verify-angular/dist/node-server/http-server.js');
      const svelteEntry = resolve(repoRoot, 'apps/verify-sveltekit/build/index.js');

      const allBuilt =
        existsSync(nextBin) &&
        existsSync(nextBuildId) &&
        existsSync(nuxtEntry) &&
        existsSync(angularEntry) &&
        existsSync(svelteEntry);

      if (!allBuilt) {
        return;
      }

      const [nextPort, nuxtPort, angularPort, sveltePort] = await Promise.all([
        getFreePort(),
        getFreePort(),
        getFreePort(),
        getFreePort(),
      ]);

      const servers = await Promise.all([
        startBuiltHttpServer(
          nextBin,
          ['start', '-p', String(nextPort), '-H', '127.0.0.1', resolve(repoRoot, 'apps/verify-next')],
          { NEXT_TELEMETRY_DISABLED: '1' },
          `http://127.0.0.1:${nextPort}/api/ssr`,
        ),
        startBuiltHttpServer(
          process.execPath,
          [nuxtEntry],
          { PORT: String(nuxtPort), HOST: '127.0.0.1', NUXT_TELEMETRY_DISABLED: '1' },
          `http://127.0.0.1:${nuxtPort}/`,
        ),
        startBuiltHttpServer(
          process.execPath,
          [angularEntry],
          { PORT: String(angularPort), HOST: '127.0.0.1' },
          `http://127.0.0.1:${angularPort}/`,
        ),
        startBuiltHttpServer(
          process.execPath,
          [svelteEntry],
          {
            PORT: String(sveltePort),
            HOST: '127.0.0.1',
            ORIGIN: `http://127.0.0.1:${sveltePort}`,
          },
          `http://127.0.0.1:${sveltePort}/`,
        ),
      ]);

      try {
        const builtExpectations = [
          {
            url: servers[0].probeUrl,
            marker: 'Methane Next.js 15 RSC + React 19 Verification',
          },
          {
            url: servers[1].probeUrl,
            marker: 'Verify Nuxt',
          },
          {
            url: servers[2].probeUrl,
            marker: 'Methane Angular 19 SSR + Reactive Forms Verification',
          },
          {
            url: servers[3].probeUrl,
            marker: 'Methane SvelteKit SSR + Svelte 5 Binding Verification',
          },
        ] as const;

        for (const target of builtExpectations) {
          const response = await fetch(target.url);
          expect(response.status, target.url).toBe(200);
          expect(response.headers.get('content-type')).toContain('text/html');
          const html = await response.text();
          expect(html, target.url).toContain(target.marker);
          expect(html, target.url).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);

          verifyHydrationPurityInFreshJsdom(collectTagSnippets(html));
        }
      } finally {
        await Promise.all(servers.map((srv) => srv.close()));
      }
    },
    120_000,
  );
});
