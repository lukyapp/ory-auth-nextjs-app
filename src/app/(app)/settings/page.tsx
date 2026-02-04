import { oryConfig } from '@/lib/ory/ory.config';
import { SessionProvider } from '@ory/elements-react/client';
import { Settings } from '@ory/elements-react/theme';
import { getSettingsFlow, OryPageParams } from '@ory/nextjs/app';
import '@ory/elements-react/theme/styles.css';

export default async function SettingsPage(props: OryPageParams) {
  const flow = await getSettingsFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  return (
    <div className="mb-8 flex flex-col items-center gap-8">
      <SessionProvider>
        <Settings flow={flow} config={oryConfig} components={{}} />
      </SessionProvider>
    </div>
  );
}
