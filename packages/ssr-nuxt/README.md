# `@methane-ui/ssr-nuxt`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Nuxt 3 / Nitro server plugin and Vue 3 custom-element SSR adapter for **Methane UI** — built on `@methane-ui/ssr`.

## Installation

```bash
pnpm add @methane-ui/ssr-nuxt @methane-ui/ssr @methane-ui/vue @methane-ui/core
# or
npm install @methane-ui/ssr-nuxt @methane-ui/ssr @methane-ui/vue @methane-ui/core
```

## Package Exports

| Entrypoint | Environment | Exports |
| --- | --- | --- |
| `@methane-ui/ssr-nuxt` | Nuxt / Nitro Server | `createMethaneNuxtConfig`, `createMethaneNitroPlugin`, `transformNitroHtml`, `METHANE_VUE_COMPILER_OPTIONS`, `isMethaneCustomElement` |
| `@methane-ui/ssr-nuxt/client` | Browser Plugin | `createMethaneNuxtPlugin`, `initNuxtHydration`, `hydrateNuxtRoot` |

## Usage Examples

### 1. `nuxt.config.ts`

```ts
import { defineNuxtConfig } from 'nuxt/config';
import { createMethaneNuxtConfig } from '@methane-ui/ssr-nuxt';

const methaneConfig = createMethaneNuxtConfig();

export default defineNuxtConfig({
  vue: {
    compilerOptions: methaneConfig.vue.compilerOptions,
  },
  css: ['@methane-ui/tokens/tokens.css', '@methane-ui/css/index.css'],
});
```

### 2. Nitro Server Plugin (`server/plugins/methane-ssr.ts`)

```ts
import { createMethaneNitroPlugin } from '@methane-ui/ssr-nuxt';

export default defineNitroPlugin((nitroApp) => {
  const plugin = createMethaneNitroPlugin({ styles: 'linked' });
  plugin(nitroApp);
});
```

### 3. Nuxt Client Plugin (`plugins/methane.client.ts`)

```ts
import { defineNuxtPlugin } from '#app';
import { createMethaneNuxtPlugin } from '@methane-ui/ssr-nuxt/client';

export default defineNuxtPlugin(createMethaneNuxtPlugin());
```

## Notes

- Automatically marks `mth-*` custom elements via `isMethaneCustomElement` so Vue compiles them cleanly without unresolved-component warnings.
- Supports both `linked` (`/_methane/styles`) and `inline` shadow stylesheet modes through `NuxtSsrOptions`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
