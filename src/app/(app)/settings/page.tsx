import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { SessionProvider } from '@ory/elements-react/client';
import { Settings } from '@ory/elements-react/theme';
import { getServerSession, getSettingsFlow, OryPageParams } from '@ory/nextjs/app';
import '@ory/elements-react/theme/styles.css';

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

  return (
    <div className="mx-auto mb-8 flex w-full max-w-5xl flex-col gap-6 px-4">
      <section className="rounded-3xl bg-slate-900 px-8 py-8 text-white shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ProfileAvatar displayName={account.displayName} picture={account.picture} />
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-slate-300 uppercase">
                Account Settings
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">{account.displayName}</h1>
            </div>
          </div>
          <SummaryCard
            label="Profile image"
            value={account.picture ? 'Connected' : 'Not set'}
            tone="dark"
          />
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-200">
          Review your identity profile, authentication methods, verification status, and recovery
          configuration.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Email" value={account.email} tone="dark" />
          <SummaryCard label="Verification" value={account.verificationStatus} tone="dark" />
          <SummaryCard label="Recovery" value={account.recoveryStatus} tone="dark" />
        </div>
      </section>

      <SessionProvider session={session}>
        <Settings flow={flow} config={oryConfig} components={{}} />
      </SessionProvider>
    </div>
  );
}

function SummaryCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'dark' | 'light';
  value: string;
}) {
  const baseClassName =
    tone === 'dark'
      ? 'rounded-2xl border border-slate-700 bg-white/5 px-4 py-4'
      : 'rounded-2xl border border-slate-200 bg-white px-4 py-4';
  const labelClassName =
    tone === 'dark'
      ? 'text-xs font-medium uppercase tracking-[0.18em] text-slate-300'
      : 'text-xs font-medium uppercase tracking-[0.18em] text-slate-400';
  const valueClassName =
    tone === 'dark'
      ? 'mt-2 text-sm font-medium text-white'
      : 'mt-2 text-sm font-medium text-slate-900';

  return (
    <div className={baseClassName}>
      <p className={labelClassName}>{label}</p>
      <p className={valueClassName}>{value}</p>
    </div>
  );
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
    recoveryStatus: hasRecovery ? 'Configured' : 'Not configured',
    verificationStatus: isVerified ? 'Verified' : 'Verification pending',
  };
}

function ProfileAvatar({ displayName, picture }: { displayName: string; picture: string | null }) {
  if (picture) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        alt={`${displayName} avatar`}
        className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
        src={picture}
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white uppercase">
      {displayName.charAt(0)}
    </div>
  );
}

function resolveOptionalString(value: unknown) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const first = resolveOptionalString((value as Record<string, unknown>).first);
    const last = resolveOptionalString((value as Record<string, unknown>).last);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last;
  }

  return null;
}
