import {env} from "@/env";
import {Configuration, OAuth2Api} from '@ory/client-fetch';

const oAuth2Api = new OAuth2Api(
    new Configuration({
        basePath: env.ORY_HYDRA_ADMIN_URL,
        credentials: 'include',
    }),
);

export async function getOAuth2ApiFetchClient() {
    return oAuth2Api;
}
