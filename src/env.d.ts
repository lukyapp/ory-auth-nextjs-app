declare namespace NodeJS {
  interface ProcessEnv {
    APP_PUBLIC_URL?: string;
    AUTH_FLOW_SECRET: string;
    NODE_ENV: 'development' | 'test' | 'production';
    NEXT_PUBLIC_ORY_SDK_URL: string;
    ORY_PROJECT_API_TOKEN?: string;
    ORY_SDK_URL: string;
    ORY_HYDRA_ADMIN_URL: string;
    ORY_HYDRA_PUBLIC_URL?: string;
  }
}
