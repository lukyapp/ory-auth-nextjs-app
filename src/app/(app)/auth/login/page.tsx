import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { Login } from '@ory/elements-react/theme';
import { getLoginFlow, getServerSession, OryPageParams } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { logAuthFlow } from '../auth-flow-log';
import { AuthDebugPanel, shouldShowAuthDiagnostics } from '../debug-panel';
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
    const showDiagnostics = shouldShowAuthDiagnostics(searchParams);
    const loginRequest = loginChallenge ? await getLoginRequest(loginChallenge) : null;
    logAuthFlow('login.page.loaded', {
      hasLoginChallenge: Boolean(loginChallenge),
      loginChallenge,
      maxAge: maxAge ?? null,
      prompt: prompt ?? null,
    });
    const locale = await resolveOryLocale({ flow: loginRequest, searchParams });
    const oryConfig = createOryConfig(locale);

    const session = loginRequest ? await getServerSession() : null;
    const sessionSubject = session?.identity?.id;
    const subject = sessionSubject ?? loginRequest?.subject;
    const sessionMatchesRequest =
      Boolean(sessionSubject) &&
      (!loginRequest?.subject || loginRequest.subject === sessionSubject);
    const skipLogin = loginRequest ? shouldSkipLogin({ loginRequest, maxAge, prompt }) : false;

    if (loginRequest) {
      logAuthFlow('login.challenge.resolved', {
        clientId: loginRequest.client?.client_id ?? null,
        hasSession: Boolean(session),
        loginRequestSkip: loginRequest.skip ?? false,
        requestedSubject: loginRequest.subject ?? null,
        resolvedSubject: subject ?? null,
        sessionMatchesRequest,
        skipLogin,
      });
    }

    if (loginRequest && skipLogin && sessionSubject && sessionMatchesRequest) {
      logAuthFlow('login.challenge.skipped', {
        clientId: loginRequest.client?.client_id ?? null,
        loginChallenge,
        subject: sessionSubject,
      });
      const { redirectTo } = await acceptLoginRequest({
        ...loginRequest,
        subject: sessionSubject,
      });

      if (redirectTo) {
        logAuthFlow('login.challenge.redirect', {
          clientId: loginRequest.client?.client_id ?? null,
          loginChallenge,
          redirectTo,
        });
        redirect(redirectTo);
      }
    }

    const flow = await getLoginFlow(oryConfig, props.searchParams);

    if (!flow) {
      logAuthFlow('login.flow.empty', {
        loginChallenge,
      });
      return null;
    }

    logAuthFlow('login.flow.render', {
      flowId: flow.id,
      loginChallenge,
      uiAction: flow.ui.action,
    });
    if (!showDiagnostics) {
      return <Login flow={flow} config={oryConfig} components={{}} />;
    }

    return (
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <AuthDebugPanel
          title="Login Flow"
          description="This panel shows how the auth app resolved the current Hydra login challenge and session state."
          values={{
            'Login challenge': loginChallenge ?? null,
            Prompt: prompt ?? null,
            'Max age': maxAge ?? null,
            'Hydra client id': loginRequest?.client?.client_id ?? null,
            'Session present': Boolean(session),
            'Skip requested by Hydra': loginRequest?.skip ?? false,
            'Fresh login required': requiresFreshLogin({ prompt, maxAge }),
            'Final skip decision': skipLogin,
            'Resolved subject': subject ?? null,
            'Flow id': flow.id,
          }}
        />
        <Login flow={flow} config={oryConfig} components={{}} />
      </div>
    );
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    logAuthFlow('login.flow.error', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    redirect(toErrorPageHref(error));
  }
}

type LoginRequest = NonNullable<Awaited<ReturnType<typeof getLoginRequest>>>;

function shouldSkipLogin({
  loginRequest,
  maxAge,
  prompt,
}: {
  loginRequest: LoginRequest;
  maxAge?: string;
  prompt?: string;
}): boolean {
  return !requiresFreshLogin({ maxAge, prompt }) || loginRequest.skip;
}

function requiresFreshLogin({ maxAge, prompt }: { maxAge?: string; prompt?: string }): boolean {
  try {
    const promptValues = prompt?.split(' ').filter(Boolean) ?? [];
    return !!(promptValues.includes('login') || maxAge);
  } catch {
    return false;
  }
}
