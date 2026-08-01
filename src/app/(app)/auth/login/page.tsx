import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import type { LoginFlow } from '@ory/client-fetch';
import { getLoginFlow, getServerSession, OryPageParams } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { readAccountHistory, type RememberedAccount } from '../account-history';
import { logAuthFlow } from '../auth-flow-log';
import { AuthDebugPanel, shouldShowAuthDiagnostics } from '../debug-panel';
import { toErrorPageHref } from '../hydra-flow-error';
import { isNextRedirectError } from '../is-next-redirect-error';
import { acceptLoginRequest } from './acceptLoginRequest';
import { readAccountSelection } from './account-selection';
import { getLoginRequest } from './getLoginRequest';
import { LoginUi } from './login-ui';

export default async function LoginPage(props: OryPageParams) {
  try {
    const searchParams = await props.searchParams;
    const loginChallenge = Array.isArray(searchParams.login_challenge)
      ? searchParams.login_challenge[0]
      : searchParams.login_challenge;
    const prompt = Array.isArray(searchParams.prompt)
      ? searchParams.prompt[0]
      : searchParams.prompt;
    const accountChooser = Array.isArray(searchParams.account_chooser)
      ? searchParams.account_chooser[0]
      : searchParams.account_chooser;
    const acceptCurrent = Array.isArray(searchParams.accept_current)
      ? searchParams.accept_current[0]
      : searchParams.accept_current;
    const maxAge = Array.isArray(searchParams.max_age)
      ? searchParams.max_age[0]
      : searchParams.max_age;
    const showDiagnostics = shouldShowAuthDiagnostics(searchParams);
    logAuthFlow('login.page.loaded', {
      hasLoginChallenge: Boolean(loginChallenge),
      maxAge: maxAge ?? null,
      prompt: prompt ?? null,
    });

    if (loginChallenge && shouldAcceptCurrentAccount({ acceptCurrent })) {
      const [loginRequest, session] = await Promise.all([
        getLoginRequest(loginChallenge),
        getServerSession(),
      ]);
      const sessionSubject = session?.identity?.id;
      const sessionMatchesRequest =
        Boolean(sessionSubject) &&
        (!loginRequest.subject || loginRequest.subject === sessionSubject);

      if (sessionSubject && sessionMatchesRequest) {
        logAuthFlow('login.challenge.accept_current', {
          clientId: loginRequest.client?.client_id ?? null,
          loginChallenge,
          subject: sessionSubject,
        });
        const { redirectTo } = await acceptLoginRequest({
          ...loginRequest,
          subject: sessionSubject,
        });

        if (redirectTo) {
          redirect(redirectTo);
        }
      }

      logAuthFlow('login.challenge.accept_current_mismatch', {
        hasSession: Boolean(session),
        loginChallenge,
        requestedSubject: loginRequest.subject ?? null,
        sessionSubject: sessionSubject ?? null,
      });
    }

    const initialLocale = await resolveOryLocale({ searchParams });
    const initialOryConfig = createOryConfig(initialLocale);
    const flow = await getLoginFlow(initialOryConfig, props.searchParams);

    if (!flow) {
      logAuthFlow('login.flow.empty', {
        hasLoginChallenge: Boolean(loginChallenge),
      });
      return null;
    }

    const flowLoginChallenge = flow.oauth2_login_challenge?.trim() || undefined;
    const resolvedLoginChallenge = loginChallenge ?? flowLoginChallenge;
    const loginRequest = resolvedLoginChallenge
      ? await getLoginRequest(resolvedLoginChallenge)
      : null;
    const resolvedPrompt = prompt ?? resolveRequestUrlParam(loginRequest?.request_url, 'prompt');
    const resolvedMaxAge = maxAge ?? resolveRequestUrlParam(loginRequest?.request_url, 'max_age');
    const locale = await resolveOryLocale({ flow: loginRequest ?? flow, searchParams });
    const oryConfig = locale === initialLocale ? initialOryConfig : createOryConfig(locale);

    const session = loginRequest ? await getServerSession() : null;
    const sessionSubject = session?.identity?.id;
    const subject = sessionSubject ?? loginRequest?.subject;
    const [accountHistory, accountSelection] = await Promise.all([
      readAccountHistory(),
      readAccountSelection(resolvedLoginChallenge),
    ]);
    const selectedAccount = accountSelection;
    const sessionMatchesRequest =
      Boolean(sessionSubject) &&
      (!loginRequest?.subject || loginRequest.subject === sessionSubject);
    const skipLogin = loginRequest
      ? shouldSkipLogin({ loginRequest, maxAge: resolvedMaxAge, prompt: resolvedPrompt })
      : false;
    const accountChoice =
      loginRequest &&
      resolvedLoginChallenge &&
      !selectedAccount &&
      shouldSelectAccount({ accountChooser, prompt: resolvedPrompt }) &&
      (sessionSubject || accountHistory.length > 0)
        ? {
            accounts: buildAccountChoices({
              accountHistory,
              loginChallenge: resolvedLoginChallenge,
              session,
              hasActiveSession: Boolean(sessionSubject),
              sessionMatchesRequest,
            }),
            useAnotherHref: buildFreshLoginHref({
              hasActiveSession: Boolean(sessionSubject),
              loginChallenge: resolvedLoginChallenge,
            }),
          }
        : undefined;

    if (loginRequest) {
      logAuthFlow('login.challenge.resolved', {
        acceptCurrent: acceptCurrent ?? null,
        accountChoice: Boolean(accountChoice),
        accountChooser: accountChooser ?? null,
        clientId: loginRequest.client?.client_id ?? null,
        clientName: loginRequest.client?.client_name ?? null,
        hasFlowLoginChallenge: Boolean(flowLoginChallenge),
        hasResolvedLoginChallenge: Boolean(resolvedLoginChallenge),
        hasSession: Boolean(session),
        loginRequestSkip: loginRequest.skip ?? false,
        prompt: resolvedPrompt ?? null,
        requestedSubject: loginRequest.subject ?? null,
        resolvedSubject: subject ?? null,
        sessionMatchesRequest,
        skipLogin,
      });
    }

    if (
      loginRequest &&
      sessionSubject &&
      sessionMatchesRequest &&
      (skipLogin || shouldAcceptCurrentAccount({ acceptCurrent }))
    ) {
      logAuthFlow('login.challenge.skipped', {
        acceptCurrent: shouldAcceptCurrentAccount({ acceptCurrent }),
        clientId: loginRequest.client?.client_id ?? null,
        hasLoginChallenge: Boolean(loginChallenge),
        subject: sessionSubject,
      });
      const { redirectTo } = await acceptLoginRequest({
        ...loginRequest,
        subject: sessionSubject,
      });

      if (redirectTo) {
        logAuthFlow('login.challenge.redirect', {
          clientId: loginRequest.client?.client_id ?? null,
          redirectTo,
        });
        redirect(redirectTo);
      }
    }

    logAuthFlow('login.flow.render', {
      flowId: flow.id,
      hasLoginChallenge: Boolean(loginChallenge),
      hasResolvedLoginChallenge: Boolean(resolvedLoginChallenge),
      hasSelectedAccount: Boolean(selectedAccount),
      uiAction: flow.ui.action,
    });
    const renderedFlow = applyIdentifierHint(flow, selectedAccount?.identifier);
    if (!showDiagnostics) {
      return (
        <LoginUi
          flow={renderedFlow}
          config={oryConfig}
          accountChoice={accountChoice}
          clientName={loginRequest?.client?.client_name ?? loginRequest?.client?.client_id}
        />
      );
    }

    return (
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <AuthDebugPanel
          title="Login Flow"
          description="This panel shows how the auth app resolved the current Hydra login challenge and session state."
          values={{
            'Final skip decision': skipLogin,
            'Flow id': flow.id,
            'Fresh login required': requiresFreshLogin({
              maxAge: resolvedMaxAge,
              prompt: resolvedPrompt,
            }),
            'Hydra client id': loginRequest?.client?.client_id ?? null,
            'Hydra client name': loginRequest?.client?.client_name ?? null,
            'Login challenge': loginChallenge ?? null,
            'Max age': resolvedMaxAge ?? null,
            Prompt: resolvedPrompt ?? null,
            'Resolved login challenge': resolvedLoginChallenge ?? null,
            'Resolved subject': subject ?? null,
            'Session present': Boolean(session),
            'Skip requested by Hydra': loginRequest?.skip ?? false,
          }}
        />
        <LoginUi
          flow={renderedFlow}
          config={oryConfig}
          accountChoice={accountChoice}
          clientName={loginRequest?.client?.client_name ?? loginRequest?.client?.client_id}
        />
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
type ServerSession = Awaited<ReturnType<typeof getServerSession>>;

type AccountChoice = {
  href: string;
  id: string;
  identifier: string | null;
  isConnected: boolean;
  label: string;
};

function shouldSkipLogin({
  loginRequest,
  maxAge,
  prompt,
}: {
  loginRequest: LoginRequest;
  maxAge?: string;
  prompt?: string;
}): boolean {
  return Boolean(loginRequest.skip) && !requiresFreshLogin({ maxAge, prompt });
}

function requiresFreshLogin({ maxAge, prompt }: { maxAge?: string; prompt?: string }): boolean {
  try {
    const promptValues = prompt?.split(' ').filter(Boolean) ?? [];
    return !!(promptValues.includes('login') || promptValues.includes('select_account') || maxAge);
  } catch {
    return false;
  }
}

function shouldSelectAccount({
  accountChooser,
  prompt,
}: {
  accountChooser?: string;
  prompt?: string;
}) {
  if (accountChooser === 'skip') {
    return false;
  }

  const promptValues = prompt?.split(' ').filter(Boolean) ?? [];
  return promptValues.includes('login') || promptValues.includes('select_account');
}

function shouldAcceptCurrentAccount({ acceptCurrent }: { acceptCurrent?: string }) {
  return acceptCurrent === '1';
}

function resolveRequestUrlParam(requestUrl: string | null | undefined, param: string) {
  if (!requestUrl) {
    return undefined;
  }

  try {
    return new URL(requestUrl, 'http://localhost').searchParams.get(param) ?? undefined;
  } catch {
    return undefined;
  }
}

function buildAccountChoices({
  accountHistory,
  hasActiveSession,
  loginChallenge,
  session,
  sessionMatchesRequest,
}: {
  accountHistory: RememberedAccount[];
  hasActiveSession: boolean;
  loginChallenge: string;
  session: ServerSession;
  sessionMatchesRequest: boolean;
}): AccountChoice[] {
  const currentAccount = resolveCurrentAccount(session, loginChallenge, sessionMatchesRequest);
  const currentAccountId = currentAccount?.id;
  const rememberedChoices = accountHistory
    .filter((account) => account.id !== currentAccountId)
    .map((account) => ({
      href: buildFreshLoginHref({
        accountId: account.id,
        hasActiveSession,
        loginChallenge,
      }),
      id: account.id,
      identifier: account.identifier,
      isConnected: false,
      label: account.label,
    }));

  return currentAccount ? [currentAccount, ...rememberedChoices] : rememberedChoices;
}

function resolveCurrentAccount(
  session: ServerSession,
  loginChallenge: string,
  sessionMatchesRequest: boolean,
): AccountChoice | null {
  const subject = session?.identity?.id;

  if (!subject || !sessionMatchesRequest) {
    return null;
  }

  return {
    href: `/auth/login?login_challenge=${encodeURIComponent(loginChallenge)}&accept_current=1`,
    id: subject,
    identifier: resolveSessionIdentifier(session),
    isConnected: true,
    label: resolveSessionDisplayName(session),
  };
}

function buildFreshLoginHref({
  accountId,
  hasActiveSession,
  loginChallenge,
}: {
  accountId?: string;
  hasActiveSession: boolean;
  loginChallenge: string;
}) {
  const params = new URLSearchParams({ login_challenge: loginChallenge });
  if (accountId) {
    params.set('account_id', accountId);
  }
  const loginHref = `/auth/login/account?${params.toString()}`;

  if (!hasActiveSession) {
    return loginHref;
  }

  return `/auth/logout?logout_confirmed=1&return_to=${encodeURIComponent(loginHref)}`;
}

function applyIdentifierHint(flow: LoginFlow, identifier?: string | null): LoginFlow {
  if (!identifier) {
    return flow;
  }

  return {
    ...flow,
    ui: {
      ...flow.ui,
      nodes: flow.ui.nodes.map((node) => {
        if (
          node.attributes.node_type !== 'input' ||
          node.attributes.name !== 'identifier' ||
          node.attributes.value
        ) {
          return node;
        }

        return {
          ...node,
          attributes: {
            ...node.attributes,
            value: identifier,
          },
        };
      }),
    },
  };
}

function resolveSessionDisplayName(session: ServerSession) {
  const traits =
    session?.identity?.traits && typeof session.identity.traits === 'object'
      ? (session.identity.traits as Record<string, unknown>)
      : {};

  return (
    resolveOptionalString(traits.name) ||
    resolveOptionalString(traits.email) ||
    resolveOptionalString(traits.username) ||
    resolveOptionalString(traits.phone) ||
    session?.identity?.id ||
    'this account'
  );
}

function resolveSessionIdentifier(session: ServerSession) {
  const traits =
    session?.identity?.traits && typeof session.identity.traits === 'object'
      ? (session.identity.traits as Record<string, unknown>)
      : {};

  return (
    resolveOptionalString(traits.email) ||
    resolveOptionalString(traits.username) ||
    resolveOptionalString(traits.phone)
  );
}

function resolveOptionalString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const first = resolveOptionalString(record.first);
    const last = resolveOptionalString(record.last);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last;
  }

  return null;
}
