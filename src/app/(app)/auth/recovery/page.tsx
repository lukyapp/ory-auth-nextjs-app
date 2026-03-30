import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { Recovery } from '@ory/elements-react/theme';
import { getRecoveryFlow, OryPageParams } from '@ory/nextjs/app';

export default async function RecoveryPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const locale = await resolveOryLocale({ searchParams });
  const oryConfig = createOryConfig(locale);
  const flow = await getRecoveryFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <Recovery flow={flow} config={oryConfig} components={{}} />;
}
