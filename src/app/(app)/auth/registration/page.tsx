import { oryConfig } from '@/lib/ory/ory.config';
import { Registration } from '@ory/elements-react/theme';
import { getRegistrationFlow, OryPageParams } from '@ory/nextjs/app';

export default async function RegistrationPage(props: OryPageParams) {
  const flow = await getRegistrationFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <Registration flow={flow} config={oryConfig} components={{}} />;
}
