<script lang="ts">
  import type { MthAuditLogProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthAuditLogProps = $props();
</script>

<mth-audit-log {...rest}>
  {@render children?.()}
</mth-audit-log>
