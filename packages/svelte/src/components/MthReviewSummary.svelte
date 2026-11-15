<script lang="ts">
  import type { MthReviewSummaryProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthReviewSummaryProps = $props();
</script>

<mth-review-summary {...rest}>
  {@render children?.()}
</mth-review-summary>
