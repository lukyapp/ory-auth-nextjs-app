import 'server-only';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError } from '../hydra-flow-error';

export async function acceptLogoutRequest(logoutChallenge: string) {
  const hydra = await getOAuth2ApiFetchClient();

  try {
    const response = await hydra.acceptOAuth2LogoutRequest({
      logoutChallenge,
    });

    return { redirectTo: response.redirect_to };
  } catch (error: unknown) {
    throw createHydraFlowError('accept logout request failed', error, {
      code: 'hydra_logout_accept_failed',
      description: 'Unable to complete the logout flow right now.',
    });
  }
}
