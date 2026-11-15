<script setup lang="ts">
import { ref } from 'vue';
import { MthButton, MthInput } from '@methane/vue';

const canaryValue = ref('nuxt-ssr');
</script>

<template>
  <div>
    <mth-skip-link href="#main">Skip to Nuxt verification harness</mth-skip-link>
    <main id="main" class="mth-container">
      <mth-stack gap="4">
        <header class="mth-card">
          <h1>Methane Nuxt 3 SSR + Vue Verification</h1>
          <mth-visually-hidden>Nuxt screen reader landmark</mth-visually-hidden>
        </header>
        <mth-error-boundary fallback-message="Nuxt SSR harness boundary fallback">
          <section data-methane-canary-slot="true">
            <MthInput v-model="canaryValue" name="canary-input" label="Canary Input" />
            <MthButton variant="solid">Verify Nuxt</MthButton>
          </section>
        </mth-error-boundary>
      </mth-stack>
    </main>
  </div>
</template>
