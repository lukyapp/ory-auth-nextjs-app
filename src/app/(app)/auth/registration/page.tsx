import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { Registration } from '@ory/elements-react/theme';
import { getRegistrationFlow, OryPageParams } from '@ory/nextjs/app';

export default async function RegistrationPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const locale = await resolveOryLocale({ searchParams });
  const oryConfig = createOryConfig(locale);
  const flow = await getRegistrationFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <Registration flow={flow} config={oryConfig} components={{}} />;
}
