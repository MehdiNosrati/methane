<script lang="ts">
  import type { MthCommentThreadProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCommentThreadProps = $props();
</script>

<mth-comment-thread {...rest}>
  {@render children?.()}
</mth-comment-thread>
