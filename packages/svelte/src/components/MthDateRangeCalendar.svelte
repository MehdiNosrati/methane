<script lang="ts">
  import type { MthDateRangeCalendarProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthDateRangeCalendarProps = $props();
</script>

<mth-date-range-calendar {...rest}>
  {@render children?.()}
</mth-date-range-calendar>
