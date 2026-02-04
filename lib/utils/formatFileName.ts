import { toPascalCase } from './toPascalCase';

export function formatFileName(name: string): string {
  if (!name) return '';
  const pascalCaseName = toPascalCase(name);
  return pascalCaseName.charAt(0).toLowerCase() + pascalCaseName.slice(1);
}
