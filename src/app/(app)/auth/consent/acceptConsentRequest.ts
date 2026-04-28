'use server';

import { AcceptOAuth2ConsentRequestSession, OAuth2ConsentRequest } from '@ory/client-fetch';
import { getServerSession } from '@ory/nextjs/app';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError } from '../hydra-flow-error';

const TWELVE_HOURS = 43200;
const THIRTY_DAYS = 2592000;
const LOGIN_REMEMBER_FOR_SECONDS = THIRTY_DAYS;

type AcceptConsentRequestBody = {
  remember?: boolean;
} & OAuth2ConsentRequest;

export async function acceptConsentRequest(body: AcceptConsentRequestBody) {
  const { requested_scope, remember, challenge, requested_access_token_audience } = body;
  const hydra = await getOAuth2ApiFetchClient();
  const session = await extractSession(requested_scope ?? []);
  try {
    const response = await hydra.acceptOAuth2ConsentRequest({
      consentChallenge: challenge,
      acceptOAuth2ConsentRequest: {
        grant_scope: requested_scope,
        remember: remember ?? true,
        remember_for: LOGIN_REMEMBER_FOR_SECONDS,
        grant_access_token_audience: requested_access_token_audience,
        session,
      },
    });

    return { redirectTo: response.redirect_to ?? '/' };
  } catch (error: unknown) {
    throw createHydraFlowError('accept consent request failed', error, {
      code: 'hydra_consent_accept_failed',
      description: 'Unable to continue the consent flow right now.',
    });
  }
}

async function extractSession(grantScope: string[]): Promise<AcceptOAuth2ConsentRequestSession> {
  const serverSession = await getServerSession();
  const session: AcceptOAuth2ConsentRequestSession = {
    access_token: {},
    id_token: {},
  };

  const identity = serverSession?.identity;
  if (!identity) {
    return session;
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
  identity: NonNullable<Awaited<ReturnType<typeof getServerSession>>>['identity'],
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
