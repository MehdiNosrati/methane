<script lang="ts">
  import '@methane/tokens/tokens.css';
  import '@methane/css/index.css';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="mth-app">
  {@render children?.()}
</div>
