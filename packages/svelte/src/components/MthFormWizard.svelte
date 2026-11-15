<script lang="ts">
  import type { MthFormWizardProps } from '../index.js';

  let {
  children,
  ...rest
  }: MthFormWizardProps = $props();
</script>

<mth-form-wizard {...rest}>
  {@render children?.()}
</mth-form-wizard>
