import 'server-only';
import type { AcceptOAuth2ConsentRequestSession } from '@ory/client-fetch';
import { getServerSession } from '@ory/nextjs/app';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { serializeAccountHistory } from '../account-history';
import { createHydraFlowError, HydraFlowError } from '../hydra-flow-error';
import { getConsentRequest } from './getConsentRequest';

const THIRTY_DAYS = 2_592_000;

export async function acceptConsentRequest(consentChallenge: string) {
  const consentRequest = await getConsentRequest(consentChallenge);
  const grantScope = consentRequest.requested_scope ?? [];
  const { accountHistoryCookie, session } = await extractSession(
    grantScope,
    consentRequest.subject,
  );
  const hydra = await getOAuth2ApiFetchClient();

  try {
    const response = await hydra.acceptOAuth2ConsentRequest({
      acceptOAuth2ConsentRequest: {
        grant_access_token_audience: consentRequest.requested_access_token_audience ?? [],
        grant_scope: grantScope,
        remember: true,
        remember_for: THIRTY_DAYS,
        session,
      },
      consentChallenge,
    });

    return { accountHistoryCookie, redirectTo: response.redirect_to ?? '/' };
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
): Promise<{
  accountHistoryCookie: Awaited<ReturnType<typeof serializeAccountHistory>>;
  session: AcceptOAuth2ConsentRequestSession;
}> {
  const serverSession = await getServerSession();
  const identity = serverSession?.identity;

  if (!identity) {
    throw new HydraFlowError('Consent requires an active authenticated session.', {
      code: 'hydra_consent_session_missing',
      description: 'Your authentication session expired. Sign in again to continue.',
      status: 401,
    });
  }

  if (!consentSubject || identity.id !== consentSubject) {
    throw new HydraFlowError('Consent subject does not match the authenticated session.', {
      code: 'hydra_consent_subject_mismatch',
      description: 'The consent request does not match the current authenticated session.',
      status: 403,
    });
  }

  const traits = isRecord(identity.traits) ? identity.traits : {};
  const email =
    resolveOptionalString(traits.email) ??
    resolveAddressValue(identity.verifiable_addresses, 'email');
  const phone =
    resolveOptionalString(traits.phone ?? traits.phone_number) ??
    resolveAddressValue(identity.verifiable_addresses, 'sms');
  const name = resolveName(traits);
  const preferredUsername = resolveOptionalString(traits.username ?? traits.preferred_username);
  const idToken: Record<string, unknown> = {};

  if (grantScope.includes('email') && email) {
    idToken.email = email;
    idToken.email_verified = isExactAddressVerified(identity.verifiable_addresses, 'email', email);
  }

  if (grantScope.includes('phone') && phone) {
    idToken.phone_number = phone;
    idToken.phone_number_verified = isExactAddressVerified(
      identity.verifiable_addresses,
      'sms',
      phone,
    );
  }

  if (grantScope.includes('profile')) {
    assignStringClaim(idToken, 'name', name);
    assignStringClaim(idToken, 'given_name', nestedName(traits, 'first') ?? traits.given_name);
    assignStringClaim(idToken, 'family_name', nestedName(traits, 'last') ?? traits.family_name);
    for (const claim of [
      'middle_name',
      'nickname',
      'profile',
      'picture',
      'website',
      'gender',
      'birthdate',
      'zoneinfo',
      'locale',
    ]) {
      assignStringClaim(idToken, claim, traits[claim]);
    }
    assignStringClaim(idToken, 'preferred_username', preferredUsername);

    if (identity.updated_at) {
      const updatedAt = identity.updated_at.getTime();
      if (Number.isFinite(updatedAt)) idToken.updated_at = Math.floor(updatedAt / 1000);
    }
  }

  if (grantScope.includes('address')) {
    const address = resolveAddress(traits.address);
    if (address) idToken.address = address;
  }

  const accountHistoryCookie = await serializeAccountHistory({
    id: identity.id,
    identifier: email ?? preferredUsername ?? phone,
    label: name ?? email ?? preferredUsername ?? phone ?? identity.id,
  });

  return {
    accountHistoryCookie,
    session: { access_token: {}, id_token: idToken },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

function resolveName(traits: Record<string, unknown>) {
  const direct = resolveOptionalString(traits.name);
  if (direct) return direct;
  const first = nestedName(traits, 'first');
  const last = nestedName(traits, 'last');
  return [first, last].filter(Boolean).join(' ') || null;
}

function nestedName(traits: Record<string, unknown>, key: string) {
  return isRecord(traits.name) ? resolveOptionalString(traits.name[key]) : null;
}

function assignStringClaim(target: Record<string, unknown>, claim: string, value: unknown) {
  const normalized = resolveOptionalString(value);
  if (normalized) target[claim] = normalized;
}

function isExactAddressVerified(
  addresses: Array<{ value?: string; verified?: boolean; via?: string }> | undefined,
  via: string,
  emittedValue: string,
) {
  return Boolean(
    addresses?.some(
      (address) =>
        address.via === via && address.value === emittedValue && address.verified === true,
    ),
  );
}

function resolveAddressValue(
  addresses: Array<{ value?: string; via?: string }> | undefined,
  via: string,
) {
  return resolveOptionalString(addresses?.find((address) => address.via === via)?.value);
}

function resolveAddress(value: unknown) {
  if (!isRecord(value)) return null;
  const address: Record<string, string> = {};
  for (const field of [
    'formatted',
    'street_address',
    'locality',
    'region',
    'postal_code',
    'country',
  ]) {
    const normalized = resolveOptionalString(value[field]);
    if (normalized) address[field] = normalized;
  }
  return Object.keys(address).length ? address : null;
}
