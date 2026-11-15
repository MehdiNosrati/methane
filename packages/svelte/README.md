# `@methane-ui/svelte`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Svelte 5 runes (`$props()` / `$bindable()`) wrapper components (`@methane-ui/svelte/<Name>.svelte`) and `svelte/elements` JSX/template `HTMLElements` type definitions for `@methane-ui/*` custom elements.

## Installation

```bash
pnpm add @methane-ui/svelte @methane-ui/ui @methane-ui/core
# or
npm install @methane-ui/svelte @methane-ui/ui @methane-ui/core
```

> **Peer dependency:** `svelte ^5.0.0`.

## Package Exports

| Export | Description |
| --- | --- |
| `@methane-ui/svelte` | Side-effect `svelte/elements` `HTMLElements` type augmentation (`"mth-button": MthButtonProps`, etc.) and exported `Mth*Props` TypeScript interfaces |
| `@methane-ui/svelte/<ComponentName>.svelte` | Svelte 5 runes wrapper components (e.g. `@methane-ui/svelte/MthButton.svelte`, `@methane-ui/svelte/MthDialog.svelte`) with `$bindable()` state |
| `@methane-ui/svelte/components/<ComponentName>.svelte` | Explicit path alias for individual `.svelte` wrappers |

## Usage Examples

### Using Svelte 5 Wrapper Components with `bind:value` / `bind:open`

```svelte
<script lang="ts">
  import '@methane-ui/tokens/tokens.css';
  import '@methane-ui/ui/button';
  import '@methane-ui/ui/dialog';
  import '@methane-ui/ui/input';
  import MthButton from '@methane-ui/svelte/MthButton.svelte';
  import MthDialog from '@methane-ui/svelte/MthDialog.svelte';
  import MthInput from '@methane-ui/svelte/MthInput.svelte';

  let name = $state('');
  let open = $state(false);
</script>

<MthInput bind:value={name} placeholder="Your name" />
<MthButton variant="solid" onclick={() => (open = true)}>Preview</MthButton>

<MthDialog bind:open label="Greeting">
  <p>Hello, {name || 'world'}!</p>
</MthDialog>
```

### Using Custom Elements Directly with Type Safety

```svelte
<script lang="ts">
  import '@methane-ui/svelte';
  import '@methane-ui/ui/button';
</script>

<mth-button variant="outline" onmth-click={() => console.log('clicked')}>
  Save
</mth-button>
```

## SSR Notes

- Pair with `@methane-ui/ssr-sveltekit` for SvelteKit server hooks that serialize Lit Declarative Shadow DOM and coordinate client hydration.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
