import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError } from '../hydra-flow-error';

export async function getLogoutRequest(logoutChallenge: string) {
  const hydra = await getOAuth2ApiFetchClient();

  try {
    return await hydra.getOAuth2LogoutRequest({ logoutChallenge });
  } catch (error: unknown) {
    throw createHydraFlowError('get logout request failed', error, {
      code: 'hydra_logout_request_failed',
      description: 'Unable to load the logout challenge.',
      status: 400,
    });
  }
}
