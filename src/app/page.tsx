import { SessionProvider } from '@ory/elements-react/client';
import { getLogoutFlow, getServerSession } from '@ory/nextjs/app';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ory Next.js App router Example',
};

export default async function RootLayout() {
  const session = await getServerSession();
  const traits = session?.identity?.traits as {
    email: string;
    username: string;
    phone: string;
  };

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-xl font-bold">Ory Next.js App Router Example</h1>
          {!session && (
            <div className="flex w-60 flex-col items-center gap-2 rounded-sm border bg-white p-3">
              <Link className="block w-full underline" href="/auth/registration">
                Registration
              </Link>
              <Link className="block w-full underline" href="/auth/login">
                Login
              </Link>
              <Link className="block w-full underline" href="/auth/recovery">
                Account Recovery
              </Link>
              <Link className="block w-full underline" href="/auth/verification">
                Account Verification
              </Link>
            </div>
          )}
          {session && (
            <div className="flex w-60 flex-col items-center gap-2 rounded-sm border bg-white p-3">
              <h2 className="w-full">Hi, {traits.email ?? traits.username ?? traits.phone}!</h2>
              <Link className="block w-full underline" href="/settings">
                Settings
              </Link>
              <LogoutLink />
            </div>
          )}
          <div className="flex gap-2 text-sm">
            <a
              href="https://github.com/ory/elements/tree/master/examples/nextjs-pages-router"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              App Router Example
            </a>
            <a
              href="https://github.com/ory/elements/tree/master/examples/nextjs-pages-router"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Page Router Example
            </a>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}

async function LogoutLink() {
  const flow = await getLogoutFlow({});

  return (
    <Link className="block w-full underline" href={flow.logout_url}>
      Logout
    </Link>
  );
}
