import type { NextRequest } from 'next/server';

export function resolveAppRedirectUrl(pathOrUrl: string, request: NextRequest) {
  return new URL(pathOrUrl, resolveAppPublicOrigin(request));
}

export function resolveConfiguredAppPublicOrigin() {
  return parseOrigin(process.env.APP_PUBLIC_URL);
}

export function parseOrigin(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function resolveAppPublicOrigin(request: NextRequest) {
  const configuredOrigin = resolveConfiguredAppPublicOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  if (forwardedHost) {
    return `${forwardedProto ?? 'https'}://${forwardedHost}`;
  }

  return request.url;
}
