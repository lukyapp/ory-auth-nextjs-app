import { oryConfig } from '@/lib/ory/ory.config';
import { OAuth2LoginRequest } from '@ory/client-fetch';
import { Login } from '@ory/elements-react/theme';
import { getLoginFlow, OryPageParams } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { acceptLoginRequest } from './acceptLoginRequest';
import { getLoginRequest } from './getLoginRequest';

export default async function LoginPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const loginChallenge = Array.isArray(searchParams.login_challenge)
    ? searchParams.login_challenge[0]
    : searchParams.login_challenge;
  if (loginChallenge) {
    const loginRequest = await getLoginRequest(loginChallenge);
    if (shouldSkipLogin(loginRequest)) {
      const { redirectTo } = await acceptLoginRequest({ ...loginRequest, remember: false });
      redirect(redirectTo);
    }
  }

  const flow = await getLoginFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <Login flow={flow} config={oryConfig} components={{}} />;
}

function shouldSkipLogin(loginRequest: OAuth2LoginRequest) {
  return loginRequest.skip;
}
