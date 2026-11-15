<script lang="ts">
  import type { MthMarkdownProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthMarkdownProps = $props();
</script>

<mth-markdown {...rest}>
  {@render children?.()}
</mth-markdown>
