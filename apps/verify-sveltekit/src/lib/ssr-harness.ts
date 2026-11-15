import { registerUtilityElements } from '@methane/primitives';
import {
  createMethaneHandle,
  transformSvelteKitHtml,
  type SvelteKitSsrOptions,
} from '@methane/ssr-sveltekit';
import { registerAllComponents } from '@methane/ui';
import { render } from 'svelte/server';
import Page from '../routes/+page.svelte';

export interface VerifySvelteKitResult {
  readonly html: string;
  readonly expandedTags: Awaited<ReturnType<typeof transformSvelteKitHtml>>['expandedTags'];
  readonly links: Awaited<ReturnType<typeof transformSvelteKitHtml>>['links'];
  readonly rawBodyHtml: string;
}

export function renderVerifySvelteKitDocument(): {
  readonly rawHtml: string;
  readonly rawBodyHtml: string;
} {
  registerUtilityElements();
  registerAllComponents();
  const rendered = render(Page);
  const rawHtml = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Methane SvelteKit SSR Verification</title>',
    rendered.head,
    '</head>',
    `<body>${rendered.body}</body>`,
    '</html>',
  ].join('');
  return { rawHtml, rawBodyHtml: rendered.body };
}

export async function renderVerifySvelteKitSsr(
  options: SvelteKitSsrOptions = {},
): Promise<VerifySvelteKitResult> {
  const { rawHtml, rawBodyHtml } = renderVerifySvelteKitDocument();
  const resolvedOptions: SvelteKitSsrOptions = {
    assetBase: '/methane/styles',
    hydrationModuleUrl: '/assets/methane-sveltekit-hydrate.js',
    ...options,
  };

  const metadata = await transformSvelteKitHtml(rawHtml, resolvedOptions);
  const handle = createMethaneHandle(resolvedOptions);
  const response = await handle({
    event: { url: new URL('http://localhost/') },
    resolve: async (_event, resolveOpts) => {
      const chunkOne = resolveOpts?.transformPageChunk
        ? await resolveOpts.transformPageChunk({
            html: rawHtml.slice(0, Math.floor(rawHtml.length / 2)),
            done: false,
          })
        : '';
      const chunkTwo = resolveOpts?.transformPageChunk
        ? await resolveOpts.transformPageChunk({
            html: rawHtml.slice(Math.floor(rawHtml.length / 2)),
            done: true,
          })
        : rawHtml;
      return new Response(`${chunkOne}${chunkTwo}`, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    },
  });

  const html = await response.text();
  return {
    html,
    expandedTags: metadata.expandedTags,
    links: metadata.links,
    rawBodyHtml,
  };
}
