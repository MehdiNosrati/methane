<script lang="ts">
  import MthButton from '@methane/svelte/MthButton.svelte';
  import MthCheckbox from '@methane/svelte/MthCheckbox.svelte';
  import MthCombobox from '@methane/svelte/MthCombobox.svelte';
  import MthDialog from '@methane/svelte/MthDialog.svelte';
  import MthField from '@methane/svelte/MthField.svelte';
  import MthInput from '@methane/svelte/MthInput.svelte';
  import MthOption from '@methane/svelte/MthOption.svelte';
  import MthOptionGroup from '@methane/svelte/MthOptionGroup.svelte';

  let canaryValue = $state('sveltekit-ssr@methane.dev');
  let frameworkValue = $state('lit');
  let accepted = $state(true);
  let dialogOpen = $state(false);
</script>

<mth-skip-link href="#main">Skip to SvelteKit verification harness</mth-skip-link>
<main id="main" class="mth-container">
  <header class="mth-card">
    <h1>Methane SvelteKit SSR + Svelte 5 Binding Verification</h1>
    <mth-visually-hidden>SvelteKit screen reader landmark</mth-visually-hidden>
  </header>
  <mth-error-boundary fallback-message="SvelteKit SSR harness boundary fallback">
    <section data-methane-canary-slot="true">
      <MthField label="Canary Email">
        <MthInput bind:value={canaryValue} name="canary-input" label="Canary Input" />
      </MthField>
      <MthCombobox bind:value={frameworkValue} name="canary-combobox" label="Framework">
        <MthOptionGroup label="Web Standards">
          <MthOption value="lit" label="Lit 3">Lit 3</MthOption>
          <MthOption value="svelte" label="Svelte 5">Svelte 5</MthOption>
        </MthOptionGroup>
      </MthCombobox>
      <MthCheckbox bind:checked={accepted}>Accept Svelte 5 bindings</MthCheckbox>
      <MthDialog bind:open={dialogOpen} label="Canary Dialog">SvelteKit dialog content</MthDialog>
      <MthButton variant="solid">Verify SvelteKit</MthButton>
      <p data-testid="svelte-state">{canaryValue}|{frameworkValue}|{String(accepted)}|{String(dialogOpen)}</p>
    </section>
  </mth-error-boundary>
</main>
