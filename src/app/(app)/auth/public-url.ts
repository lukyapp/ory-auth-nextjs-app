import type { NextRequest } from 'next/server';
import { validateContinuationUrl } from './redirect-validation';

export function resolveInternalAppUrl(path: string, request: NextRequest) {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('Internal application redirects must use an absolute path.');
  }

  return new URL(path, resolveAppPublicOrigin(request));
}

export function resolveHydraContinuationUrl(value: string) {
  return validateContinuationUrl(value);
}

export function resolveConfiguredAppPublicOrigin() {
  return parseOrigin(process.env.APP_PUBLIC_URL);
}

export function parseOrigin(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

function resolveAppPublicOrigin(request: NextRequest) {
  const configuredOrigin = resolveConfiguredAppPublicOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  return request.nextUrl.origin;
}
