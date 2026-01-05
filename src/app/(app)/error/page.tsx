import Link from "next/link";
import {notFound} from "next/navigation"

import {getFirstSearchParam} from "@/app-utils/get-first-search-param";
import {env} from "@/env";

type KratosErrorResponse = {
    id: string
    error?: {
        message?: string
        reason?: string
    }
}

async function getKratosError(errorId: string) {
    const res = await fetch(`${env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/errors?id=${errorId}`, {
            cache: "no-store",
            credentials: "include",
        }
    )

    if (!res.ok) {
        return null
    }

    return (await res.json()) as KratosErrorResponse
}

export default async function KratosErrorPage({
                                                  searchParams: _searchParams,
                                              }: PageProps<'/error'>) {
    const searchParams = await _searchParams
    const errorId = getFirstSearchParam(searchParams['id'])

    if (!errorId) {
        notFound()
    }

    const error = await getKratosError(errorId)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white shadow rounded-lg p-6 space-y-4">
                <h1 className="text-xl font-semibold text-gray-900">
                    Something went wrong
                </h1>

                {error?.error ? (
                    <>
                        <p className="text-gray-700">
                            {error.error.reason || error.error.message}
                        </p>
                        <p className="text-xs text-gray-400">
                            Error ID: {errorId}
                        </p>
                    </>
                ) : (
                    <p className="text-gray-700">
                        This login or registration flow expired or was interrupted.
                    </p>
                )}

                <div className="flex gap-3 pt-4">
                    <Link
                        href="/auth/login"
                        className="flex-1 rounded-md bg-black text-white py-2 text-sm font-medium text-center hover:bg-gray-800"
                    >
                        Back to login
                    </Link>

                    <a
                        href="/"
                        className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 text-center hover:bg-gray-100"
                    >
                        Home
                    </a>
                </div>
            </div>
        </div>
    )
}
