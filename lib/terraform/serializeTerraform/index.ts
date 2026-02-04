import { TerraformItem } from "../types";
import { formatValue } from "./formatValue";

export function serializeTerraform(terraformItems: TerraformItem[]): string {

  const serializedItems = [];
  for (const item of terraformItems) {
    serializedItems.push(serializeGenericResource(item));
  }

  const fileContent = serializedItems.join('\n\n');
  return fileContent;
}

export function serializeGenericResource(resource: TerraformItem): string {
  const { type, name, properties } = resource;
  let keyStr = resource.key ? `${resource.key}` : '';
  let typeStr = type ? ` "${type}"` : '';
  let nameStr = name ? ` "${name}"` : '';
  const lines = [];
  lines.push(`${keyStr}${typeStr}${nameStr} ${formatValue('', properties)}`);
  return lines.join('\n');
}
