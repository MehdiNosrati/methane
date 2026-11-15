import { expect, test } from '@playwright/test';
import { assertNoErrors, openHarness } from './helpers.js';

test.describe('FACE form controls, validation, keyboard stepping, and ElementInternals in real browsers', () => {
  test('<mth-input> supports keyboard typing, required checkValidity(), FormData, form.reset(), and disabled', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const form = document.createElement('form');
      form.id = 'inp-form';
      const inp = document.createElement('mth-input');
      inp.id = 'inp-el';
      inp.setAttribute('name', 'username');
      inp.setAttribute('label', 'Username');
      inp.setAttribute('required', '');
      form.append(inp);
      root.append(form);
    });

    const initialValidity = await page.evaluate(() => {
      const form = document.getElementById('inp-form') as HTMLFormElement;
      const inp = document.getElementById('inp-el') as HTMLElement & { checkValidity(): boolean };
      return { formValid: form.checkValidity(), elValid: inp.checkValidity() };
    });
    expect(initialValidity.formValid).toBe(false);
    expect(initialValidity.elValid).toBe(false);

    await page.locator('#inp-el').locator('input').focus();
    await page.keyboard.type('mahdi');

    const afterTyping = await page.evaluate(() => {
      const form = document.getElementById('inp-form') as HTMLFormElement;
      const inp = document.getElementById('inp-el') as HTMLElement & { value: string };
      return {
        value: inp.value,
        formValid: form.checkValidity(),
        formData: Object.fromEntries(new FormData(form).entries()),
      };
    });
    expect(afterTyping.value).toBe('mahdi');
    expect(afterTyping.formValid).toBe(true);
    expect(afterTyping.formData).toEqual({ username: 'mahdi' });

    await page.evaluate(() => {
      (document.getElementById('inp-form') as HTMLFormElement).reset();
    });
    const afterReset = await page.evaluate(() => ({
      value: (document.getElementById('inp-el') as HTMLElement & { value: string }).value,
      formValid: (document.getElementById('inp-form') as HTMLFormElement).checkValidity(),
    }));
    expect(afterReset.value).toBe('');
    expect(afterReset.formValid).toBe(false);

    await page.evaluate(() => {
      document.getElementById('inp-el')!.setAttribute('disabled', '');
    });
    const disabledState = await page.evaluate(() => {
      const inp = document.getElementById('inp-el')!;
      return {
        matchesDisabled: inp.matches(':state(disabled)'),
        nativeDisabled: inp.shadowRoot!.querySelector('input')!.disabled,
      };
    });
    expect(disabledState.matchesDisabled).toBe(true);
    expect(disabledState.nativeDisabled).toBe(true);
    assertNoErrors(errors);
  });

  test('<mth-textarea> supports multi-line typing, required validation, FormData, and form.reset()', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'ta-form';
      const ta = document.createElement('mth-textarea');
      ta.id = 'ta-el';
      ta.setAttribute('name', 'bio');
      ta.setAttribute('label', 'Bio');
      ta.setAttribute('required', '');
      form.append(ta);
      root.append(form);
    });

    expect(
      await page.evaluate(() => (document.getElementById('ta-form') as HTMLFormElement).checkValidity()),
    ).toBe(false);

    await page.locator('#ta-el').locator('textarea').focus();
    await page.keyboard.type('Line one');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Line two');

    const afterTyping = await page.evaluate(() => {
      const form = document.getElementById('ta-form') as HTMLFormElement;
      return {
        valid: form.checkValidity(),
        data: Object.fromEntries(new FormData(form).entries()),
      };
    });
    expect(afterTyping.valid).toBe(true);
    expect(afterTyping.data).toEqual({ bio: 'Line one\nLine two' });

    await page.evaluate(() => (document.getElementById('ta-form') as HTMLFormElement).reset());
    await expect(page.locator('#ta-el').locator('textarea')).toHaveValue('');
    assertNoErrors(errors);
  });

  test('<mth-checkbox> toggles via click and Space, clears indeterminate, and restores on form.reset()', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'chk-form';
      const chk = document.createElement('mth-checkbox');
      chk.id = 'chk-el';
      chk.setAttribute('name', 'agree');
      chk.setAttribute('value', 'accepted');
      chk.setAttribute('indeterminate', '');
      chk.textContent = 'Accept terms';
      form.append(chk);
      root.append(form);
    });

    const initMixed = await page.evaluate(() =>
      document.getElementById('chk-el')!.shadowRoot!.querySelector('[part="control"]')!.getAttribute('aria-checked'),
    );
    expect(initMixed).toBe('mixed');

    await page.locator('#chk-el').locator('[part="control"]').click();
    const afterClick = await page.evaluate(() => {
      const form = document.getElementById('chk-form') as HTMLFormElement;
      const chk = document.getElementById('chk-el') as HTMLElement & {
        checked: boolean;
        indeterminate: boolean;
      };
      return {
        checked: chk.checked,
        indeterminate: chk.indeterminate,
        data: Object.fromEntries(new FormData(form).entries()),
      };
    });
    expect(afterClick.checked).toBe(true);
    expect(afterClick.indeterminate).toBe(false);
    expect(afterClick.data).toEqual({ agree: 'accepted' });

    // Space toggles back off
    await page.locator('#chk-el').locator('[part="control"]').focus();
    await page.keyboard.press('Space');
    const afterSpace = await page.evaluate(() => {
      const form = document.getElementById('chk-form') as HTMLFormElement;
      return {
        checked: (document.getElementById('chk-el') as HTMLElement & { checked: boolean }).checked,
        data: Object.fromEntries(new FormData(form).entries()),
      };
    });
    expect(afterSpace.checked).toBe(false);
    expect(afterSpace.data).toEqual({});

    await page.evaluate(() => (document.getElementById('chk-form') as HTMLFormElement).reset());
    const afterReset = await page.evaluate(
      () => (document.getElementById('chk-el') as HTMLElement & { checked: boolean }).checked,
    );
    expect(afterReset).toBe(false);
    assertNoErrors(errors);
  });

  test('<mth-switch> toggles via click and Space/Enter and submits FormData', async ({ page }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'sw-form';
      const sw = document.createElement('mth-switch');
      sw.id = 'sw-el';
      sw.setAttribute('name', 'darkMode');
      sw.setAttribute('value', 'enabled');
      sw.textContent = 'Dark mode';
      form.append(sw);
      root.append(form);
    });

    await page.locator('#sw-el').locator('[part="control"]').click();
    const afterClick = await page.evaluate(() => ({
      ariaChecked: document
        .getElementById('sw-el')!
        .shadowRoot!.querySelector('[part="control"]')!
        .getAttribute('aria-checked'),
      data: Object.fromEntries(
        new FormData(document.getElementById('sw-form') as HTMLFormElement).entries(),
      ),
    }));
    expect(afterClick.ariaChecked).toBe('true');
    expect(afterClick.data).toEqual({ darkMode: 'enabled' });

    await page.locator('#sw-el').locator('[part="control"]').focus();
    await page.keyboard.press('Space');
    const afterSpace = await page.evaluate(() => ({
      checked: (document.getElementById('sw-el') as HTMLElement & { checked: boolean }).checked,
      data: Object.fromEntries(
        new FormData(document.getElementById('sw-form') as HTMLFormElement).entries(),
      ),
    }));
    expect(afterSpace.checked).toBe(false);
    expect(afterSpace.data).toEqual({});
    assertNoErrors(errors);
  });

  test('<mth-radio-group> + <mth-radio> supports click, ArrowRight/ArrowDown roving focus, FormData, and reset', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'rg-form';

      const rg = document.createElement('mth-radio-group');
      rg.id = 'rg-el';
      rg.setAttribute('name', 'plan');
      rg.setAttribute('label', 'Billing Plan');
      rg.setAttribute('orientation', 'horizontal');
      rg.setAttribute('value', 'free');

      for (const [val, text] of [
        ['free', 'Free'],
        ['pro', 'Pro'],
        ['enterprise', 'Enterprise'],
      ] as const) {
        const r = document.createElement('mth-radio');
        r.id = `radio-${val}`;
        r.setAttribute('value', val);
        r.textContent = text;
        rg.append(r);
      }

      form.append(rg);
      root.append(form);
    });

    await page.locator('#radio-free').focus();
    await page.keyboard.press('ArrowRight');

    const afterArrow = await page.evaluate(() => {
      const rg = document.getElementById('rg-el') as HTMLElement & { value: string };
      const form = document.getElementById('rg-form') as HTMLFormElement;
      return {
        value: rg.value,
        activeId: document.activeElement?.id,
        proChecked: (document.getElementById('radio-pro') as HTMLElement & { checked: boolean }).checked,
        proTabIndex: document.getElementById('radio-pro')!.tabIndex,
        freeTabIndex: document.getElementById('radio-free')!.tabIndex,
        data: Object.fromEntries(new FormData(form).entries()),
      };
    });
    expect(afterArrow.value).toBe('pro');
    expect(afterArrow.activeId).toBe('radio-pro');
    expect(afterArrow.proChecked).toBe(true);
    expect(afterArrow.proTabIndex).toBe(0);
    expect(afterArrow.freeTabIndex).toBe(-1);
    expect(afterArrow.data).toEqual({ plan: 'pro' });

    await page.locator('#radio-enterprise').click();
    expect(
      await page.evaluate(() => (document.getElementById('rg-el') as HTMLElement & { value: string }).value),
    ).toBe('enterprise');

    await page.evaluate(() => (document.getElementById('rg-form') as HTMLFormElement).reset());
    expect(
      await page.evaluate(() => (document.getElementById('rg-el') as HTMLElement & { value: string }).value),
    ).toBe('free');
    assertNoErrors(errors);
  });

  test('<mth-slider> steps via ArrowUp/ArrowDown/Home/End, clamps to min/max, and submits FormData', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'slider-form';

      const slider = document.createElement('mth-slider');
      slider.id = 'slider-el';
      slider.setAttribute('name', 'volume');
      slider.setAttribute('label', 'Volume');
      slider.setAttribute('min', '10');
      slider.setAttribute('max', '50');
      slider.setAttribute('step', '5');
      slider.setAttribute('value', '20');
      slider.setAttribute('default-value', '20');
      slider.setAttribute('show-value', '');

      form.append(slider);
      root.append(form);
    });

    const thumb = page.locator('#slider-el').locator('[part="thumb"]');
    await thumb.focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    expect(
      await page.evaluate(() => (document.getElementById('slider-el') as HTMLElement & { value: number }).value),
    ).toBe(30);

    await page.keyboard.press('ArrowDown');
    expect(
      await page.evaluate(() => (document.getElementById('slider-el') as HTMLElement & { value: number }).value),
    ).toBe(25);

    await page.keyboard.press('End');
    expect(
      await page.evaluate(() => (document.getElementById('slider-el') as HTMLElement & { value: number }).value),
    ).toBe(50);

    await page.keyboard.press('ArrowUp'); // clamped at max=50
    expect(
      await page.evaluate(() => (document.getElementById('slider-el') as HTMLElement & { value: number }).value),
    ).toBe(50);

    await page.keyboard.press('Home');
    expect(
      await page.evaluate(() => (document.getElementById('slider-el') as HTMLElement & { value: number }).value),
    ).toBe(10);

    const formData = await page.evaluate(() =>
      Object.fromEntries(new FormData(document.getElementById('slider-form') as HTMLFormElement).entries()),
    );
    expect(formData).toEqual({ volume: '10' });

    await page.evaluate(() => (document.getElementById('slider-form') as HTMLFormElement).reset());
    expect(
      await page.evaluate(() => (document.getElementById('slider-el') as HTMLElement & { value: number }).value),
    ).toBe(20);
    assertNoErrors(errors);
  });

  test('<mth-number-input> supports ArrowUp/ArrowDown/Home/End, stepper buttons, clamping, and FormData', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'num-form';

      const num = document.createElement('mth-number-input');
      num.id = 'num-el';
      num.setAttribute('name', 'qty');
      num.setAttribute('label', 'Quantity');
      num.setAttribute('min', '1');
      num.setAttribute('max', '10');
      num.setAttribute('step', '2');
      num.setAttribute('value', '3');

      form.append(num);
      root.append(form);
    });

    const input = page.locator('#num-el').locator('[part="control"]');
    await input.focus();
    await page.keyboard.press('ArrowUp');
    expect(await input.inputValue()).toBe('5');

    await page.locator('#num-el').locator('[part="increment"]').click();
    expect(await input.inputValue()).toBe('7');

    await page.locator('#num-el').locator('[part="decrement"]').click();
    expect(await input.inputValue()).toBe('5');

    await input.focus();
    await page.keyboard.press('End');
    expect(await input.inputValue()).toBe('10');

    await page.keyboard.press('Home');
    expect(await input.inputValue()).toBe('1');

    const formData = await page.evaluate(() =>
      Object.fromEntries(new FormData(document.getElementById('num-form') as HTMLFormElement).entries()),
    );
    expect(formData).toEqual({ qty: '1' });
    assertNoErrors(errors);
  });

  test('<mth-otp-input> advances focus across cells on digit typing, emits mth-complete, and submits FormData', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();
      const form = document.createElement('form');
      form.id = 'otp-form';

      const otp = document.createElement('mth-otp-input');
      otp.id = 'otp-el';
      otp.setAttribute('name', 'code');
      otp.setAttribute('label', 'Verification code');
      otp.setAttribute('length', '4');

      (window as unknown as { __OTP_COMPLETE__?: string }).__OTP_COMPLETE__ = '';
      otp.addEventListener('mth-complete', (e) => {
        (window as unknown as { __OTP_COMPLETE__?: string }).__OTP_COMPLETE__ = (
          e as CustomEvent<{ value: string }>
        ).detail.value;
      });

      form.append(otp);
      root.append(form);
    });

    await page.locator('#otp-el').locator('[part="cell"]').first().focus();
    await page.keyboard.type('4829');

    const result = await page.evaluate(() => {
      const form = document.getElementById('otp-form') as HTMLFormElement;
      const otp = document.getElementById('otp-el') as HTMLElement & { value: string };
      return {
        value: otp.value,
        completed: (window as unknown as { __OTP_COMPLETE__?: string }).__OTP_COMPLETE__,
        data: Object.fromEntries(new FormData(form).entries()),
      };
    });
    expect(result.value).toBe('4829');
    expect(result.completed).toBe('4829');
    expect(result.data).toEqual({ code: '4829' });
    assertNoErrors(errors);
  });

  test('<mth-field> propagates label, hint, error, and invalid state via ContextProtocol to <mth-input>', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const field = document.createElement('mth-field');
      field.id = 'field-el';
      field.setAttribute('label', 'Work Email');
      field.setAttribute('hint', 'Use your company domain');
      field.setAttribute('error', 'Email is invalid');
      field.setAttribute('required', '');

      const inp = document.createElement('mth-input');
      inp.id = 'field-input';
      inp.setAttribute('name', 'workEmail');
      field.append(inp);
      root.append(field);
    });

    const state = await page.evaluate(() => {
      const field = document.getElementById('field-el')!;
      const inp = document.getElementById('field-input') as HTMLElement & { checkValidity(): boolean };
      const innerInput = inp.shadowRoot!.querySelector('input')!;
      return {
        fieldText: field.shadowRoot!.textContent ?? '',
        ariaInvalid: innerInput.getAttribute('aria-invalid'),
        required: innerInput.required,
        valid: inp.checkValidity(),
      };
    });
    expect(state.fieldText).toContain('Work Email');
    expect(state.fieldText).toContain('Email is invalid');
    expect(state.ariaInvalid).toBe('true');
    expect(state.required).toBe(true);
    expect(state.valid).toBe(false);
    assertNoErrors(errors);
  });
});
