<script lang="ts">
  import type { MthAiFeedbackProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthAiFeedbackProps = $props();
</script>

<mth-ai-feedback {...rest}>
  {@render children?.()}
</mth-ai-feedback>
