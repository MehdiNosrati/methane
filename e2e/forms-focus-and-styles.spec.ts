import { expect, test } from '@playwright/test';

test.describe('Real-browser FACE forms, focus delegation, and style invariants', () => {
  test('FACE FormData submission, form.reset(), and fieldset disabled :state(disabled)', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForFunction(() => (window as unknown as { __METHANE_READY__?: boolean }).__METHANE_READY__);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const form = document.createElement('form');
      form.id = 'face-form';
      (window as unknown as { __SUBMIT_COUNT__?: number }).__SUBMIT_COUNT__ = 0;
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        (window as unknown as { __SUBMIT_COUNT__?: number }).__SUBMIT_COUNT__ =
          ((window as unknown as { __SUBMIT_COUNT__?: number }).__SUBMIT_COUNT__ ?? 0) + 1;
      });

      const fieldset = document.createElement('fieldset');
      fieldset.id = 'face-fieldset';

      const email = document.createElement('mth-input');
      email.id = 'f-email';
      email.setAttribute('name', 'email');
      email.setAttribute('value', 'alice@methane.dev');

      const role = document.createElement('mth-select') as HTMLElement & {
        options: Array<{ value: string; label: string }>;
        value: string;
        defaultValue: string;
      };
      role.id = 'f-role';
      role.setAttribute('name', 'role');
      role.setAttribute('default-value', 'eng');
      role.value = 'eng';
      role.options = [
        { value: 'eng', label: 'Engineer' },
        { value: 'des', label: 'Designer' },
      ];

      const terms = document.createElement('mth-checkbox');
      terms.id = 'f-terms';
      terms.setAttribute('name', 'terms');
      terms.setAttribute('value', 'yes');
      terms.setAttribute('checked', '');

      const notify = document.createElement('mth-switch');
      notify.id = 'f-notify';
      notify.setAttribute('name', 'notify');
      notify.setAttribute('value', 'on');
      notify.setAttribute('checked', '');

      const submitBtn = document.createElement('mth-button');
      submitBtn.id = 'f-submit';
      submitBtn.setAttribute('type', 'submit');
      submitBtn.textContent = 'Submit Form';

      fieldset.append(email, role, terms, notify, submitBtn);
      form.append(fieldset);
      root.append(form);
    });

    const initialFormData = await page.evaluate(() => {
      const form = document.getElementById('face-form') as HTMLFormElement;
      return Object.fromEntries(new FormData(form).entries());
    });
    expect(initialFormData).toEqual({
      email: 'alice@methane.dev',
      role: 'eng',
      terms: 'yes',
      notify: 'on',
    });

    // Submit via <mth-button type="submit">
    await page.locator('#f-submit').click();
    const submitCount = await page.evaluate(
      () => (window as unknown as { __SUBMIT_COUNT__?: number }).__SUBMIT_COUNT__,
    );
    expect(submitCount).toBe(1);

    // Mutate values then reset form
    await page.evaluate(() => {
      const email = document.getElementById('f-email') as HTMLElement & { value: string };
      const role = document.getElementById('f-role') as HTMLElement & { value: string };
      const terms = document.getElementById('f-terms') as HTMLElement & { checked: boolean };
      const notify = document.getElementById('f-notify') as HTMLElement & { checked: boolean };
      email.value = 'bob@methane.dev';
      role.value = 'des';
      terms.checked = false;
      notify.checked = false;
      (document.getElementById('face-form') as HTMLFormElement).reset();
    });

    const resetState = await page.evaluate(() => {
      const form = document.getElementById('face-form') as HTMLFormElement;
      return Object.fromEntries(new FormData(form).entries());
    });
    expect(resetState).toEqual({
      email: 'alice@methane.dev',
      role: 'eng',
      terms: 'yes',
      notify: 'on',
    });

    // <fieldset disabled> triggers formDisabledCallback (:state(disabled)) without mutating disabled attr
    await page.evaluate(() => {
      (document.getElementById('face-fieldset') as HTMLFieldSetElement).disabled = true;
    });
    const disabledCheck = await page.evaluate(() =>
      ['f-email', 'f-role', 'f-terms', 'f-notify'].map((id) => {
        const el = document.getElementById(id)!;
        return {
          id,
          matchesStateDisabled: el.matches(':state(disabled)'),
          hasDisabledAttr: el.hasAttribute('disabled'),
        };
      }),
    );
    for (const item of disabledCheck) {
      expect(item.matchesStateDisabled, `Expected ${item.id} to match :state(disabled)`).toBe(true);
      expect(item.hasDisabledAttr, `Expected ${item.id} not to mutate host disabled attr`).toBe(false);
    }

    expect(pageErrors).toEqual([]);
  });

  test('Keyboard Tab focus navigation, delegatesFocus, and visual style invariants', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForFunction(() => (window as unknown as { __METHANE_READY__?: boolean }).__METHANE_READY__);

    await page.evaluate(() => {
      const root = document.getElementById('harness-root')!;
      root.replaceChildren();

      const focusSection = document.createElement('div');
      focusSection.id = 'focus-section';
      const preBtn = document.createElement('button');
      preBtn.id = 'pre-focus-btn';
      preBtn.textContent = 'Start';
      const inp = document.createElement('mth-input');
      inp.id = 'tab-input';
      inp.setAttribute('label', 'Email');
      const btn = document.createElement('mth-button');
      btn.id = 'tab-button';
      btn.textContent = 'Action';
      const chk = document.createElement('mth-checkbox');
      chk.id = 'tab-checkbox';
      chk.textContent = 'Agree';
      focusSection.append(preBtn, inp, btn, chk);

      const styleSection = document.createElement('div');
      styleSection.id = 'style-section';
      styleSection.style.display = 'flex';
      styleSection.style.gap = '12px';
      styleSection.style.flexWrap = 'wrap';
      for (const variant of ['solid', 'soft', 'outline', 'outlined', 'ghost', 'danger']) {
        const b = document.createElement('mth-button');
        b.id = `btn-${variant}`;
        b.setAttribute('variant', variant);
        b.textContent = variant;
        styleSection.append(b);
      }

      const selLtr = document.createElement('select');
      selLtr.id = 'css-select-ltr';
      selLtr.className = 'mth-select';
      selLtr.append(new Option('Alpha', 'a'), new Option('Beta', 'b'));

      const rtlWrap = document.createElement('div');
      rtlWrap.dir = 'rtl';
      const selRtl = document.createElement('select');
      selRtl.id = 'css-select-rtl';
      selRtl.className = 'mth-select';
      selRtl.append(new Option('Alpha', 'a'), new Option('Beta', 'b'));
      rtlWrap.append(selRtl);

      root.append(focusSection, styleSection, selLtr, rtlWrap);
    });

    // Tab navigation delegates focus into each shadow root
    await page.locator('#pre-focus-btn').focus();
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => ({
      activeTag: document.activeElement?.id,
      shadowFocused: Boolean(document.getElementById('tab-input')?.shadowRoot?.activeElement),
      matchesFocusVisible: document
        .getElementById('tab-input')!
        .shadowRoot!.activeElement?.matches(':focus-visible'),
    }));
    expect(firstFocus.activeTag).toBe('tab-input');
    expect(firstFocus.shadowFocused).toBe(true);
    expect(firstFocus.matchesFocusVisible).toBe(true);

    await page.keyboard.press('Tab');
    const secondFocus = await page.evaluate(() => ({
      activeTag: document.activeElement?.id,
      shadowFocused: Boolean(document.getElementById('tab-button')?.shadowRoot?.activeElement),
    }));
    expect(secondFocus.activeTag).toBe('tab-button');
    expect(secondFocus.shadowFocused).toBe(true);

    await page.keyboard.press('Tab');
    const thirdFocus = await page.evaluate(() => ({
      activeTag: document.activeElement?.id,
      shadowFocused: Boolean(document.getElementById('tab-checkbox')?.shadowRoot?.activeElement),
    }));
    expect(thirdFocus.activeTag).toBe('tab-checkbox');
    expect(thirdFocus.shadowFocused).toBe(true);

    // Button variant computed styles + outline/outlined parity
    const variantStyles = await page.evaluate(() => {
      const out: Record<string, { bg: string; borderColor: string; borderWidth: string; w: number; h: number }> = {};
      for (const variant of ['solid', 'soft', 'outline', 'outlined', 'ghost', 'danger']) {
        const host = document.getElementById(`btn-${variant}`)!;
        const ctrl = host.shadowRoot!.querySelector<HTMLElement>('[part="control"]')!;
        const cs = getComputedStyle(ctrl);
        const rect = ctrl.getBoundingClientRect();
        out[variant] = {
          bg: cs.backgroundColor,
          borderColor: cs.borderTopColor,
          borderWidth: cs.borderTopWidth,
          w: rect.width,
          h: rect.height,
        };
      }
      return out;
    });

    for (const [variant, s] of Object.entries(variantStyles)) {
      expect(s.w, `width for ${variant}`).toBeGreaterThan(0);
      expect(s.h, `height for ${variant}`).toBeGreaterThan(0);
    }
    const outlineStyle = variantStyles['outline']!;
    const outlinedStyle = variantStyles['outlined']!;
    expect({
      bg: outlinedStyle.bg,
      borderColor: outlinedStyle.borderColor,
      borderWidth: outlinedStyle.borderWidth,
      h: outlinedStyle.h,
    }).toEqual({
      bg: outlineStyle.bg,
      borderColor: outlineStyle.borderColor,
      borderWidth: outlineStyle.borderWidth,
      h: outlineStyle.h,
    });
    expect(parseFloat(outlineStyle.borderWidth)).toBeGreaterThanOrEqual(1);
    expect(outlineStyle.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(variantStyles['solid']!.bg).not.toBe(variantStyles['soft']!.bg);
    expect(variantStyles['solid']!.bg).not.toBe(variantStyles['outline']!.bg);
    expect(variantStyles['solid']!.bg).not.toBe(variantStyles['danger']!.bg);
    expect(variantStyles['ghost']!.bg).not.toBe(variantStyles['solid']!.bg);

    // select.mth-select appearance: none, paddingInlineEnd >= 32px, RTL backgroundPositionX flip
    const selectStyles = await page.evaluate(() => {
      const ltr = getComputedStyle(document.getElementById('css-select-ltr')!);
      const rtl = getComputedStyle(document.getElementById('css-select-rtl')!);
      return {
        ltrAppearance: ltr.appearance,
        ltrPaddingInlineEnd: parseFloat(ltr.paddingInlineEnd),
        ltrBgPosX: ltr.backgroundPositionX,
        rtlAppearance: rtl.appearance,
        rtlPaddingInlineEnd: parseFloat(rtl.paddingInlineEnd),
        rtlBgPosX: rtl.backgroundPositionX,
      };
    });
    expect(selectStyles.ltrAppearance).toBe('none');
    expect(selectStyles.rtlAppearance).toBe('none');
    expect(selectStyles.ltrPaddingInlineEnd).toBeGreaterThanOrEqual(32);
    expect(selectStyles.rtlPaddingInlineEnd).toBeGreaterThanOrEqual(32);
    expect(selectStyles.rtlBgPosX).not.toBe(selectStyles.ltrBgPosX);

    expect(pageErrors).toEqual([]);
  });
});
