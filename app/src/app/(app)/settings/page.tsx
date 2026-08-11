/* eslint-disable import/order */
import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { getServerSession, getSettingsFlow, OryPageParams } from '@ory/nextjs/app';
import '@ory/elements-react/theme/styles.css';
import { SettingsUi } from './settings-ui';

export default async function SettingsPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  const locale = await resolveOryLocale({ searchParams });
  const oryConfig = createOryConfig(locale);
  const session = await getServerSession();
  const flow = await getSettingsFlow(oryConfig, props.searchParams);

  if (!flow) {
    return null;
  }

  const account = getAccountSummary(session);

  return <SettingsUi flow={flow} config={oryConfig} session={session} account={account} />;
}

function getAccountSummary(session: Awaited<ReturnType<typeof getServerSession>>) {
  const traits =
    session?.identity?.traits && typeof session.identity.traits === 'object'
      ? (session.identity.traits as Record<string, unknown>)
      : {};

  const displayName =
    resolveOptionalString(traits.name) ||
    resolveOptionalString(traits.email) ||
    resolveOptionalString(traits.username) ||
    'Your account';

  const email =
    session?.identity?.verifiable_addresses?.find((address) => address.via === 'email')?.value ??
    resolveOptionalString(traits.email) ??
    'No email available';
  const picture = resolveOptionalString(traits.picture);

  const isVerified =
    session?.identity?.verifiable_addresses?.some(
      (address) => address.via === 'email' && address.verified,
    ) ?? false;
  const hasRecovery =
    (session?.identity?.recovery_addresses?.length ?? 0) > 0 ||
    Boolean(resolveOptionalString(traits.email));

  return {
    displayName,
    email,
    picture,
    recoveryStatus: hasRecovery ? 'Ready' : 'Not configured',
    verificationStatus: isVerified ? 'Verified' : 'Pending',
  };
}

function resolveOptionalString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const first = resolveOptionalString(record.first);
    const last = resolveOptionalString(record.last);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last;
  }

  return null;
}
