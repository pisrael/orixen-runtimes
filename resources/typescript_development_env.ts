import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// 1️⃣ Load PROJECT_ENV file if it exists
if (process.env.PROJECT_ENV) {
  loadEnv({ path: resolve(process.env.PROJECT_ENV) });
}

// 2️⃣ Load USER_ENV file if it exists (with override=true to overwrite PROJECT_ENV values)
if (process.env.USER_ENV) {
  loadEnv({ 
    path: resolve(process.env.USER_ENV),
    override: true  // This allows USER_ENV to override both process.env and PROJECT_ENV
  });
}
