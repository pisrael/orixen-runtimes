// Character budgets based on Lambda's 64-char limit (most restrictive AWS resource)
// Format: ork-<projectName>-<deployId><blockId>
// Budget: 4 + 1 + 20 + 1 + 26 + ~13 = 64 chars max
const NAME_BUDGETS = {
  prefix: 4,        // "4 digits of project id"
  projectName: 20,  // truncated project name
  deployId: 26,     // truncated deployId
  blockId: 13,      // remaining chars for blockId
} as const;

/**
 * Truncate a string to max length, preserving start characters
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength);
}

/**
 * Sanitize project name for AWS resource naming
 * - lowercase
 * - remove spaces
 * - truncate to max length
 */
export function sanitizeProjectName(projectName: string): string {
  const sanitized = projectName.toLowerCase().replace(/ /g, '');
  return truncate(sanitized, NAME_BUDGETS.projectName);
}

/**
 * Generate the terraform prefix: ork-<projectName>
 */
export function generateTerraformPrefix(projectId: string,projectName?: string): string {
  const idPrefix = projectId.slice(0, NAME_BUDGETS.prefix);
  if (!projectName) return idPrefix;
  return `${idPrefix}-${sanitizeProjectName(projectName)}`;
}

/**
 * Sanitize deployId for AWS resource naming
 * - remove hyphens and spaces
 * - truncate to max length
 */
export function sanitizeDeployId(deployId: string): string {
  const sanitized = deployId.replace(/[-\s]/g, '');
  return truncate(sanitized, NAME_BUDGETS.deployId);
}

/**
 * Sanitize block ID (remove hyphens/spaces but keep full length)
 */
export function sanitizeBlockId(blockId: string): string {
  return truncate(blockId.replace(/[-\s]/g, ''), NAME_BUDGETS.blockId);
}
