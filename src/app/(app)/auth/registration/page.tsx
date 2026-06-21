import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { getRegistrationFlow, OryPageParams } from '@ory/nextjs/app';
import { getLoginRequest } from '../login/getLoginRequest';
import { RegistrationUi } from './registration-ui';

export default async function RegistrationPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const loginChallenge = Array.isArray(searchParams.login_challenge)
    ? searchParams.login_challenge[0]
    : searchParams.login_challenge;
  const locale = await resolveOryLocale({ searchParams });
  const oryConfig = createOryConfig(locale);
  const flow = await getRegistrationFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  const flowLoginChallenge = flow.oauth2_login_challenge?.trim() || undefined;
  const resolvedLoginChallenge = loginChallenge ?? flowLoginChallenge;
  const loginRequest = resolvedLoginChallenge
    ? await getLoginRequest(resolvedLoginChallenge)
    : null;

  return (
    <RegistrationUi
      flow={flow}
      config={oryConfig}
      clientName={loginRequest?.client?.client_name ?? loginRequest?.client?.client_id}
    />
  );
}
