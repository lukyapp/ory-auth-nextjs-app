import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { getVerificationFlow, OryPageParams } from '@ory/nextjs/app';
import { logAuthFlow } from '../auth-flow-log';
import { getLoginRequest } from '../login/getLoginRequest';
import { VerificationUi } from './verification-ui';

type DiagnosticFlow = {
  active?: string;
  continue_with?: unknown[];
  id: string;
  identity_id?: string;
  oauth2_login_challenge?: string | null;
  request_url?: string;
  session_id?: string | null;
  state?: string;
};

export default async function VerificationPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const loginChallenge = Array.isArray(searchParams.login_challenge)
    ? searchParams.login_challenge[0]
    : searchParams.login_challenge;
  const locale = await resolveOryLocale({ searchParams });
  const oryConfig = createOryConfig(locale);
  const flow = await getVerificationFlow(oryConfig, props.searchParams);

  if (!flow) {
    logAuthFlow('verification.flow.empty');
    return null;
  }

  logAuthFlow('verification.flow.render', summarizeVerificationFlow(flow));

  const flowLoginChallenge = getFlowLoginChallenge(flow);
  const resolvedLoginChallenge = loginChallenge ?? flowLoginChallenge;
  const loginRequest = resolvedLoginChallenge
    ? await getLoginRequest(resolvedLoginChallenge)
    : null;

  return (
    <VerificationUi
      flow={flow}
      config={oryConfig}
      clientName={loginRequest?.client?.client_name ?? loginRequest?.client?.client_id}
    />
  );
}

function summarizeVerificationFlow(flow: DiagnosticFlow) {
  return {
    active: flow.active ?? null,
    hasContinueWith: Array.isArray(flow.continue_with) && flow.continue_with.length > 0,
    hasLoginChallenge: Boolean(flow.oauth2_login_challenge) || hasLoginChallenge(flow.request_url),
    id: flow.id,
    identityId: flow.identity_id ?? null,
    requestPath: requestPath(flow.request_url),
    sessionIdState: sessionIdState(flow.session_id),
    state: flow.state ?? null,
  };
}

function hasLoginChallenge(requestUrl: string | undefined) {
  if (!requestUrl) {
    return false;
  }

  try {
    return new URL(requestUrl).searchParams.has('login_challenge');
  } catch {
    return false;
  }
}

function getFlowLoginChallenge(flow: DiagnosticFlow) {
  return flow.oauth2_login_challenge?.trim() || undefined;
}

function requestPath(requestUrl: string | undefined) {
  if (!requestUrl) {
    return null;
  }

  try {
    const url = new URL(requestUrl);
    return url.pathname;
  } catch {
    return 'invalid-url';
  }
}

function sessionIdState(sessionId: string | null | undefined) {
  if (!sessionId) {
    return 'missing';
  }

  if (sessionId === '00000000-0000-0000-0000-000000000000') {
    return 'zero';
  }

  return 'present';
}
