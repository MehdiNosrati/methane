import { expect, type Page } from '@playwright/test';

export interface ErrorCollectors {
  readonly pageErrors: string[];
  readonly consoleErrors: string[];
}

export function attachErrorCollectors(page: Page): ErrorCollectors {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return { pageErrors, consoleErrors };
}

export function assertNoErrors(errors: ErrorCollectors): void {
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
}

export async function openHarness(
  page: Page,
  options: { kits?: boolean; satellites?: boolean } = {},
): Promise<ErrorCollectors> {
  const errors = attachErrorCollectors(page);
  const params = new URLSearchParams();
  if (options.kits) params.set('kits', '1');
  if (options.satellites) params.set('satellites', '1');
  const query = params.toString();
  await page.goto(query ? `/?${query}` : '/');

  await page.waitForFunction(
    ({ kits, satellites }) => {
      const win = window as unknown as {
        __METHANE_READY__?: boolean;
        __METHANE_KITS_READY__?: boolean;
        __METHANE_SATELLITES_READY__?: boolean;
      };
      if (!win.__METHANE_READY__) return false;
      if (kits && !win.__METHANE_KITS_READY__) return false;
      if (satellites && !win.__METHANE_SATELLITES_READY__) return false;
      return true;
    },
    { kits: Boolean(options.kits), satellites: Boolean(options.satellites) },
  );

  return errors;
}
