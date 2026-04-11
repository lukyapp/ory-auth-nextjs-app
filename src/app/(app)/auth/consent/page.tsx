import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { OAuth2ConsentRequest } from '@ory/client-fetch';
import { redirect } from 'next/navigation';
import React from 'react';
import { logAuthFlow } from '../auth-flow-log';
import { AuthDebugPanel, shouldShowAuthDiagnostics } from '../debug-panel';
import { toErrorPageHref } from '../hydra-flow-error';
import { isNextRedirectError } from '../is-next-redirect-error';
import { acceptConsentRequest } from './acceptConsentRequest';
import { ConsentUi } from './consent-ui';
import { getConsentRequest } from './getConsentRequest';

export default async function ConsentPage(props: {
  searchParams: Promise<{
    consent_challenge?: string | string[];
    debug?: string | string[];
  }>;
}) {
  try {
    const searchParams = await props.searchParams;
    const consentChallenge = Array.isArray(searchParams.consent_challenge)
      ? searchParams.consent_challenge[0]
      : searchParams.consent_challenge;
    const showDiagnostics = shouldShowAuthDiagnostics(searchParams);
    if (!consentChallenge) {
      return;
    }
    const consentRequest = await getConsentRequest(consentChallenge);
    logAuthFlow('consent.page.loaded', {
      clientId: consentRequest.client?.client_id ?? null,
      consentChallenge,
      subject: consentRequest.subject ?? null,
    });
    const locale = await resolveOryLocale({ flow: consentRequest, searchParams });
    const oryConfig = createOryConfig(locale);
    if (shouldSkipConsent(consentRequest)) {
      logAuthFlow('consent.challenge.skipped', {
        clientId: consentRequest.client?.client_id ?? null,
        consentChallenge,
        requestedScopes: consentRequest.requested_scope ?? [],
      });
      const { redirectTo } = await acceptConsentRequest({ ...consentRequest });
      logAuthFlow('consent.challenge.redirect', {
        clientId: consentRequest.client?.client_id ?? null,
        consentChallenge,
        redirectTo,
      });
      redirect(redirectTo);
    }
    logAuthFlow('consent.flow.render', {
      clientId: consentRequest.client?.client_id ?? null,
      consentChallenge,
      requestedScopes: consentRequest.requested_scope ?? [],
    });
    if (!showDiagnostics) {
      return <ConsentUi consentRequest={consentRequest} oryConfig={oryConfig} />;
    }

    return (
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <AuthDebugPanel
          title="Consent Flow"
          description="This panel shows the current Hydra consent request, requested scopes, and whether consent can be skipped."
          values={{
            'Consent challenge': consentChallenge,
            'Hydra client id': consentRequest.client?.client_id ?? null,
            'Hydra client name': consentRequest.client?.client_name ?? null,
            Subject: consentRequest.subject ?? null,
            'Requested scopes': consentRequest.requested_scope ?? [],
            'Granted scopes': consentRequest.granted_scope ?? [],
            'Skip requested by Hydra': consentRequest.skip ?? false,
            'Client skips consent': consentRequest.client?.skip_consent ?? false,
            'Final skip decision': shouldSkipConsent(consentRequest),
          }}
        />
        <ConsentUi consentRequest={consentRequest} oryConfig={oryConfig} />
      </div>
    );
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    logAuthFlow('consent.flow.error', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    redirect(toErrorPageHref(error));
  }
}

function shouldSkipConsent(consentRequest: OAuth2ConsentRequest) {
  return consentRequest.skip || consentRequest.client?.skip_consent;
}
