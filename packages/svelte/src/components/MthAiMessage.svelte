<script lang="ts">
  import type { MthAiMessageProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthAiMessageProps = $props();
</script>

<mth-ai-message {...rest}>
  {@render children?.()}
</mth-ai-message>
