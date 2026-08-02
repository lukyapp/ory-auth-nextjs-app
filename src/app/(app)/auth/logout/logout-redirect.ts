import type { NextRequest } from 'next/server';

const defaultHydraLogoutOrigin = 'https://oauth.dhe.ovh';

export function resolveAppRedirectUrl(pathOrUrl: string, request: NextRequest) {
  return new URL(pathOrUrl, resolveAppPublicOrigin(request));
}

export function sanitizeLogoutReturnTo(returnTo: string | null) {
  if (!returnTo) {
    return null;
  }

  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  try {
    const url = new URL(returnTo);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const isHydraLogoutReturn =
      url.origin === resolveHydraLogoutOrigin() && url.pathname === '/oauth2/sessions/logout';

    return (isLocalhost || isHydraLogoutReturn) && ['http:', 'https:'].includes(url.protocol)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function resolveAppPublicOrigin(request: NextRequest) {
  const configuredOrigin = parseOrigin(process.env.APP_PUBLIC_URL);

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

function resolveHydraLogoutOrigin() {
  return (
    parseOrigin(process.env.ORY_HYDRA_PUBLIC_URL) ??
    parseOrigin(process.env.NEXT_PUBLIC_ORY_HYDRA_PUBLIC_URL) ??
    defaultHydraLogoutOrigin
  );
}

function parseOrigin(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
