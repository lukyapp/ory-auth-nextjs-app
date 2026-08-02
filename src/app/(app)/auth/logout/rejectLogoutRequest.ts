import 'server-only';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError } from '../hydra-flow-error';

export async function rejectLogoutRequest(logoutChallenge: string) {
  const hydra = await getOAuth2ApiFetchClient();

  try {
    await hydra.rejectOAuth2LogoutRequest({
      logoutChallenge,
    });
  } catch (error: unknown) {
    throw createHydraFlowError('reject logout request failed', error, {
      code: 'hydra_logout_reject_failed',
      description: 'Unable to cancel the logout flow right now.',
    });
  }
}
