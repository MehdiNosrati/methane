<script lang="ts">
  import type { MthSuggestionChipsProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthSuggestionChipsProps = $props();
</script>

<mth-suggestion-chips {...rest}>
  {@render children?.()}
</mth-suggestion-chips>
