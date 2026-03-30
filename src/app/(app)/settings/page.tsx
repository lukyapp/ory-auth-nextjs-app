import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { SessionProvider } from '@ory/elements-react/client';
import { Settings } from '@ory/elements-react/theme';
import { getSettingsFlow, OryPageParams } from '@ory/nextjs/app';
import '@ory/elements-react/theme/styles.css';

export default async function SettingsPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const locale = await resolveOryLocale({ searchParams });
  const oryConfig = createOryConfig(locale);
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
