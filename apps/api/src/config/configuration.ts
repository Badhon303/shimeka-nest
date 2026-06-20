export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  jwt: {
    customerAccessSecret: string;
    customerRefreshSecret: string;
    adminAccessSecret: string;
    adminRefreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  uploads: {
    driver: string;
    localDir: string;
    publicBaseUrl: string;
  };
  redisUrl: string | undefined;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwt: {
    customerAccessSecret: process.env.JWT_CUSTOMER_ACCESS_SECRET ?? 'dev-customer-access',
    customerRefreshSecret: process.env.JWT_CUSTOMER_REFRESH_SECRET ?? 'dev-customer-refresh',
    adminAccessSecret: process.env.JWT_ADMIN_ACCESS_SECRET ?? 'dev-admin-access',
    adminRefreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET ?? 'dev-admin-refresh',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  uploads: {
    driver: process.env.UPLOAD_DRIVER ?? 'local',
    localDir: process.env.UPLOAD_LOCAL_DIR ?? 'uploads',
    publicBaseUrl: process.env.UPLOAD_PUBLIC_BASE_URL ?? 'http://localhost:4000/uploads',
  },
  redisUrl: process.env.REDIS_URL,
});
