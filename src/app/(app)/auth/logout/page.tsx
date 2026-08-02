import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { getServerSession } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { logAuthFlow } from '../auth-flow-log';
import { createAuthIntentToken } from '../auth-intent';
import { toErrorPageHref } from '../hydra-flow-error';
import { isNextRedirectError } from '../is-next-redirect-error';
import { getLogoutRequest } from './getLogoutRequest';
import { resolveRegisteredPostLogout } from './logout-post-redirect';
import { LogoutUi } from './logout-ui';

export const dynamic = 'force-dynamic';

type LogoutPageProps = {
  searchParams: Promise<{
    logout_challenge?: string | string[];
    return_to?: string | string[];
  }>;
};

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  try {
    const params = await searchParams;
    const logoutChallenge = first(params.logout_challenge);
    const returnTo = sanitizeLocalReturnTo(first(params.return_to)) ?? '/';

    if (logoutChallenge) {
      const logoutRequest = await getLogoutRequest(logoutChallenge);
      const { redirectTo } = resolveRegisteredPostLogout(logoutRequest);
      const locale = await resolveOryLocale({ flow: logoutRequest, searchParams: params });

      logAuthFlow('logout.challenge.resolved', {
        clientId: logoutRequest.client?.client_id ?? null,
        logoutChallenge,
        subject: logoutRequest.subject ?? null,
      });

      return (
        <LogoutUi
          autoSubmit={Boolean(logoutRequest.client?.skip_logout_consent)}
          cancelAction={{
            challenge: logoutChallenge,
            intentToken: createAuthIntentToken({
              action: 'logout-cancel',
              challenge: logoutChallenge,
              returnTo: redirectTo,
              subject: logoutRequest.subject,
            }),
            url: '/auth/logout/reject',
          }}
          config={createOryConfig(locale)}
          displayName={resolveLogoutDisplayName(logoutRequest.request_url, logoutRequest.subject)}
          logoutAction={{
            challenge: logoutChallenge,
            intentToken: createAuthIntentToken({
              action: 'logout-confirm',
              challenge: logoutChallenge,
              subject: logoutRequest.subject,
            }),
            url: '/auth/logout/accept',
          }}
        />
      );
    }

    const session = await getServerSession();
    if (!session?.identity) redirect('/');
    const traits = isRecord(session.identity.traits) ? session.identity.traits : {};
    const displayName =
      resolveOptionalString(traits.name) ??
      resolveOptionalString(traits.email) ??
      resolveOptionalString(traits.username) ??
      resolveOptionalString(traits.phone) ??
      'your account';
    const locale = await resolveOryLocale({ searchParams: params });

    return (
      <LogoutUi
        cancelAction={{ url: returnTo }}
        config={createOryConfig(locale)}
        displayName={displayName}
        logoutAction={{
          intentToken: createAuthIntentToken({
            action: 'logout-confirm',
            returnTo,
            subject: session.identity.id,
          }),
          returnTo,
          url: '/auth/logout/kratos',
        }}
      />
    );
  } catch (error: unknown) {
    if (isNextRedirectError(error)) throw error;
    logAuthFlow('logout.flow.error', { errorCode: 'logout_flow_error' });
    redirect(toErrorPageHref(error));
  }
}

function first(value?: string | string[]) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function sanitizeLocalReturnTo(value?: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : null;
}

function resolveLogoutDisplayName(requestUrl?: string | null, subject?: string | null) {
  const claims = decodeIdTokenHintClaims(requestUrl);
  return (
    resolveOptionalString(claims?.email) ??
    resolveOptionalString(claims?.name) ??
    resolveOptionalString(claims?.preferred_username) ??
    subject ??
    'your account'
  );
}

function resolveOptionalString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const first = resolveOptionalString(record.first);
    const last = resolveOptionalString(record.last);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function decodeIdTokenHintClaims(requestUrl?: string | null) {
  try {
    const token = requestUrl
      ? new URL(requestUrl, 'http://internal.invalid').searchParams.get('id_token_hint')
      : null;
    const payload = token?.split('.')[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as unknown;
    return isRecord(claims) ? claims : null;
  } catch {
    return null;
  }
}
