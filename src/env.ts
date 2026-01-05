import { z } from "zod";

const envSchema = z.object({
    NEXT_PUBLIC_ORY_SDK_URL: z.url().min(1, "NEXT_PUBLIC_ORY_SDK_URL is required"),
    ORY_PROJECT_API_TOKEN: z.string().optional(),
    ORY_SDK_URL: z.url().min(1, "ORY_SDK_URL is required"),
    ORY_HYDRA_ADMIN_URL: z.url().min(1, "ORY_HYDRA_ADMIN_URL is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(z.treeifyError(parsed.error));
    throw new Error("Invalid environment variables");
}

export const env = parsed.data;
