/* eslint-disable */
// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0
import { ApiResponse } from '@ory/client-fetch';
import { serialize, SerializeOptions } from 'cookie';
import { parse, splitCookiesString } from 'set-cookie-parser';
import { OryMiddlewareOptions } from '../middleware/middleware';
import { FlowParams, QueryParams } from '../types';
import { guessCookieDomain } from './cookie';
import { defaultForwardedHeaders } from './headers';
import { rewriteJsonResponse } from './rewrite';

export function onValidationError<T>(value: T): T {
  return value;
}

export async function toFlowParams(
  params: QueryParams,
  getCookieHeader: () => Promise<string | undefined>,
): Promise<FlowParams> {
  return {
    id: params['flow']?.toString() ?? '',
    cookie: await getCookieHeader(),
    return_to: params['return_to']?.toString() ?? '',
  };
}
export function processSetCookieHeaders(
  protocol: string,
  fetchResponse: Response,
  options: OryMiddlewareOptions,
  requestHeaders: Headers,
) {
  const configuredUrl = parseConfiguredPublicUrl();
  const isTls = configuredUrl ? configuredUrl.protocol === 'https:' : protocol === 'https:';
  const host = configuredUrl?.host ?? requestHeaders.get('host');
  const domain =
    host && !options.forceCookieDomain ? guessCookieDomain(host ?? '') : options.forceCookieDomain;

  return parse(splitCookiesString(fetchResponse.headers.get('set-cookie') || ''))
    .map((cookie) => ({
      ...cookie,
      domain,
      secure: isTls,
      encode: (v: string) => v,
    }))
    .map(({ value, name, ...options }) => serialize(name, value, options as SerializeOptions));
}

function parseConfiguredPublicUrl() {
  try {
    return process.env.APP_PUBLIC_URL ? new URL(process.env.APP_PUBLIC_URL) : null;
  } catch {
    return null;
  }
}

export function filterRequestHeaders(
  headers: Headers,
  forwardAdditionalHeaders?: string[],
): Headers {
  const filteredHeaders = new Headers();

  headers.forEach((value, key) => {
    const isValid =
      defaultForwardedHeaders.includes(key) || (forwardAdditionalHeaders ?? []).includes(key);
    if (isValid) filteredHeaders.set(key, value);
  });

  return filteredHeaders;
}

export function joinUrlPaths(baseUrl: string, relativeUrl: string): string {
  const base = new URL(baseUrl);
  const relative = new URL(relativeUrl, baseUrl);

  relative.pathname = base.pathname.replace(/\/$/, '') + '/' + relative.pathname.replace(/^\//, '');

  return new URL(relative.toString(), baseUrl).href;
}

export function toValue<T extends object>(res: ApiResponse<T>): Promise<T> {
  // Remove all undefined values from the response (array and object) using lodash:
  // Remove all (nested) undefined values from the response using lodash
  return res.value().then((v) => rewriteJsonResponse(v));
}
