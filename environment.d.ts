declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NEXT_PUBLIC_APP_BASE_URL: string;

      WASABI_ACCESS_KEY: string;
      WASABI_SECRET_KEY: string;
      WASABI_BUCKET_NAME: string;
      WASABI_ENDPOINT: string;
      WASABI_REGION: string;
    }
  }
}

declare module 'jsonwebtoken';

export {};
