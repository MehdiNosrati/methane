<script lang="ts">
  import '@methane-ui/tokens/tokens.css';
  import '@methane-ui/css/index.css';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="mth-app">
  {@render children?.()}
</div>
