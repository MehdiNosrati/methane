import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { createMethaneAstroIntegration } from '@methane-ui/ssr-astro';

const baseIntegration = createMethaneAstroIntegration({ injectClientHydration: false });
const serverEntrypoint = fileURLToPath(new URL('./src/lib/astro-renderer.ts', import.meta.url));
const clientEntrypoint = fileURLToPath(new URL('./src/lib/astro-client.ts', import.meta.url));

export default defineConfig({
  site: 'https://mahdins.dev',
  base: '/methane',
  outDir: './dist',
  output: 'static',
  integrations: [
    {
      name: baseIntegration.name,
      hooks: {
        'astro:config:setup': (context) => {
          baseIntegration.hooks['astro:config:setup']({
            addRenderer: (renderer) =>
              context.addRenderer({
                ...renderer,
                serverEntrypoint,
                clientEntrypoint,
              }),
            injectScript: context.injectScript,
          });
          context.injectScript('page', `import ${JSON.stringify(clientEntrypoint)};`);
        },
      },
    },
  ],
});
