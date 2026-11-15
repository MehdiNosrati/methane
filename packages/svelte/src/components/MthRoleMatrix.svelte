<script lang="ts">
  import type { MthRoleMatrixProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthRoleMatrixProps = $props();
</script>

<mth-role-matrix {...rest}>
  {@render children?.()}
</mth-role-matrix>
