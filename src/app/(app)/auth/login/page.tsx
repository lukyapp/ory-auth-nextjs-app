import { oryConfig } from '@/lib/ory/ory.config';
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
  const session = await getServerSession();
  const subject = session?.identity?.id;
  if (loginChallenge && subject) {
    const loginRequest = await getLoginRequest(loginChallenge);

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
