/* eslint-disable */
// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { resolveConfiguredAppPublicOrigin } from '@/app/(app)/auth/public-url';
import { headers } from 'next/headers';
import { getCookieHeader, getPublicUrl } from './utils';

// Mocking dependencies
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('../utils/utils', () => ({
  toFlowParams: jest.fn(),
}));

jest.mock('@/app/(app)/auth/public-url', () => ({
  resolveConfiguredAppPublicOrigin: jest.fn(),
}));

describe('getCookieHeader', () => {
  it("should return the 'cookie' header if present", async () => {
    const headersMock = {
      get: jest.fn().mockReturnValue('cookie-value'),
    };
    (headers as jest.Mock).mockResolvedValue(headersMock);

    const result = await getCookieHeader();
    expect(headersMock.get).toHaveBeenCalledWith('cookie');
    expect(result).toBe('cookie-value');
  });

  it("should return undefined if the 'cookie' header is not present", async () => {
    const headersMock = {
      get: jest.fn().mockReturnValue(undefined),
    };
    (headers as jest.Mock).mockResolvedValue(headersMock);

    const result = await getCookieHeader();
    expect(headersMock.get).toHaveBeenCalledWith('cookie');
    expect(result).toBeUndefined();
  });
});

describe('getPublicUrl', () => {
  it('returns the configured public origin', async () => {
    (resolveConfiguredAppPublicOrigin as jest.Mock).mockReturnValue('https://auth.example.com');
    const result = await getPublicUrl();
    expect(result).toBe('https://auth.example.com');
  });

  it('does not construct an origin from request headers', async () => {
    (resolveConfiguredAppPublicOrigin as jest.Mock).mockReturnValue(null);
    const result = await getPublicUrl();
    expect(result).toBeUndefined();
  });
});
