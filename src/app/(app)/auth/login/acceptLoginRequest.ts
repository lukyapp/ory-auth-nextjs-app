'use server';

import { OAuth2LoginRequest } from '@ory/client-fetch';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError } from '../hydra-flow-error';

const TWELVE_HOURS = 12 * 60 * 60;
const LOGIN_REMEMBER_FOR_SECONDS = TWELVE_HOURS;

type AcceptLoginRequestBody = {
  remember?: boolean;
} & OAuth2LoginRequest;

export async function acceptLoginRequest(body: AcceptLoginRequestBody) {
  const { challenge, subject, remember } = body;
  const hydra = await getOAuth2ApiFetchClient();
  try {
    const response = await hydra.acceptOAuth2LoginRequest({
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
    });

    return { redirectTo: response.redirect_to };
  } catch (error: unknown) {
    throw createHydraFlowError('accept login request failed', error, {
      code: 'hydra_login_accept_failed',
      description: 'Unable to continue the login flow right now.',
    });
  }
}
