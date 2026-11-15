<script lang="ts">
  import type { MthBottomSheetProps } from '../index.js';

  let {
  open = $bindable(false),
  children,
  ...rest
  }: MthBottomSheetProps = $props();
</script>

<mth-bottom-sheet open={open} {...rest} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-bottom-sheet>
