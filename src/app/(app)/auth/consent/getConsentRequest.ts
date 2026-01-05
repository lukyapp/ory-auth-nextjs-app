import {getOAuth2ApiFetchClient} from '@ory/sdk/server';

export const getConsentRequest = async (consentChallenge: string) => {
    const hydra = await getOAuth2ApiFetchClient();
    return hydra.getOAuth2ConsentRequest({consentChallenge});
};
