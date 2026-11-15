# `@methane/vue`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Typed Vue 3 `defineComponent` wrappers, `v-model` / `v-model:open` bindings, global `ComponentCustomProperties` / `GlobalComponents` typing, and Vite compiler helper options for **all 251 `@methane/*` custom elements**.

## Installation

```bash
pnpm add @methane/vue @methane/ui @methane/core
# or
npm install @methane/vue @methane/ui @methane/core
```

> **Peer dependency:** `vue` (`^3.4.0`).

## Exported API

| Export | Description |
| --- | --- |
| `MthAccordion`, `MthButton`, `MthDialog`, ... (251 components) | Typed Vue 3 functional wrapper components supporting `v-model`, named `emits`, and slot forwarding |
| `METHANE_VUE_COMPILER_OPTIONS` | Vue compiler `isCustomElement: (tag) => tag.startsWith('mth-')` helper for `@vitejs/plugin-vue` |
| `isMethaneVueTag(tag)` | Predicate returning `true` for `mth-*` custom element tags |
| `Mth*Props` interfaces | Typed prop interfaces exported for every component |

## Usage Examples

### Vite Configuration

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
import { METHANE_VUE_COMPILER_OPTIONS } from '@methane/vue';

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: METHANE_VUE_COMPILER_OPTIONS,
      },
    }),
  ],
};
```

### Vue SFC with `v-model` & Custom Events

```vue
<script setup lang="ts">
import '@methane/tokens/tokens.css';
import '@methane/ui/button';
import '@methane/ui/dialog';
import '@methane/ui/input';
import { ref } from 'vue';
import { MthButton, MthDialog, MthInput } from '@methane/vue';

const query = ref('');
const open = ref(false);
</script>

<template>
  <MthInput v-model="query" placeholder="Filter records..." />
  <MthButton variant="primary" @click="open = true">Open Details</MthButton>
  <MthDialog v-model:open="open" label="Record details">
    <p>Filtering by: {{ query }}</p>
  </MthDialog>
</template>
```

## Theming, A11y & SSR Notes

- **Two-Way Binding**: Value, checked, and open states map automatically (`v-model`, `v-model:checked`, `v-model:open`) from `mth-input` / `mth-change` / `mth-open` / `mth-close` events.
- **Nuxt SSR**: Pair with `@methane/ssr-nuxt` for Declarative Shadow DOM SSR and hydration sequencing.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
