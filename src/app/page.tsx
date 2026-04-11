import { SessionProvider } from '@ory/elements-react/client';
import { getLogoutFlow, getServerSession } from '@ory/nextjs/app';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Account',
};

export default async function HomePage() {
  const session = await getServerSession();
  const traits = session?.identity?.traits as {
    email?: string;
    username?: string;
    phone?: string;
  };
  const displayName = traits?.email ?? traits?.username ?? traits?.phone ?? 'your account';

  return (
    <SessionProvider session={session}>
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="rounded-3xl bg-slate-900 px-8 py-10 text-white shadow-sm">
            <p className="text-sm tracking-[0.2em] text-slate-300 uppercase">Identity Portal</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {session ? 'Account overview' : 'Sign in to continue'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
              {session
                ? `You are signed in as ${displayName}. Manage your account, security settings, and connected authentication flows from one place.`
                : 'Use this portal to sign in, create an account, recover access, and complete verification flows for connected applications.'}
            </p>
          </div>

          {!session ? <SignedOutCard /> : <SignedInCard displayName={displayName} />}
        </div>
      </main>
    </SessionProvider>
  );
}

function SignedOutCard() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Authentication</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Start a self-service flow or continue managing your access.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <PortalLink href="/auth/login" title="Sign in" description="Access your account." />
        <PortalLink
          href="/auth/registration"
          title="Create account"
          description="Start a new identity registration flow."
        />
        <PortalLink
          href="/auth/recovery"
          title="Recover access"
          description="Regain access to your account."
        />
        <PortalLink
          href="/auth/verification"
          title="Verify account"
          description="Complete email verification."
        />
      </div>
    </section>
  );
}

function SignedInCard({ displayName }: { displayName: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Welcome back</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Signed in as <span className="font-medium text-slate-900">{displayName}</span>.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <PortalLink
          href="/settings"
          title="Account settings"
          description="Manage profile, methods, and recovery options."
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

async function LogoutLink() {
  const flow = await getLogoutFlow({});

  return (
    <Link
      className="rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
      href={flow.logout_url}
    >
      <div className="text-sm font-medium text-slate-900">Sign out</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">End the current browser session.</div>
    </Link>
  );
}
