<script lang="ts">
  import type { MthNotificationCenterProps } from '../index.js';

  let {
  open = $bindable(false),
  children,
  ...rest
  }: MthNotificationCenterProps = $props();
</script>

<mth-notification-center open={open} {...rest} onmth-open={(e: Event) => { open = true; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-open"]?.(e); }} onmth-close={(e: Event) => { open = false; (rest as Record<string, ((ev: Event) => void) | undefined>)["onmth-close"]?.(e); }}>
  {@render children?.()}
</mth-notification-center>
