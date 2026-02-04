import * as dotenv from 'dotenv';

import { FileSystem } from '../../filesystem';
import { getHomeDir } from './getHomeDir';

export async function loadProjectEnv(fs: FileSystem, projectId: string): Promise<Record<string, string>> {
  const envVars: Record<string, string> = {};
  const userEnv = await fs.readFile(fs.join(getHomeDir(), '.orixen', projectId, '.env'));

  if (userEnv) {
    const userEnvParsed = dotenv.parse(userEnv);
    Object.assign(envVars, userEnvParsed);
  }

  return envVars;
}