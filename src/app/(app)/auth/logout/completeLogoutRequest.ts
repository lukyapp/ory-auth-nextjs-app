import { logAuthFlow } from '../auth-flow-log';
import { acceptLogoutRequest } from './acceptLogoutRequest';

export async function completeLogoutRequest(logoutChallenge: string) {
  const { redirectTo } = await acceptLogoutRequest(logoutChallenge);
  const fallbackRedirectTo = redirectTo ?? '/';
  const kratosLogoutHref = `/auth/logout/kratos?return_to=${encodeURIComponent(fallbackRedirectTo)}`;

  logAuthFlow('logout.kratos.redirect', {
    logoutChallenge,
    returnTo: fallbackRedirectTo,
  });

  return {
    hydraRedirectTo: redirectTo,
    redirectTo: kratosLogoutHref,
  };
}
