import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { Login } from '@ory/elements-react/theme';
import { getLoginFlow, getServerSession, OryPageParams } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { toErrorPageHref } from '../hydra-flow-error';
import { isNextRedirectError } from '../is-next-redirect-error';
import { acceptLoginRequest } from './acceptLoginRequest';
import { getLoginRequest } from './getLoginRequest';

export default async function LoginPage(props: OryPageParams) {
  try {
    const searchParams = await props.searchParams;
    const loginChallenge = Array.isArray(searchParams.login_challenge)
      ? searchParams.login_challenge[0]
      : searchParams.login_challenge;
    const prompt = Array.isArray(searchParams.prompt)
      ? searchParams.prompt[0]
      : searchParams.prompt;
    const maxAge = Array.isArray(searchParams.max_age)
      ? searchParams.max_age[0]
      : searchParams.max_age;
    const loginRequest = loginChallenge ? await getLoginRequest(loginChallenge) : null;
    const locale = await resolveOryLocale({ flow: loginRequest, searchParams });
    const oryConfig = createOryConfig(locale);

    const session = loginRequest ? await getServerSession() : null;
    const subject = session?.identity?.id ?? loginRequest?.subject;

    if (loginRequest && shouldSkipLogin({ loginRequest, prompt, maxAge }) && subject) {
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
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    redirect(toErrorPageHref(error));
  }
}

type LoginRequest = NonNullable<Awaited<ReturnType<typeof getLoginRequest>>>;

function shouldSkipLogin({
  loginRequest,
  prompt,
  maxAge,
}: {
  loginRequest: LoginRequest;
  prompt?: string;
  maxAge?: string;
}): boolean {
  return !requiresFreshLogin({ prompt, maxAge }) || loginRequest.skip;
}

function requiresFreshLogin({ prompt, maxAge }: { prompt?: string; maxAge?: string }): boolean {
  try {
    const promptValues = prompt?.split(' ').filter(Boolean) ?? [];
    return !!(promptValues.includes('login') || maxAge);
  } catch {
    return false;
  }
}
