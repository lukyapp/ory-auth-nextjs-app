declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
      NEXT_PUBLIC_ORY_SDK_URL: string;
      ORY_PROJECT_API_TOKEN?: string;
      ORY_SDK_URL: string;
      ORY_HYDRA_ADMIN_URL: string;
  }
}
