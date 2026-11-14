<script lang="ts">
  import type { MthDialogProps } from '../index.js';

  let {
  open = $bindable(false),
  children,
  ...rest
  }: MthDialogProps = $props();
</script>

<mth-dialog open={open} {...rest} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-dialog>
