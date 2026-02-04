import { oryConfig } from '@/lib/ory/ory.config';
import { Login } from '@ory/elements-react/theme';
import { getLoginFlow, OryPageParams } from '@ory/nextjs/app';

export default async function LoginPage(props: OryPageParams) {
  const flow = await getLoginFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return <Login flow={flow} config={oryConfig} components={{}} />;
}
