import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError } from '../hydra-flow-error';

export async function getLoginRequest(loginChallenge: string) {
  const hydra = await getOAuth2ApiFetchClient();
  try {
    return await hydra.getOAuth2LoginRequest({ loginChallenge });
  } catch (error: unknown) {
    throw createHydraFlowError('get login request failed', error, {
      code: 'hydra_login_request_failed',
      description: 'Unable to load the login challenge.',
      status: 400,
    });
  }
}
