import { z } from 'zod';
import { logError } from './app-utils/server-log';

const httpUrl = z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), {
  message: 'URL must use HTTP or HTTPS',
});

const envSchema = z
  .object({
    APP_PUBLIC_URL: httpUrl.optional(),
    AUTH_FLOW_SECRET: z.string().min(32, 'AUTH_FLOW_SECRET must contain at least 32 characters'),
    NEXT_PUBLIC_ORY_SDK_URL: httpUrl,
    ORY_PROJECT_API_TOKEN: z.string().optional(),
    ORY_SDK_URL: httpUrl,
    ORY_HYDRA_ADMIN_URL: httpUrl,
    ORY_HYDRA_PUBLIC_URL: httpUrl.optional(),
  })
  .superRefine((env, context) => {
    if (process.env.NODE_ENV === 'production' && !env.APP_PUBLIC_URL) {
      context.addIssue({
        code: 'custom',
        message: 'APP_PUBLIC_URL is required in production',
        path: ['APP_PUBLIC_URL'],
      });
    }
    if (process.env.NODE_ENV === 'production' && env.APP_PUBLIC_URL) {
      const hostname = new URL(env.APP_PUBLIC_URL).hostname;
      if (isLocalHostname(hostname)) {
        context.addIssue({
          code: 'custom',
          message: 'APP_PUBLIC_URL cannot use localhost in production',
          path: ['APP_PUBLIC_URL'],
        });
      }
    }
  });

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logError('env.invalid', {
    error: z.treeifyError(parsed.error),
  });
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
