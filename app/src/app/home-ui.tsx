/* eslint-disable import/order */
'use client';

import type { OryClientConfiguration } from '@ory/elements-react';
import { SessionProvider } from '@ory/elements-react/client';
import { IntlProvider } from '@ory/elements-react/context';
import {
  BadgeCheck,
  ChevronRight,
  KeyRound,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useIntl } from 'react-intl';

type HomeUiProps = {
  config: OryClientConfiguration;
  displayName: string;
  picture: string | null;
  session: React.ComponentProps<typeof SessionProvider>['session'];
};

export function HomeUi({ config, displayName, picture, session }: HomeUiProps) {
  return (
    <IntlProvider
      locale={config.intl?.locale ?? 'en'}
      customTranslations={config.intl?.customTranslations}
    >
      <SessionProvider session={session}>
        <HomeContent displayName={displayName} picture={picture} signedIn={Boolean(session)} />
      </SessionProvider>
    </IntlProvider>
  );
}

function HomeContent({
  displayName,
  picture,
  signedIn,
}: {
  displayName: string;
  picture: string | null;
  signedIn: boolean;
}) {
  const intl = useIntl();

  return (
    <main className="fixed inset-0 min-h-screen overflow-y-auto overscroll-contain bg-white text-[#1f1f1f]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[33rem_1fr]">
        <aside className="flex min-h-[32rem] flex-col bg-[#f3f3f3] px-8 py-8 sm:px-12 lg:min-h-screen lg:px-20 lg:py-20">
          <div className="flex items-center gap-2 text-[1.05rem] font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-[4px] bg-[#1f1f1f]">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-white" />
            </span>
            {intl.formatMessage({
              defaultMessage: 'Identity Portal',
              id: 'home.brand',
            })}
          </div>

          <div className="flex flex-1 flex-col justify-center py-12 lg:py-0">
            {signedIn ? (
              <ProfileAvatar displayName={displayName} picture={picture} />
            ) : (
              <div className="mb-7 grid h-24 w-24 place-items-center rounded-[1.25rem] bg-[#dddddd] shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
                <ShieldCheck className="h-12 w-12 stroke-[2.5]" aria-hidden="true" />
              </div>
            )}
            <h1 className="max-w-[24rem] text-[1.75rem] leading-[1.22] font-bold tracking-normal text-balance sm:text-[2rem]">
              {signedIn
                ? intl.formatMessage({
                    defaultMessage: 'Your account',
                    id: 'home.hero.signedIn.title',
                  })
                : intl.formatMessage({
                    defaultMessage: 'Access your account',
                    id: 'home.hero.signedOut.title',
                  })}
            </h1>
            <p className="mt-7 max-w-[24rem] text-lg leading-7 font-semibold text-[#777]">
              {signedIn
                ? intl.formatMessage(
                    {
                      defaultMessage:
                        'You are signed in as {displayName}. Manage security and authentication from one place.',
                      id: 'home.hero.signedIn.description',
                    },
                    { displayName },
                  )
                : intl.formatMessage({
                    defaultMessage:
                      'Sign in, create an account, recover access, or complete verification for connected applications.',
                    id: 'home.hero.signedOut.description',
                  })}
            </p>
          </div>
        </aside>

        <section
          className="flex items-center justify-center px-8 py-14 sm:px-12 lg:px-20"
          aria-labelledby="home-actions-title"
        >
          <div className="w-full max-w-[30rem]">
            <header className="mb-8">
              <p className="text-sm leading-5 font-semibold text-[#777]">
                {intl.formatMessage({
                  defaultMessage: 'Account access',
                  id: 'home.form.eyebrow',
                })}
              </p>
              <h2
                id="home-actions-title"
                className="mt-2 text-2xl leading-8 font-bold tracking-normal text-[#242424]"
              >
                {signedIn
                  ? intl.formatMessage({
                      defaultMessage: 'Welcome back',
                      id: 'home.form.signedIn.title',
                    })
                  : intl.formatMessage({
                      defaultMessage: 'Get started',
                      id: 'home.form.signedOut.title',
                    })}
              </h2>
            </header>

            <div className="overflow-hidden rounded-md border border-[#d8d8d8] bg-white">
              {signedIn ? <SignedInActions /> : <SignedOutActions />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SignedOutActions() {
  const intl = useIntl();

  return (
    <>
      <PortalLink
        description={intl.formatMessage({
          defaultMessage: 'Access your account securely.',
          id: 'home.action.login.description',
        })}
        href="/auth/login"
        icon={<LogIn className="h-5 w-5" aria-hidden="true" />}
        title={intl.formatMessage({
          defaultMessage: 'Sign in',
          id: 'home.action.login.title',
        })}
      />
      <PortalLink
        description={intl.formatMessage({
          defaultMessage: 'Set up a new account and sign-in method.',
          id: 'home.action.registration.description',
        })}
        href="/auth/registration"
        icon={<UserPlus className="h-5 w-5" aria-hidden="true" />}
        title={intl.formatMessage({
          defaultMessage: 'Create account',
          id: 'home.action.registration.title',
        })}
      />
      <PortalLink
        description={intl.formatMessage({
          defaultMessage: 'Reset access if you can no longer sign in.',
          id: 'home.action.recovery.description',
        })}
        href="/auth/recovery"
        icon={<KeyRound className="h-5 w-5" aria-hidden="true" />}
        title={intl.formatMessage({
          defaultMessage: 'Recover access',
          id: 'home.action.recovery.title',
        })}
      />
      <PortalLink
        description={intl.formatMessage({
          defaultMessage: 'Confirm your email address and activate access.',
          id: 'home.action.verification.description',
        })}
        href="/auth/verification"
        icon={<BadgeCheck className="h-5 w-5" aria-hidden="true" />}
        title={intl.formatMessage({
          defaultMessage: 'Verify account',
          id: 'home.action.verification.title',
        })}
      />
    </>
  );
}

function SignedInActions() {
  const intl = useIntl();

  return (
    <>
      <PortalLink
        description={intl.formatMessage({
          defaultMessage: 'Manage your profile, sign-in methods, and recovery details.',
          id: 'home.action.settings.description',
        })}
        href="/settings"
        icon={<Settings className="h-5 w-5" aria-hidden="true" />}
        title={intl.formatMessage({
          defaultMessage: 'Account settings',
          id: 'home.action.settings.title',
        })}
      />
      <PortalLink
        description={intl.formatMessage({
          defaultMessage: 'Review the current session and sign out from this browser.',
          id: 'home.action.logout.description',
        })}
        href="/auth/logout"
        icon={<LogOut className="h-5 w-5" aria-hidden="true" />}
        title={intl.formatMessage({
          defaultMessage: 'Sign out',
          id: 'home.action.logout.title',
        })}
      />
    </>
  );
}

function PortalLink({
  description,
  href,
  icon,
  title,
}: {
  description: string;
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      className="group flex min-h-20 items-center gap-4 border-t border-[#e5e5e5] px-4 py-4 text-left transition first:border-t-0 hover:bg-[#f7f7f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1f5ed8]"
      href={href}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#f0f1f2] text-[#1f5ed8] transition group-hover:bg-[#e6e8eb]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-[#242424]">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-[#777]">{description}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#777]" aria-hidden="true" />
    </Link>
  );
}

function ProfileAvatar({ displayName, picture }: { displayName: string; picture: string | null }) {
  if (picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={displayName}
        className="mb-7 h-24 w-24 rounded-[1.25rem] bg-[#dddddd] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.10)]"
        src={picture}
      />
    );
  }

  return (
    <div className="mb-7 grid h-24 w-24 place-items-center rounded-[1.25rem] bg-[#dddddd] text-3xl font-bold text-[#242424] uppercase shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
      {displayName.charAt(0)}
    </div>
  );
}
