<script lang="ts">
  import type { MthCalloutProps } from '../index.js';

  let {
  open = $bindable(true),
  children,
  ...rest
  }: MthCalloutProps = $props();
</script>

<mth-callout open={open} {...rest} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-callout>
