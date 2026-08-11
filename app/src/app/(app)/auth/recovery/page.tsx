/* eslint-disable import/order */
import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { getRecoveryFlow, OryPageParams } from '@ory/nextjs/app';
import { RecoveryUi } from './recovery-ui';

export default async function RecoveryPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const locale = await resolveOryLocale({ searchParams });
  const oryConfig = createOryConfig(locale);
  const flow = await getRecoveryFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <RecoveryUi flow={flow} config={oryConfig} />;
}
