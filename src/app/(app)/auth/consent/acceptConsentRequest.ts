'use server';

import { AcceptOAuth2ConsentRequestSession, OAuth2ConsentRequest } from '@ory/client-fetch';
import { getServerSession } from '@ory/nextjs/app';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError, HydraFlowError } from '../hydra-flow-error';

const TWELVE_HOURS = 43200;
const THIRTY_DAYS = 2592000;
const LOGIN_REMEMBER_FOR_SECONDS = THIRTY_DAYS;

type AcceptConsentRequestBody = {
  remember?: boolean;
} & OAuth2ConsentRequest;

export async function acceptConsentRequest(body: AcceptConsentRequestBody) {
  const { challenge, remember, requested_access_token_audience, requested_scope, subject } = body;
  const hydra = await getOAuth2ApiFetchClient();
  const session = await extractSession(requested_scope ?? [], subject);
  try {
    const response = await hydra.acceptOAuth2ConsentRequest({
      acceptOAuth2ConsentRequest: {
        grant_access_token_audience: requested_access_token_audience,
        grant_scope: requested_scope,
        remember: remember ?? true,
        remember_for: LOGIN_REMEMBER_FOR_SECONDS,
        session,
      },
      consentChallenge: challenge,
    });

    return { redirectTo: response.redirect_to ?? '/' };
  } catch (error: unknown) {
    throw createHydraFlowError('accept consent request failed', error, {
      code: 'hydra_consent_accept_failed',
      description: 'Unable to continue the consent flow right now.',
    });
  }
}

async function extractSession(
  grantScope: string[],
  consentSubject?: string | null,
): Promise<AcceptOAuth2ConsentRequestSession> {
  const serverSession = await getServerSession();
  const session: AcceptOAuth2ConsentRequestSession = {
    access_token: {},
    id_token: {},
  };

  const identity = serverSession?.identity;
  if (!identity) {
    throw new HydraFlowError('Consent requires an active authenticated session.', {
      code: 'hydra_consent_session_missing',
      description: 'Your authentication session expired. Sign in again to continue.',
      status: 401,
    });
  }

  if (consentSubject && identity.id !== consentSubject) {
    throw new HydraFlowError('Consent subject does not match the authenticated session.', {
      code: 'hydra_consent_subject_mismatch',
      description: 'The consent request does not match the current authenticated session.',
      status: 403,
    });
  }

  const traits = isIdentityTraitsRecord(identity.traits) ? identity.traits : {};
  const email = resolveEmail(identity, traits);
  const name = resolveName(traits);
  const picture = resolveOptionalString(traits.picture);
  const preferredUsername = resolveOptionalString(traits.username);

  if (grantScope.includes('email')) {
    if (email) {
      session.id_token.email = email;
    }

    const verifiedEmailAddress = (identity.verifiable_addresses || []).find(
      (address) => address.via === 'email',
    );
    session.id_token.email_verified = verifiedEmailAddress?.verified ?? false;
  }

  if (grantScope.includes('profile')) {
    if (preferredUsername) {
      session.id_token.preferred_username = preferredUsername;
    }

    const website = resolveOptionalString(traits.website);
    if (website) {
      session.id_token.website = website;
    }

    if (name) {
      session.id_token.name = name;
    }

    if (picture) {
      session.id_token.picture = picture;
    }

    if (identity.updated_at) {
      session.id_token.updated_at = Math.floor(identity.updated_at.getTime() / 1000);
    }
  }
  return session;
}

function isIdentityTraitsRecord(traits: unknown): traits is Record<string, unknown> {
  return typeof traits === 'object' && traits !== null;
}

function resolveOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function resolveEmail(
  identity: NonNullable<NonNullable<Awaited<ReturnType<typeof getServerSession>>>['identity']>,
  traits: Record<string, unknown>,
) {
  const verifiedEmailAddress = (identity.verifiable_addresses || []).find(
    (address) =>
      address.via === 'email' && typeof address.value === 'string' && address.value.length > 0,
  );

  return verifiedEmailAddress?.value ?? resolveOptionalString(traits.email);
}

function resolveName(traits: Record<string, unknown>) {
  const rawName = traits.name;

  if (typeof rawName === 'string' && rawName.trim().length > 0) {
    return rawName.trim();
  }

  if (typeof rawName === 'object' && rawName !== null) {
    const first = resolveOptionalString((rawName as Record<string, unknown>).first);
    const last = resolveOptionalString((rawName as Record<string, unknown>).last);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last;
  }

  return null;
}
