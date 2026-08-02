import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import type { OAuth2LogoutRequest } from '@ory/client-fetch';
import { getServerSession } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { logAuthFlow } from '../auth-flow-log';
import { toErrorPageHref } from '../hydra-flow-error';
import { isNextRedirectError } from '../is-next-redirect-error';
import { completeLogoutRequest } from './completeLogoutRequest';
import { getLogoutRequest } from './getLogoutRequest';
import { LogoutUi } from './logout-ui';

type LogoutPageProps = {
  searchParams: Promise<{
    logout_challenge?: string | string[];
    logout_confirmed?: string | string[];
    return_to?: string | string[];
  }>;
};

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  try {
    const resolvedSearchParams = await searchParams;
    const logoutChallenge = Array.isArray(resolvedSearchParams.logout_challenge)
      ? resolvedSearchParams.logout_challenge[0]
      : resolvedSearchParams.logout_challenge;
    const logoutConfirmed = Array.isArray(resolvedSearchParams.logout_confirmed)
      ? resolvedSearchParams.logout_confirmed[0]
      : resolvedSearchParams.logout_confirmed;
    const returnTo = sanitizeLocalReturnTo(
      Array.isArray(resolvedSearchParams.return_to)
        ? resolvedSearchParams.return_to[0]
        : resolvedSearchParams.return_to,
    );

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
        const { hydraRedirectTo, redirectTo } = await completeLogoutRequest(logoutChallenge);

        if (redirectTo) {
          logAuthFlow('logout.challenge.redirect', {
            clientId: logoutRequest.client?.client_id ?? null,
            hydraRedirectTo,
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
      const oryConfig = createOryConfig(locale);
      const displayName = resolveLogoutDisplayName(logoutRequest);
      const confirmLogoutUrl = `/auth/logout/accept?logout_challenge=${encodeURIComponent(
        logoutChallenge,
      )}`;
      const cancelLogoutUrl = `/auth/logout/reject?logout_challenge=${encodeURIComponent(
        logoutChallenge,
      )}`;

      return (
        <LogoutUi
          cancelUrl={cancelLogoutUrl}
          displayName={displayName}
          config={oryConfig}
          logoutUrl={confirmLogoutUrl}
        />
      );
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
    const locale = await resolveOryLocale({
      searchParams: resolvedSearchParams,
    });
    const oryConfig = createOryConfig(locale);
    const logoutUrl = toKratosLogoutHref(returnTo ?? '/');

    if (logoutConfirmed === '1') {
      redirect(logoutUrl);
    }

    return (
      <LogoutUi
        cancelUrl={returnTo ?? '/'}
        displayName={displayName}
        config={oryConfig}
        logoutUrl={logoutUrl}
      />
    );
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
  return Boolean(logoutRequest.client?.skip_logout_consent);
}

function toKratosLogoutHref(returnTo: string) {
  return `/auth/logout/kratos?return_to=${encodeURIComponent(returnTo)}`;
}

function sanitizeLocalReturnTo(returnTo?: string | null) {
  if (!returnTo?.startsWith('/') || returnTo.startsWith('//')) {
    return null;
  }

  return returnTo;
}

function resolveLogoutDisplayName(logoutRequest: OAuth2LogoutRequest) {
  const claims = decodeIdTokenHintClaims(logoutRequest.request_url);

  return (
    resolveOptionalString(claims?.email) ||
    resolveOptionalString(claims?.name) ||
    resolveOptionalString(claims?.preferred_username) ||
    resolveOptionalString(claims?.sub) ||
    logoutRequest.subject ||
    'your account'
  );
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

function resolveIdTokenHint(requestUrl?: string | null) {
  return resolveLogoutRequestParam(requestUrl, 'id_token_hint');
}

function resolveLogoutRequestParam(requestUrl: string | null | undefined, param: string) {
  if (!requestUrl) {
    return null;
  }

  try {
    const value = new URL(requestUrl, 'http://localhost').searchParams.get(param);

    return value?.trim() || null;
  } catch {
    return null;
  }
}

function decodeIdTokenHintClaims(requestUrl?: string | null) {
  const idTokenHint = resolveIdTokenHint(requestUrl);
  const payload = idTokenHint?.split('.')[1];

  if (!payload) {
    return null;
  }

  try {
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as unknown;

    return typeof decodedPayload === 'object' && decodedPayload !== null
      ? (decodedPayload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
