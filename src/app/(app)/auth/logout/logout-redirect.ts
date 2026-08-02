import { parseOrigin, resolveAppRedirectUrl } from '../public-url';

const defaultHydraLogoutOrigin = 'https://oauth.dhe.ovh';

export { resolveAppRedirectUrl };

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

function resolveHydraLogoutOrigin() {
  return (
    parseOrigin(process.env.ORY_HYDRA_PUBLIC_URL) ??
    parseOrigin(process.env.NEXT_PUBLIC_ORY_HYDRA_PUBLIC_URL) ??
    defaultHydraLogoutOrigin
  );
}
