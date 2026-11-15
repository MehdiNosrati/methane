<script setup lang="ts">
import { ref } from 'vue';
import {
  MthButton,
  MthCombobox,
  MthDialog,
  MthField,
  MthInput,
  MthOption,
  MthOptionGroup,
} from '@methane/vue';

const canaryValue = ref('nuxt-ssr@methane.dev');
const frameworkValue = ref('lit');
const dialogOpen = ref(false);
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
            <MthField label="Canary Email Field" hint="Work or personal email" required>
              <MthInput
                v-model="canaryValue"
                name="canary-input"
                type="email"
                label="Canary Input"
                placeholder="you@methane.dev"
              />
            </MthField>
            <MthCombobox
              v-model="frameworkValue"
              name="canary-framework"
              label="Framework Target"
              clearable
            >
              <MthOptionGroup label="Web Standards">
                <MthOption value="lit">Lit 3</MthOption>
                <MthOption value="wc">Custom Elements</MthOption>
              </MthOptionGroup>
            </MthCombobox>
            <MthDialog
              v-model:open="dialogOpen"
              label="Canary Dialog"
              description="Nuxt top-layer modal verification"
              variant="confirm"
            >
              Confirm Nuxt verification
            </MthDialog>
            <MthButton variant="solid">Verify Nuxt</MthButton>
            <p data-testid="nuxt-state">{{ canaryValue }}|{{ frameworkValue }}|{{ dialogOpen }}</p>
          </section>
        </mth-error-boundary>
      </mth-stack>
    </main>
  </div>
</template>
