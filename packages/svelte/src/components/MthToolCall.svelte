<script lang="ts">
  import type { MthToolCallProps } from '../index.js';

  let {
  open = $bindable(false),
  children,
  ...rest
  }: MthToolCallProps = $props();
</script>

<mth-tool-call open={open} {...rest} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-tool-call>
