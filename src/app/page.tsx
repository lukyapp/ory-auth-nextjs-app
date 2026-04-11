import { SessionProvider } from '@ory/elements-react/client';
import { getServerSession } from '@ory/nextjs/app';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Account',
};

export default async function HomePage() {
  const session = await getServerSession();
  const traits =
    session?.identity?.traits && typeof session.identity.traits === 'object'
      ? (session.identity.traits as Record<string, unknown>)
      : {};
  const displayName =
    resolveOptionalString(traits.name) ||
    resolveOptionalString(traits.email) ||
    resolveOptionalString(traits.username) ||
    resolveOptionalString(traits.phone) ||
    'your account';
  const picture = resolveOptionalString(traits.picture);

  return (
    <SessionProvider session={session}>
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="rounded-3xl bg-slate-900 px-8 py-10 text-white shadow-sm">
            <p className="text-sm tracking-[0.2em] text-slate-300 uppercase">Identity Portal</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {session ? 'Your account' : 'Access your account'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
              {session
                ? `You are signed in as ${displayName}. Review your profile, security settings, and authentication options in one place.`
                : 'Use this portal to sign in, create your account, recover access, or complete verification for connected applications.'}
            </p>
          </div>

          {!session ? (
            <SignedOutCard />
          ) : (
            <SignedInCard displayName={displayName} picture={picture} />
          )}
        </div>
      </main>
    </SessionProvider>
  );
}

function SignedOutCard() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Get started</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Choose the flow you need to access or recover your account.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <PortalLink
          href="/auth/login"
          title="Sign in"
          description="Access your account securely."
        />
        <PortalLink
          href="/auth/registration"
          title="Create account"
          description="Set up a new account and sign-in method."
        />
        <PortalLink
          href="/auth/recovery"
          title="Recover access"
          description="Reset access if you can no longer sign in."
        />
        <PortalLink
          href="/auth/verification"
          title="Verify account"
          description="Confirm your email address and activate access."
        />
      </div>
    </section>
  );
}

function SignedInCard({ displayName, picture }: { displayName: string; picture: string | null }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <ProfileAvatar displayName={displayName} picture={picture} />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Signed in as <span className="font-medium text-slate-900">{displayName}</span>.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <PortalLink
          href="/settings"
          title="Account settings"
          description="Manage your profile, sign-in methods, and recovery details."
        />
        <LogoutLink />
      </div>
    </section>
  );
}

function PortalLink({
  description,
  href,
  title,
}: {
  description: string;
  href: string;
  title: string;
}) {
  return (
    <Link
      className="rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
      href={href}
    >
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{description}</div>
    </Link>
  );
}

function ProfileAvatar({ displayName, picture }: { displayName: string; picture: string | null }) {
  if (picture) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        alt={`${displayName} avatar`}
        className="h-14 w-14 rounded-2xl object-cover"
        src={picture}
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white uppercase">
      {displayName.charAt(0)}
    </div>
  );
}

function resolveOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

async function LogoutLink() {
  return (
    <Link
      className="rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
      href="/auth/logout"
    >
      <div className="text-sm font-medium text-slate-900">Sign out</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">
        Review the current session and sign out from this browser.
      </div>
    </Link>
  );
}
