import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { Verification } from '@ory/elements-react/theme';
import { getVerificationFlow, OryPageParams } from '@ory/nextjs/app';

export default async function VerificationPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const locale = await resolveOryLocale({ searchParams });
  const oryConfig = createOryConfig(locale);
  const flow = await getVerificationFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <Verification flow={flow} config={oryConfig} components={{}} />;
}
