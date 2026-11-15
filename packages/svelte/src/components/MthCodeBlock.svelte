<script lang="ts">
  import type { MthCodeBlockProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthCodeBlockProps = $props();
</script>

<mth-code-block {...rest}>
  {@render children?.()}
</mth-code-block>
