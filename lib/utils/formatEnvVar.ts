export function formatEnvVar(envVar: string) {
  return envVar.replace(/[^a-zA-Z0-9_]/g, '_');
}