import 'server-only';
import type { NextRequest } from 'next/server';
import { HydraFlowError } from './hydra-flow-error';
import { resolveConfiguredAppPublicOrigin } from './public-url';

export function assertSameOriginPost(request: NextRequest) {
  const origin = request.headers.get('origin');
  const expectedOrigin = resolveConfiguredAppPublicOrigin() ?? request.nextUrl.origin;

  if (!origin || origin !== expectedOrigin) {
    throw new HydraFlowError('Invalid auth action origin.', {
      code: 'auth_action_origin_invalid',
      description: 'Unable to verify this authentication action.',
      status: 403,
    });
  }
}

export function noStoreHeaders() {
  return {
    'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
  };
}
