import { getFirstSearchParam } from '@/app-utils/get-first-search-param';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type KratosErrorResponse = {
  id: string;
  error?: {
    message?: string;
    reason?: string;
  };
};

async function getKratosError(errorId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/errors?id=${errorId}`,
    {
      cache: 'no-store',
      credentials: 'include',
    },
  );

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as KratosErrorResponse;
}

type ErrorPresentation = {
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  title: string;
};

function getErrorPresentation(params: {
  errorCode: string;
  errorDescription: string;
  errorId: string;
  kratosReason?: string;
  kratosMessage?: string;
}): ErrorPresentation {
  const normalizedCode = params.errorCode.toLowerCase();
  const normalizedReason = (params.kratosReason ?? '').toLowerCase();
  const description =
    params.errorDescription ||
    params.kratosMessage ||
    'This authentication flow expired, was interrupted, or could not be completed.';

  if (
    normalizedCode === 'session_expired' ||
    normalizedReason.includes('session') ||
    normalizedReason.includes('expired session')
  ) {
    return {
      title: 'Your session expired',
      description:
        params.errorDescription ||
        'Your authenticated session is no longer active. Please sign in again to continue.',
      primaryHref: '/auth/login',
      primaryLabel: 'Sign in again',
      secondaryHref: '/',
      secondaryLabel: 'Back to portal',
    };
  }

  if (
    normalizedCode.includes('consent') ||
    normalizedReason.includes('consent') ||
    normalizedReason.includes('interaction expired')
  ) {
    return {
      title: 'Consent flow unavailable',
      description,
      primaryHref: '/',
      primaryLabel: 'Back to portal',
      secondaryHref: '/auth/login',
      secondaryLabel: 'Start over',
    };
  }

  if (normalizedCode.includes('login') || normalizedReason.includes('login')) {
    return {
      title: 'Login flow unavailable',
      description,
      primaryHref: '/auth/login',
      primaryLabel: 'Back to sign in',
      secondaryHref: '/',
      secondaryLabel: 'Back to portal',
    };
  }

  if (params.errorId || normalizedReason.includes('expired')) {
    return {
      title: 'Flow expired',
      description,
      primaryHref: '/auth/login',
      primaryLabel: 'Start again',
      secondaryHref: '/',
      secondaryLabel: 'Back to portal',
    };
  }

  return {
    title: 'Something went wrong',
    description,
    primaryHref: '/auth/login',
    primaryLabel: 'Back to sign in',
    secondaryHref: '/',
    secondaryLabel: 'Back to portal',
  };
}

export default async function KratosErrorPage({
  searchParams: _searchParams,
}: PageProps<'/error'>) {
  const searchParams = await _searchParams;
  const errorId = getFirstSearchParam(searchParams['id']);
  const errorCode = getFirstSearchParam(searchParams['error']); // could be invalid_request;
  const errorDescription = getFirstSearchParam(searchParams['error_description']); // could be invalid_request;

  if (!errorId && !errorCode && !errorDescription) {
    notFound();
  }

  const error = errorId
    ? await getKratosError(errorId)
    : {
        id: null,
        error: {
          message: errorDescription,
          reason: errorCode,
        },
      };
  const presentation = getErrorPresentation({
    errorCode,
    errorDescription,
    errorId,
    kratosMessage: error?.error?.message,
    kratosReason: error?.error?.reason,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-xl space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">
            Authentication Error
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {presentation.title}
          </h1>
        </div>

        {error?.error ? (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-700">{presentation.description}</p>
            {error.error.reason ? (
              <p className="text-sm text-slate-500">Reason: {error.error.reason}</p>
            ) : null}
            {error.id ? <p className="text-xs text-slate-400">Error ID: {error.id}</p> : null}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-700">{presentation.description}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Link
            href={presentation.primaryHref}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {presentation.primaryLabel}
          </Link>

          <Link
            href={presentation.secondaryHref}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {presentation.secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
