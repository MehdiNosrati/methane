# Framework Integration Patterns

Always register each custom element you render (e.g. `import '@methane-ui/ui/button'`) alongside your framework wrapper or type package.

## React 19 (Native Custom Elements)

Import `@methane-ui/react` once for `JSX.IntrinsicElements` typing and `onmth-*` event props:

```tsx
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/css/index.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/input';
import '@methane-ui/react';
import { useState } from 'react';

export function ProfileForm() {
  const [name, setName] = useState('');

  return (
    <mth-stack data-gap="4">
      <mth-input
        label="Display name"
        value={name}
        onmth-input={(e) => setName((e.target as HTMLInputElement).value)}
      />
      <mth-button variant="solid" onmth-press={() => console.log(name)}>
        Save
      </mth-button>
    </mth-stack>
  );
}
```

### React 18 Legacy (`@methane-ui/react/legacy`)

Use `@lit/react` wrapper components with camelCase event props (`onMthInput`, `onMthPress`, `onMthClose`):

```tsx
import '@methane-ui/ui/button';
import '@methane-ui/ui/dialog';
import { MthButton, MthDialog } from '@methane-ui/react/legacy';
```

## Vue 3 (`@methane-ui/vue`)

Configure `METHANE_VUE_COMPILER_OPTIONS` in `vite.config.ts` so Vue treats `mth-*` tags as custom elements, and use `v-model` / `v-model:open`:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
import { METHANE_VUE_COMPILER_OPTIONS } from '@methane-ui/vue';

export default {
  plugins: [vue({ template: { compilerOptions: METHANE_VUE_COMPILER_OPTIONS } })],
};
```

```vue
<script setup lang="ts">
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/dialog';
import '@methane-ui/ui/input';
import { ref } from 'vue';
import { MthButton, MthDialog, MthInput } from '@methane-ui/vue';

const query = ref('');
const open = ref(false);
</script>

<template>
  <MthInput v-model="query" placeholder="Search..." />
  <MthButton variant="solid" @mth-press="open = true">Details</MthButton>
  <MthDialog v-model:open="open" label="Details">
    <p>{{ query }}</p>
  </MthDialog>
</template>
```

## Angular 17+ (`@methane-ui/angular`)

Include `CUSTOM_ELEMENTS_SCHEMA` on standalone components and import `Mth*Directive` (or `METHANE_ANGULAR_DIRECTIVES`) for typed `@Input()` / `@Output()` and `ControlValueAccessor` bindings:

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/input';
import { MthButtonDirective, MthInputDirective } from '@methane-ui/angular';

@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ReactiveFormsModule, MthButtonDirective, MthInputDirective],
  template: `
    <mth-input [formControl]="email" type="email"></mth-input>
    <mth-button variant="solid" (mthPress)="submit()">Sign in</mth-button>
  `,
})
export class LoginComponent {
  email = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  submit() {}
}
```

## Svelte 5 (`@methane-ui/svelte`)

Use runes wrapper components (`@methane-ui/svelte/Mth*.svelte`) for `bind:value` / `bind:open`, or import `@methane-ui/svelte` for native `<mth-*>` `HTMLElements` typing:

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
<MthButton variant="solid" onclick={() => (open = true)}>Open</MthButton>
<MthDialog bind:open label="Greeting">
  <p>Hello, {name}</p>
</MthDialog>
```
