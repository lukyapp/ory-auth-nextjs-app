import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError } from '../hydra-flow-error';

export const getConsentRequest = async (consentChallenge: string) => {
  const hydra = await getOAuth2ApiFetchClient();
  try {
    return await hydra.getOAuth2ConsentRequest({ consentChallenge });
  } catch (error: unknown) {
    throw createHydraFlowError('get consent request failed', error, {
      code: 'hydra_consent_request_failed',
      description: 'Unable to load the consent challenge.',
      status: 400,
    });
  }
};
