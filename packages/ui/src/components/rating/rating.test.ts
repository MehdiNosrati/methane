import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  FormControlSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthRating, registerMthRating, ratingSpec } from './index.js';

describe('<mth-rating>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, FormControlSuite, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(ratingSpec);
    expect(compiled.tests).toContain('<mth-rating>');

    let mounted: MthRating | null = null;
    const specReport = await runBehaviorSpecAssertions(ratingSpec, {
      formControl: {
        mount: () => {
          mounted = document.createElement('mth-rating') as MthRating;
          mounted.label = 'Quality';
          return mounted;
        },
        setValue: async (el, val) => {
          (el as MthRating).value = val;
          await (el as MthRating).updateComplete;
        },
        getValue: (el) => (el as MthRating).value,
        nextValue: '4',
        getFormDataValue: (formData, name) => {
          const nativeVal = formData.get(name);
          if (nativeVal !== null) return nativeVal;
          const hasNativeFace =
            typeof ElementInternals !== 'undefined' &&
            typeof ElementInternals.prototype.setFormValue === 'function';
          if (hasNativeFace || !mounted) return null;
          return mounted.isEffectivelyDisabled ? null : mounted.value;
        },
        getInternalDisabled: (el) =>
          Array.from((el as MthRating).shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="star"]')).every(
            (b) => b.disabled,
          ),
        isRequiredInvalid: (el) => !(el as MthRating).checkValidity(),
      },
      rovingFocus: {
        mount: async (dir) => {
          const r = document.createElement('mth-rating') as MthRating;
          if (dir) r.setAttribute('dir', dir);
          document.body.appendChild(r);
          await r.updateComplete;
          return r;
        },
        getItems: (el) =>
          Array.from((el as MthRating).shadowRoot!.querySelectorAll<HTMLElement>('[part="star"]')),
        orientation: 'horizontal',
        loop: true,
      },
    });
    expect(specReport.passed).toBe(true);

    const standaloneFc = await FormControlSuite.run({
      mount: () => {
        mounted = document.createElement('mth-rating') as MthRating;
        return mounted;
      },
      setValue: async (el, val) => {
        (el as MthRating).value = val;
        await (el as MthRating).updateComplete;
      },
      getValue: (el) => (el as MthRating).value,
      nextValue: '5',
      getFormDataValue: (formData, name) => {
        const nativeVal = formData.get(name);
        if (nativeVal !== null) return nativeVal;
        const hasNativeFace =
          typeof ElementInternals !== 'undefined' &&
          typeof ElementInternals.prototype.setFormValue === 'function';
        if (hasNativeFace || !mounted) return null;
        return mounted.isEffectivelyDisabled ? null : mounted.value;
      },
      getInternalDisabled: (el) =>
        Array.from((el as MthRating).shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="star"]')).every(
          (b) => b.disabled,
        ),
      isRequiredInvalid: (el) => !(el as MthRating).checkValidity(),
    });
    expect(standaloneFc.passed).toBe(true);

    const standaloneRoving = await RovingFocusSuite.run({
      mount: async (dir) => {
        const r = document.createElement('mth-rating') as MthRating;
        if (dir) r.setAttribute('dir', dir);
        document.body.appendChild(r);
        await r.updateComplete;
        return r;
      },
      getItems: (el) =>
        Array.from((el as MthRating).shadowRoot!.querySelectorAll<HTMLElement>('[part="star"]')),
      orientation: 'horizontal',
      loop: true,
    });
    expect(standaloneRoving.passed).toBe(true);

    const ariaScan = scanSameRootAria(mounted!.shadowRoot!);
    expect(ariaScan.issues).toEqual([]);
  });

  it('supports click selection, clearable toggle, keyboard Space/Enter, and half-star precision display', async () => {
    const r = document.createElement('mth-rating') as MthRating;
    r.clearable = true;
    r.precision = 0.5;
    document.body.appendChild(r);
    await r.updateComplete;

    let lastDetail: { value: string; rating: number } | null = null;
    r.addEventListener('mth-change', (e) => {
      lastDetail = (e as CustomEvent<{ value: string; rating: number }>).detail;
    });

    const stars = r.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="star"]');
    stars[2]!.click();
    await r.updateComplete;
    expect(r.value).toBe('3');
    expect(lastDetail).toEqual({ value: '3', rating: 3 });

    stars[2]!.click();
    await r.updateComplete;
    expect(r.value).toBe('');

    stars[3]!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await r.updateComplete;
    expect(r.value).toBe('4');

    r.value = '3.5';
    await r.updateComplete;
    expect(stars[3]!.dataset.state).toBe('half');
  });

  it('hydrates cleanly under SSR DSD', async () => {
    registerMthRating();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-rating name="score" label="Score" value="4"></mth-rating>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-rating>', 'hyd-rating>')
      .replaceAll('<mth-rating', '<hyd-rating');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthRating('hyd');
        customElements.upgrade(host);
        await (host as MthRating).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
