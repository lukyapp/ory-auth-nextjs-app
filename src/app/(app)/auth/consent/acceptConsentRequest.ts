'use server';

import { AcceptOAuth2ConsentRequestSession, OAuth2ConsentRequest } from '@ory/client-fetch';
import { getServerSession } from '@ory/nextjs/app';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';

const TWELVE_HOURS = 12 * 60 * 60;
const LOGIN_REMEMBER_FOR_SECONDS = TWELVE_HOURS;

type AcceptConsentRequestBody = {
  remember?: boolean;
} & OAuth2ConsentRequest;

export async function acceptConsentRequest(body: AcceptConsentRequestBody) {
  const { requested_scope, remember, challenge, requested_access_token_audience } = body;
  const hydra = await getOAuth2ApiFetchClient();
  const session = await extractSession(requested_scope ?? []);
  const response = await hydra
    .acceptOAuth2ConsentRequest({
      consentChallenge: challenge,
      acceptOAuth2ConsentRequest: {
        grant_scope: requested_scope,
        remember: remember ?? true,
        remember_for: LOGIN_REMEMBER_FOR_SECONDS,
        grant_access_token_audience: requested_access_token_audience,
        session,
      },
    })
    .catch((error: unknown) => {
      console.log('Something unexpected went wrong.');
      console.log('error : ', error);
    });

  const redirectTo = response?.redirect_to ?? '/';
  return { redirectTo };
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

  if (grantScope.includes('email')) {
    const addresses = identity.verifiable_addresses || [];
    if (addresses.length > 0) {
      const address = addresses[0];
      if (address.via === 'email') {
        session.id_token.email = address.value;
        session.id_token.email_verified = address.verified;
      }
    }
  }

  if (grantScope.includes('profile')) {
    if (identity.traits.username) {
      session.id_token.preferred_username = identity.traits.username;
    }

    if (identity.traits.website) {
      session.id_token.website = identity.traits.website;
    }

    if (typeof identity.traits.name === 'object') {
      if (identity.traits.name.first) {
        session.id_token.given_name = identity.traits.name.first;
      }
      if (identity.traits.name.last) {
        session.id_token.family_name = identity.traits.name.last;
      }
    } else if (typeof identity.traits.name === 'string') {
      session.id_token.name = identity.traits.name;
    }

    if (identity.updated_at) {
      session.id_token.updated_at = Math.floor(identity.updated_at.getTime() / 1000);
    }
  }
  return session;
}
