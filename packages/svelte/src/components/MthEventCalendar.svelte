<script lang="ts">
  import type { MthEventCalendarProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthEventCalendarProps = $props();
</script>

<mth-event-calendar {...rest}>
  {@render children?.()}
</mth-event-calendar>
