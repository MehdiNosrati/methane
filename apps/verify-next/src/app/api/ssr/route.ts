import { createVerifyNextResponse } from '../../../lib/ssr-harness';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return createVerifyNextResponse();
}
