<script lang="ts">
  import type { MthLottieProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthLottieProps = $props();
</script>

<mth-lottie {...rest}>
  {@render children?.()}
</mth-lottie>
