import os from 'os';

export function getHomeDir(): string {
  const platform = os.platform();

  if (platform === 'win32') {
    const homeDrive = process.env.HOMEDRIVE;
    const homePath = process.env.HOMEPATH;
    return process.env.USERPROFILE || (homeDrive && homePath ? homeDrive + homePath : os.homedir());
  }

  return process.env.HOME || os.homedir();
}
