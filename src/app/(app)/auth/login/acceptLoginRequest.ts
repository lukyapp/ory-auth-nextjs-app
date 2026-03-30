'use server';

import { OAuth2LoginRequest } from '@ory/client-fetch';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';

const LOGIN_REMEMBER_FOR_SECONDS = 3600;

type AcceptLoginRequestBody = {
  remember?: boolean;
} & OAuth2LoginRequest;

export async function acceptLoginRequest(body: AcceptLoginRequestBody) {
  const { challenge, subject, remember } = body;
  const hydra = await getOAuth2ApiFetchClient();
  const response = await hydra
    .acceptOAuth2LoginRequest({
      loginChallenge: challenge,
      acceptOAuth2LoginRequest: {
        subject,
        remember: remember ?? true,
        remember_for: LOGIN_REMEMBER_FOR_SECONDS,
        // amr,
        // acr,
        // context,
        // extend_session_lifespan,
        // identity_provider_session_id,
        // force_subject_identifier
      },
    })
    .catch((error: unknown) => {
      console.log('Something unexpected went wrong.');
      console.log('error : ', error);
      return null;
    });

  const redirectTo = response?.redirect_to;
  return { redirectTo };
}
