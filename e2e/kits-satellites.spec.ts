import { expect, test } from '@playwright/test';
import { assertNoErrors, openHarness } from './helpers.js';

test.describe('Domain kits, satellites & tree in real browsers', () => {
  test('mth-auth-form validates, submits credentials, and mth-mfa-challenge participates in FormData', async ({
    page,
  }) => {
    const errors = await openHarness(page, { kits: true });

    await page.setContent(`
      <mth-auth-form id="auth" mode="signin"></mth-auth-form>
      <form id="mfa-form">
        <mth-mfa-challenge id="mfa" name="otp" length="6"></mth-mfa-challenge>
      </form>
    `);

    await page.evaluate(() => {
      const auth = document.getElementById('auth')!;
      (window as unknown as { __submits: unknown[] }).__submits = [];
      auth.addEventListener('mth-submit', (event) => {
        (window as unknown as { __submits: unknown[] }).__submits.push(
          (event as CustomEvent).detail,
        );
      });
    });

    const auth = page.locator('#auth');
    // Empty submit should block and reveal validation error
    await auth.locator('[part="submit-button"]').click();
    const afterInvalidCount = await page.evaluate(
      () => (window as unknown as { __submits: unknown[] }).__submits.length,
    );
    expect(afterInvalidCount).toBe(0);
    await expect(auth.locator('[part="error"]')).toBeVisible();

    await auth.locator('#mth-af-email').fill('ada@methane.dev');
    await auth.locator('#mth-af-password').fill('correct-horse-battery');
    await auth.locator('[part="submit-button"]').click();

    const submits = await page.evaluate(
      () => (window as unknown as { __submits: Array<{ email: string; password: string }> }).__submits,
    );
    expect(submits).toHaveLength(1);
    expect(submits[0]).toMatchObject({
      email: 'ada@methane.dev',
      password: 'correct-horse-battery',
    });

    // MFA challenge: focus first digit cell and type 6 digits
    const mfaCells = page.locator('#mfa input');
    await mfaCells.first().click();
    await page.keyboard.type('482910');

    const otpValue = await page.evaluate(() => {
      const form = document.getElementById('mfa-form') as HTMLFormElement;
      return String(new FormData(form).get('otp'));
    });
    expect(otpValue).toBe('482910');

    assertNoErrors(errors);
  });

  test('mth-message-composer submits on Enter and mth-chat-thread sanitizes XSS HTML in real DOM', async ({
    page,
  }) => {
    const errors = await openHarness(page, { kits: true });

    await page.setContent(`
      <mth-chat-thread id="thread"></mth-chat-thread>
      <mth-message-composer id="composer" label="Reply"></mth-message-composer>
    `);

    await page.evaluate(() => {
      (window as unknown as { __xssTriggered?: boolean }).__xssTriggered = false;
      const thread = document.getElementById('thread') as HTMLElement & {
        messages: Array<{ id: string; author: string; body: string; self?: boolean }>;
      };
      const composer = document.getElementById('composer')!;
      thread.messages = [
        {
          id: 'm1',
          author: 'Mallory',
          body: 'Hello **safe** <img src="x" onerror="window.__xssTriggered=true"><script>window.__xssTriggered=true</script>',
        },
      ];
      composer.addEventListener('mth-submit', (event) => {
        const text = (event as CustomEvent<{ value: string }>).detail.value;
        thread.messages = [
          ...thread.messages,
          { id: `m-${thread.messages.length + 1}`, author: 'You', body: text, self: true },
        ];
      });
    });

    const thread = page.locator('#thread');
    await expect(thread.locator('[part="message-body"]').first()).toContainText('Hello safe');

    // Verify default allowRawHtml=false escapes HTML as inert text (zero img/script elements, zero XSS execution)
    const defaultReport = await page.evaluate(() => {
      const root = document.getElementById('thread')!.shadowRoot!;
      const body = root.querySelector('[part="message-body"]');
      return {
        triggered: Boolean((window as unknown as { __xssTriggered?: boolean }).__xssTriggered),
        scripts: root.querySelectorAll('script').length,
        imgs: body?.querySelectorAll('img').length ?? 0,
      };
    });
    expect(defaultReport).toEqual({
      triggered: false,
      scripts: 0,
      imgs: 0,
    });

    // Even when allowRawHtml=true, Sanitizer API (Chromium) / DOMPurify (WebKit) strips <script> and onerror
    const rawHtmlReport = await page.evaluate(async () => {
      const thread = document.getElementById('thread') as HTMLElement & {
        allowRawHtml: boolean;
        updateComplete: Promise<boolean>;
      };
      thread.allowRawHtml = true;
      await thread.updateComplete;
      const body = thread.shadowRoot!.querySelector('[part="message-body"]');
      const img = body?.querySelector('img');
      return {
        triggered: Boolean((window as unknown as { __xssTriggered?: boolean }).__xssTriggered),
        scripts: thread.shadowRoot!.querySelectorAll('script').length,
        hasStrong: Boolean(body?.querySelector('strong')),
        hasOnErrorAttr: Boolean(img?.hasAttribute('onerror')),
      };
    });
    expect(rawHtmlReport).toEqual({
      triggered: false,
      scripts: 0,
      hasStrong: true,
      hasOnErrorAttr: false,
    });

    const textarea = page.locator('#composer [part="textarea"]');
    await textarea.click();
    await page.keyboard.type('Ship WebKit coverage!');
    await page.keyboard.press('Enter');

    await expect(thread.locator('[part="message"]')).toHaveCount(2);
    await expect(thread.locator('[part="message-body"]').nth(1)).toContainText(
      'Ship WebKit coverage!',
    );

    assertNoErrors(errors);
  });

  test('mth-price-display shows sale discount and mth-cart updates quantities and checkout', async ({
    page,
  }) => {
    const errors = await openHarness(page, { kits: true });

    await page.setContent(`
      <mth-price-display id="price" amount="79" compare-at-amount="100" currency="USD"></mth-price-display>
      <mth-cart id="cart" currency="USD"></mth-cart>
    `);

    await page.evaluate(() => {
      const cart = document.getElementById('cart') as HTMLElement & {
        items: Array<{ id: string; title: string; price: number; quantity: number }>;
      };
      cart.items = [
        { id: 'item-1', title: 'Mechanical Keyboard', price: 120, quantity: 1 },
        { id: 'item-2', title: 'USB-C Cable', price: 20, quantity: 2 },
      ];
      (window as unknown as { __cartEvents: Array<{ type: string; detail: unknown }> }).__cartEvents =
        [];
      for (const name of ['mth-quantity-change', 'mth-remove-item', 'mth-checkout']) {
        cart.addEventListener(name, (event) => {
          (
            window as unknown as { __cartEvents: Array<{ type: string; detail: unknown }> }
          ).__cartEvents.push({ type: name, detail: (event as CustomEvent).detail });
        });
      }
    });

    const price = page.locator('#price');
    await expect(price.locator('[part="current"]')).toContainText('$79');
    const discountText = (await price.locator('[part="discount"]').innerText()).replace(
      /[\u2066-\u2069]/g,
      '',
    );
    expect(discountText).toContain('21%');

    const cart = page.locator('#cart');
    await expect(cart.locator('[part="summary"]')).toContainText('$160');

    // Click '+' on first item -> triggers mth-quantity-change with quantity: 2
    const plusBtn = cart.locator('.qty-btn').nth(1);
    await plusBtn.click();

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __cartEvents: Array<{ type: string; detail: unknown }> })
              .__cartEvents.length,
        ),
      )
      .toBeGreaterThanOrEqual(1);

    await cart.locator('.remove-btn').nth(1).click();
    await cart.locator('[part="checkout-button"]').click();

    const events = await page.evaluate(
      () =>
        (window as unknown as { __cartEvents: Array<{ type: string; detail: unknown }> })
          .__cartEvents,
    );
    expect(events.map((e) => e.type)).toEqual([
      'mth-quantity-change',
      'mth-remove-item',
      'mth-checkout',
    ]);
    expect(events[0].detail).toMatchObject({ id: 'item-1', quantity: 2 });
    expect(events[1].detail).toMatchObject({ id: 'item-2' });

    assertNoErrors(errors);
  });

  test('mth-datagrid renders rows and sorts ascending/descending on header click', async ({
    page,
  }) => {
    const errors = await openHarness(page, { satellites: true });

    await page.setContent(`
      <mth-datagrid id="grid" label="Benchmarks"></mth-datagrid>
    `);

    await page.evaluate(() => {
      const grid = document.getElementById('grid') as HTMLElement & {
        columns: Array<{ id: string; header: string; accessorKey: string; sortable?: boolean }>;
        rows: Array<{ name: string; score: number }>;
      };
      grid.columns = [
        { id: 'name', header: 'Engine', accessorKey: 'name', sortable: true },
        { id: 'score', header: 'Score', accessorKey: 'score', sortable: true },
      ];
      grid.rows = [
        { name: 'Charlie', score: 30 },
        { name: 'Alpha', score: 10 },
        { name: 'Bravo', score: 20 },
      ];
    });

    const grid = page.locator('#grid');
    await expect(grid.locator('.body-row')).toHaveCount(3);
    await expect(grid.locator('.body-row').first()).toContainText('Charlie');

    // Click sort on Engine -> ascending (Alpha, Bravo, Charlie)
    await grid.locator('.sort-btn').first().click();
    await expect(grid.locator('[role="columnheader"]').first()).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await expect(grid.locator('.body-row').first()).toContainText('Alpha');

    // Click again -> descending (Charlie first)
    await grid.locator('.sort-btn').first().click();
    await expect(grid.locator('[role="columnheader"]').first()).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await expect(grid.locator('.body-row').first()).toContainText('Charlie');

    assertNoErrors(errors);
  });

  test('mth-spreadsheet evaluates =SUM(A1:A2) formulas and updates on inline cell edit', async ({
    page,
  }) => {
    const errors = await openHarness(page, { satellites: true });

    await page.setContent(`
      <mth-spreadsheet id="sheet" rows="4" cols="3" label="Budget"></mth-spreadsheet>
    `);

    await page.evaluate(() => {
      const sheet = document.getElementById('sheet') as HTMLElement & {
        cells: Record<string, string>;
      };
      sheet.cells = {
        A1: '15',
        A2: '27',
        A3: '=SUM(A1:A2)',
      };
    });

    const sheet = page.locator('#sheet');
    const a1 = sheet.locator('.cell-btn[data-address="A1"]');
    const a3 = sheet.locator('.cell-btn[data-address="A3"]');

    await expect(a3).toContainText('42');

    // Edit A1 to 100 and press Enter -> A3 should recalculate to 127
    await a1.dblclick();
    const editor = sheet.locator('[part="editor"]');
    await expect(editor).toBeVisible();
    await editor.fill('100');
    await editor.press('Enter');

    await expect(a1).toContainText('100');
    await expect(a3).toContainText('127');

    assertNoErrors(errors);
  });

  test('mth-chart renders non-zero SVG bars and preserves accessible fallback table', async ({
    page,
  }) => {
    const errors = await openHarness(page, { satellites: true });

    await page.setContent(`
      <mth-chart id="chart" renderer="svg" type="bar" chart-title="Quarterly Revenue" show-fallback>
        <table slot="fallback">
          <caption>Quarterly Revenue</caption>
          <thead><tr><th>Quarter</th><th>Revenue</th></tr></thead>
          <tbody><tr><td>Q1</td><td>120</td></tr><tr><td>Q2</td><td>180</td></tr></tbody>
        </table>
      </mth-chart>
    `);

    await page.evaluate(() => {
      const chart = document.getElementById('chart') as HTMLElement & {
        categories: string[];
        data: number[];
      };
      chart.categories = ['Q1', 'Q2', 'Q3'];
      chart.data = [120, 180, 240];
    });

    const chart = page.locator('#chart');
    const svg = chart.locator('svg').first();
    await expect(svg).toBeVisible();

    const svgBox = await svg.boundingBox();
    expect(svgBox).not.toBeNull();
    expect(svgBox!.width).toBeGreaterThan(100);
    expect(svgBox!.height).toBeGreaterThan(80);

    // Fallback table remains accessible and visible when show-fallback is enabled
    const fallbackTable = chart.locator('table[slot="fallback"]');
    await expect(fallbackTable).toBeVisible();
    await expect(fallbackTable).toContainText('Q1');

    assertNoErrors(errors);
  });

  test('mth-code-editor mounts interactive editor surface and emits mth-input on typing', async ({
    page,
  }) => {
    const errors = await openHarness(page, { satellites: true });

    await page.setContent(`
      <mth-code-editor id="editor" name="snippet" label="Config" language="javascript" value="const x = 1;"></mth-code-editor>
    `);

    await page.evaluate(() => {
      const editor = document.getElementById('editor')!;
      (window as unknown as { __codeInputs: string[] }).__codeInputs = [];
      editor.addEventListener('mth-input', (event) => {
        (window as unknown as { __codeInputs: string[] }).__codeInputs.push(
          (event as CustomEvent<{ value: string }>).detail.value,
        );
      });
    });

    const editor = page.locator('#editor');
    const surface = editor.locator('.cm-content');
    await expect(surface).toBeVisible();
    await surface.click();
    await page.keyboard.type(' // ok');

    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __codeInputs: string[] }).__codeInputs.length),
      )
      .toBeGreaterThan(0);

    const currentValue = await page.evaluate(
      () => (document.getElementById('editor') as HTMLElement & { value: string }).value,
    );
    expect(currentValue).toContain('// ok');

    assertNoErrors(errors);
  });

  test('mth-tree supports expand/collapse, Arrow navigation, and Enter selection', async ({
    page,
  }) => {
    const errors = await openHarness(page);

    await page.setContent(`
      <mth-tree id="tree" label="Files">
        <mth-tree-item id="src" value="src" label="src">
          <mth-tree-item id="index" value="src/index.ts" label="index.ts"></mth-tree-item>
        </mth-tree-item>
        <mth-tree-item id="readme" value="README.md" label="README.md"></mth-tree-item>
      </mth-tree>
    `);

    await page.evaluate(() => {
      const tree = document.getElementById('tree')!;
      (window as unknown as { __treeChanges: string[] }).__treeChanges = [];
      tree.addEventListener('mth-change', (event) => {
        (window as unknown as { __treeChanges: string[] }).__treeChanges.push(
          (event as CustomEvent<{ value: string }>).detail.value,
        );
      });
    });

    const srcItem = page.locator('#src');
    const indexItem = page.locator('#index');
    await expect(srcItem).toBeVisible();
    await expect(indexItem).toBeHidden();

    // Focus first item and use ArrowRight to expand, ArrowDown to reach index.ts, Enter to select
    await srcItem.focus();
    await page.keyboard.press('ArrowRight');
    await expect(srcItem).toHaveAttribute('expanded', '');
    await expect(indexItem).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const selected = await page.evaluate(
      () => (document.getElementById('tree') as HTMLElement & { value: string }).value,
    );
    expect(selected).toBe('src/index.ts');

    const changes = await page.evaluate(
      () => (window as unknown as { __treeChanges: string[] }).__treeChanges,
    );
    expect(changes).toContain('src/index.ts');

    // ArrowLeft collapses parent or moves up
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(srcItem).not.toHaveAttribute('expanded', '');

    assertNoErrors(errors);
  });
});
