import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { OAuth2LoginRequest } from '@ory/client-fetch';
import { Login } from '@ory/elements-react/theme';
import { getLoginFlow, getServerSession, OryPageParams } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { acceptLoginRequest } from './acceptLoginRequest';
import { getLoginRequest } from './getLoginRequest';

export default async function LoginPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const loginChallenge = Array.isArray(searchParams.login_challenge)
    ? searchParams.login_challenge[0]
    : searchParams.login_challenge;
  const loginRequest = loginChallenge ? await getLoginRequest(loginChallenge) : null;
  const locale = await resolveOryLocale({ flow: loginRequest, searchParams });
  const oryConfig = createOryConfig(locale);
  const session = await getServerSession();
  const subject = session?.identity?.id;
  if (loginRequest && shouldSkipLogin(loginRequest) && subject) {
    const { redirectTo } = await acceptLoginRequest({
      ...loginRequest,
      subject,
    });

    if (redirectTo) {
      redirect(redirectTo);
    }
  }

  const flow = await getLoginFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <Login flow={flow} config={oryConfig} components={{}} />;
}

function shouldSkipLogin(loginRequest: OAuth2LoginRequest): boolean {
  console.log('loginRequest : ', loginRequest)
  return loginRequest.skip;
}
