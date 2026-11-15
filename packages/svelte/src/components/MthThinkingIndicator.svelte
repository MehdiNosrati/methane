<script lang="ts">
  import type { MthThinkingIndicatorProps } from '../index.js';

  let {
  open = $bindable(false),
  children,
  ...rest
  }: MthThinkingIndicatorProps = $props();
</script>

<mth-thinking-indicator open={open} {...rest} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-thinking-indicator>
