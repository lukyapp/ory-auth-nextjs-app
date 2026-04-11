import { getLogoutFlow, getServerSession } from '@ory/nextjs/app';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function LogoutPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/');
  }

  const traits = session.identity.traits as {
    email?: string;
    username?: string;
    phone?: string;
  };
  const displayName = traits.email ?? traits.username ?? traits.phone ?? 'your account';
  const flow = await getLogoutFlow({ returnTo: '/' });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">Sign out</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          End this browser session?
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          You are currently signed in as{' '}
          <span className="font-medium text-slate-900">{displayName}</span>. Signing out will end
          the current Ory browser session for this device.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Use this if you are on a shared device or want the next access to require authentication
          again.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={flow.logout_url}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Sign out now
          </Link>
          <Link
            href="/"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
