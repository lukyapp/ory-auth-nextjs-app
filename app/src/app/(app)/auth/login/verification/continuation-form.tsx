'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

type LoginVerificationContinuationFormProps = {
  intentToken: string;
  loginChallenge: string;
};

export function LoginVerificationContinuationForm({
  intentToken,
  loginChallenge,
}: LoginVerificationContinuationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intl = useIntl();

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 py-16 text-[#1f1f1f]">
      <section
        className="w-full max-w-md text-center"
        aria-labelledby="verification-complete-title"
      >
        <Loader2 aria-hidden="true" className="mx-auto h-10 w-10 animate-spin text-[#1f5ed8]" />
        <h1
          id="verification-complete-title"
          className="mt-6 text-2xl font-bold tracking-normal text-[#242424]"
        >
          {intl.formatMessage({
            defaultMessage: 'Email verified',
            id: 'verification.continue.title',
          })}
        </h1>
        <p className="mt-3 text-base leading-6 text-[#666]" aria-live="polite">
          {intl.formatMessage({
            defaultMessage: 'Continuing your secure sign-in…',
            id: 'verification.continue.description',
          })}
        </p>
        <form
          ref={formRef}
          action="/auth/login/verification/complete"
          className="mt-8"
          method="post"
          onSubmit={() => setIsSubmitting(true)}
        >
          <input name="intent_token" type="hidden" value={intentToken} />
          <input name="login_challenge" type="hidden" value={loginChallenge} />
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#1f5ed8] px-5 text-sm font-semibold text-white transition hover:bg-[#1749aa] focus:ring-2 focus:ring-[#1f5ed8] focus:ring-offset-2 focus:outline-none disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {intl.formatMessage({
              defaultMessage: 'Continue',
              id: 'verification.continue.action',
            })}
          </button>
        </form>
      </section>
    </main>
  );
}
