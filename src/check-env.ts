import { z } from 'zod';
import { logError } from './app-utils/server-log';

const envSchema = z.object({
  NEXT_PUBLIC_ORY_SDK_URL: z.url().min(1, 'NEXT_PUBLIC_ORY_SDK_URL is required'),
  ORY_PROJECT_API_TOKEN: z.string().optional(),
  ORY_SDK_URL: z.url().min(1, 'ORY_SDK_URL is required'),
  ORY_HYDRA_ADMIN_URL: z.url().min(1, 'ORY_HYDRA_ADMIN_URL is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logError('env.invalid', {
    error: z.treeifyError(parsed.error),
  });
  throw new Error('Invalid environment variables');
}
