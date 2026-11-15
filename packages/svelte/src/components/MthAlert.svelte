<script lang="ts">
  import type { MthAlertProps } from '../index.js';

  let {
  open = $bindable(true),
  children,
  ...rest
  }: MthAlertProps = $props();
</script>

<mth-alert open={open} {...rest} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-alert>
