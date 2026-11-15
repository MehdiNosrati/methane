<script lang="ts">
  import type { MthFullscreenOverlayProps } from '../index.js';

  let {
  open = $bindable(false),
  children,
  ...rest
  }: MthFullscreenOverlayProps = $props();
</script>

<mth-fullscreen-overlay open={open} {...rest} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-fullscreen-overlay>
