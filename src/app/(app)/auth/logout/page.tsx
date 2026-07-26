import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import type { OAuth2LogoutRequest } from '@ory/client-fetch';
import { getLogoutFlow, getServerSession } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { logAuthFlow } from '../auth-flow-log';
import { toErrorPageHref } from '../hydra-flow-error';
import { isNextRedirectError } from '../is-next-redirect-error';
import { acceptLogoutRequest } from './acceptLogoutRequest';
import { getLogoutRequest } from './getLogoutRequest';
import { LogoutUi } from './logout-ui';

type LogoutPageProps = {
  searchParams: Promise<{
    logout_challenge?: string | string[];
  }>;
};

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  try {
    const resolvedSearchParams = await searchParams;
    const logoutChallenge = Array.isArray(resolvedSearchParams.logout_challenge)
      ? resolvedSearchParams.logout_challenge[0]
      : resolvedSearchParams.logout_challenge;

    if (logoutChallenge) {
      const logoutRequest = await getLogoutRequest(logoutChallenge);
      const skipLogout = shouldSkipLogout(logoutRequest);
      logAuthFlow('logout.challenge.resolved', {
        clientId: logoutRequest.client?.client_id ?? null,
        clientName: logoutRequest.client?.client_name ?? null,
        logoutChallenge,
        skipLogout,
        subject: logoutRequest.subject ?? null,
      });

      if (skipLogout) {
        logAuthFlow('logout.challenge.skipped', {
          clientId: logoutRequest.client?.client_id ?? null,
          logoutChallenge,
        });
        const { redirectTo } = await acceptLogoutRequest(logoutChallenge);

        if (redirectTo) {
          logAuthFlow('logout.challenge.redirect', {
            clientId: logoutRequest.client?.client_id ?? null,
            logoutChallenge,
            redirectTo,
          });
          redirect(redirectTo);
        }
      }

      const locale = await resolveOryLocale({
        flow: logoutRequest,
        searchParams: resolvedSearchParams,
      });
      const displayName =
        logoutRequest.subject ??
        logoutRequest.client?.client_name ??
        logoutRequest.client?.client_id ??
        'your account';
      const confirmLogoutUrl = `/auth/logout/accept?logout_challenge=${encodeURIComponent(
        logoutChallenge,
      )}`;

      return <LogoutUi displayName={displayName} locale={locale} logoutUrl={confirmLogoutUrl} />;
    }

    const session = await getServerSession();

    if (!session?.identity) {
      redirect('/');
    }

    const traits =
      session.identity.traits && typeof session.identity.traits === 'object'
        ? (session.identity.traits as Record<string, unknown>)
        : {};
    const displayName =
      resolveOptionalString(traits.name) ||
      resolveOptionalString(traits.email) ||
      resolveOptionalString(traits.username) ||
      resolveOptionalString(traits.phone) ||
      'your account';
    const locale = await resolveOryLocale();
    const flow = await getLogoutFlow({ returnTo: '/' });

    return <LogoutUi displayName={displayName} locale={locale} logoutUrl={flow.logout_url} />;
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    logAuthFlow('logout.flow.error', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    redirect(toErrorPageHref(error));
  }
}

function shouldSkipLogout(logoutRequest: OAuth2LogoutRequest) {
    console.log('lala : ', logoutRequest.client?.skip_logout_consent)
    console.log('lolo : ', Boolean(logoutRequest.client?.skip_logout_consent))
  return Boolean(logoutRequest.client?.skip_logout_consent);
}

function resolveOptionalString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const first = resolveOptionalString((value as Record<string, unknown>).first);
    const last = resolveOptionalString((value as Record<string, unknown>).last);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last;
  }

  return null;
}
