'use client';

import { IntlProvider } from '@/lib/ory/elements-react/src/context/intl-context';
import type { OryLocale } from '@/lib/ory/resolve-ory-locale';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { useIntl } from 'react-intl';

type LogoutUiProps = {
  cancelUrl: string;
  displayName: string;
  locale: OryLocale;
  logoutUrl: string;
};

export function LogoutUi({ cancelUrl, displayName, locale, logoutUrl }: LogoutUiProps) {
  return (
    <IntlProvider locale={locale}>
      <LogoutContent cancelUrl={cancelUrl} displayName={displayName} logoutUrl={logoutUrl} />
    </IntlProvider>
  );
}

function LogoutContent({
  cancelUrl,
  displayName,
  logoutUrl,
}: Pick<LogoutUiProps, 'cancelUrl' | 'displayName' | 'logoutUrl'>) {
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
              id: 'logout.brand',
            })}
          </div>

          <div className="flex flex-1 flex-col justify-center py-12 lg:py-0">
            <div className="mb-7 grid h-24 w-24 place-items-center rounded-[1.25rem] bg-[#dddddd] shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
              <LogOut className="h-12 w-12 stroke-[2.5]" aria-hidden="true" />
            </div>
            <h1 className="max-w-[24rem] text-[1.75rem] leading-[1.22] font-bold tracking-normal text-balance sm:text-[2rem]">
              {intl.formatMessage({
                defaultMessage: 'End your current session?',
                id: 'logout.hero.title',
              })}
            </h1>
            <p className="mt-7 max-w-[24rem] text-lg leading-7 font-semibold text-[#777]">
              {intl.formatMessage({
                defaultMessage:
                  'Sign out of this browser and require a new login the next time this account is used.',
                id: 'logout.hero.description',
              })}
            </p>
          </div>
        </aside>

        <section
          className="flex items-center justify-center px-8 py-14 sm:px-12 lg:px-20"
          aria-labelledby="logout-title"
        >
          <div className="w-full max-w-[30rem]">
            <header className="mb-8">
              <p className="text-sm leading-5 font-semibold text-[#777]">
                {intl.formatMessage({
                  defaultMessage: 'Sign out',
                  id: 'logout.form.eyebrow',
                })}
              </p>
              <h2
                id="logout-title"
                className="mt-2 text-2xl leading-8 font-bold tracking-normal text-[#242424]"
              >
                {intl.formatMessage({
                  defaultMessage: 'Confirm sign out',
                  id: 'logout.form.title',
                })}
              </h2>
            </header>

            <p className="text-base leading-7 font-semibold text-[#575757]">
              {intl.formatMessage(
                {
                  defaultMessage: 'You are currently signed in as {displayName}. {warning}',
                  id: 'logout.form.description',
                },
                {
                  displayName: <span className="text-[#242424]">{displayName}</span>,
                  warning: intl.formatMessage({
                    defaultMessage: 'This will end the active browser session on this device.',
                    id: 'logout.form.warning',
                  }),
                },
              )}
            </p>

            <div className="mt-6 rounded-md border border-[#d8d8d8] bg-[#f7f7f7] px-4 py-3 text-sm leading-5 text-[#575757]">
              {intl.formatMessage({
                defaultMessage:
                  'Use this option before leaving a shared device, or whenever you want the next visit to ask for your credentials again.',
                id: 'logout.form.notice',
              })}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href={logoutUrl}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#2157c8] px-7 text-base font-semibold text-white transition hover:bg-[#1b49aa]"
              >
                {intl.formatMessage({
                  defaultMessage: 'Log out now',
                  id: 'logout.action.confirm',
                })}
              </Link>
              <Link
                href={cancelUrl}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#f0f1f2] px-7 text-base font-semibold text-[#1f5ed8] transition hover:bg-[#e6e8eb]"
              >
                {intl.formatMessage({
                  defaultMessage: 'Cancel',
                  id: 'logout.action.cancel',
                })}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
