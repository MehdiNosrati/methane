<script lang="ts">
  import MthButton from '@methane/svelte/MthButton.svelte';
  import MthCheckbox from '@methane/svelte/MthCheckbox.svelte';
  import MthDialog from '@methane/svelte/MthDialog.svelte';
  import MthInput from '@methane/svelte/MthInput.svelte';

  let canaryValue = $state('sveltekit-ssr');
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
      <MthInput bind:value={canaryValue} name="canary-input" label="Canary Input" />
      <MthCheckbox bind:checked={accepted}>Accept Svelte 5 bindings</MthCheckbox>
      <MthDialog bind:open={dialogOpen} label="Canary Dialog">SvelteKit dialog content</MthDialog>
      <MthButton variant="solid">Verify SvelteKit</MthButton>
      <p data-testid="svelte-state">{canaryValue}|{String(accepted)}|{String(dialogOpen)}</p>
    </section>
  </mth-error-boundary>
</main>
