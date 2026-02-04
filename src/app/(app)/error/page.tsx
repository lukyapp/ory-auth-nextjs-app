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

export default async function KratosErrorPage({
  searchParams: _searchParams,
}: PageProps<'/error'>) {
  const searchParams = await _searchParams;
  const errorId = getFirstSearchParam(searchParams['id']);

  if (!errorId) {
    notFound();
  }

  const error = await getKratosError(errorId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>

        {error?.error ? (
          <>
            <p className="text-gray-700">{error.error.reason || error.error.message}</p>
            <p className="text-xs text-gray-400">Error ID: {errorId}</p>
          </>
        ) : (
          <p className="text-gray-700">
            This login or registration flow expired or was interrupted.
          </p>
        )}

        <div className="flex gap-3 pt-4">
          <Link
            href="/auth/login"
            className="flex-1 rounded-md bg-black py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to login
          </Link>

          <a
            href="/"
            className="flex-1 rounded-md border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
