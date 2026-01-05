'use server'

import {getOAuth2ApiFetchClient} from '@ory/sdk/server';

export async function rejectConsentRequest(challenge: string) {
    const hydra = await getOAuth2ApiFetchClient();
    const response = await hydra
        .rejectOAuth2ConsentRequest({
            consentChallenge: challenge,
            rejectOAuth2Request: {
                error: "access_denied",
                error_description: "The resource owner denied the request",
            },
        })
        .catch((error: unknown) => {
            console.log('Something unexpected went wrong.');
            console.log('error : ', error);
        });

    const redirectTo = response?.redirect_to ?? '/';
    return {redirectTo};
};
