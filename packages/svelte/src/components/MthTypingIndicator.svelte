<script lang="ts">
  import type { MthTypingIndicatorProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthTypingIndicatorProps = $props();
</script>

<mth-typing-indicator {...rest}>
  {@render children?.()}
</mth-typing-indicator>
