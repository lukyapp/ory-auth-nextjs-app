import { getOAuth2ApiFetchClient } from '@ory/sdk/server';

export async function getLoginRequest(loginChallenge: string) {
  const hydra = await getOAuth2ApiFetchClient();
  return hydra.getOAuth2LoginRequest({ loginChallenge });
}
