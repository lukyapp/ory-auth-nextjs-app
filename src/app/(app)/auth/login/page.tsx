import { oryConfig } from '@/lib/ory/ory.config';
import { OAuth2LoginRequest } from '@ory/client-fetch';
import { Login } from '@ory/elements-react/theme';
import { getLoginFlow, getServerSession, OryPageParams } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { acceptLoginRequest } from './acceptLoginRequest';
import { getLoginRequest } from './getLoginRequest';

async function extractSession() {
  const serverSession = await getServerSession();
  const identity = serverSession?.identity;
  if (!identity) {
    return null;
  }
  return serverSession;
}

export default async function LoginPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const loginChallenge = Array.isArray(searchParams.login_challenge)
    ? searchParams.login_challenge[0]
    : searchParams.login_challenge;
  const session = await extractSession();
  if (loginChallenge && session) {
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
