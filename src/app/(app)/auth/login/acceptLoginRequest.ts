'use server';

import { getServerSession } from '@ory/nextjs/app';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';

const LOGIN_REMEMBER_FOR_SECONDS = 3600;

export async function acceptLoginRequest(loginChallenge: string) {
  const session = await getServerSession();
  const subject = session?.identity?.id;

  if (!subject) {
    return null;
  }

  const hydra = await getOAuth2ApiFetchClient();
  const response = await hydra
    .acceptOAuth2LoginRequest({
      loginChallenge,
      acceptOAuth2LoginRequest: {
        subject,
        remember: true,
        remember_for: LOGIN_REMEMBER_FOR_SECONDS,
      },
    })
    .catch((error: unknown) => {
      console.log('Something unexpected went wrong.');
      console.log('error : ', error);
      return null;
    });

  return response?.redirect_to ?? null;
}
