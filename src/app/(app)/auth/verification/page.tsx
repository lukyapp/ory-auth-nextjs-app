import { oryConfig } from '@/lib/ory/ory.config';
import { Verification } from '@ory/elements-react/theme';
import { getVerificationFlow, OryPageParams } from '@ory/nextjs/app';

export default async function VerificationPage(props: OryPageParams) {
  const flow = await getVerificationFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <Verification flow={flow} config={oryConfig} components={{}} />;
}
