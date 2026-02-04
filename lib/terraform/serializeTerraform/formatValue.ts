import { TerraformItemComplexPropertyType } from "../types";

export function formatValue(key: string, value: any, level: number = 0, type?: TerraformItemComplexPropertyType): string | undefined {

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    if (value.startsWith('&')) {
      return value.slice(1);
    }
    return `"${value}"`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    let formattedArray = ''
    if (value.length === 0) {
      formattedArray = '[]';
    } else {
      const items = value.map(item => formatValue(key, item, level));
      formattedArray = `[${items.join(', ')}]`;
    }

    return formattedArray;
  }

  if (typeof value === 'object') {
    if (value.flagTerraformProperty) {
      return formatValueRecursively('', value.value, 2, level + 1, value.type);
    } else {
      return formatValueRecursively('', value, 2, level + 1, type);
    }
  }

  return undefined;
}

function formatValueRecursively(serialized: string, value: any, indent: number, level: number, type?: TerraformItemComplexPropertyType): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (Array.isArray(value)) {
    serialized = '[';
    for (const item of value) {
      if (value.length > 1) {
        serialized += '\n' + ' '.repeat(indent * level)
      }
      serialized += formatValue('', item, level + 1);
    }
    if (value.length > 1) {
      serialized += '\n' + ' '.repeat(indent * level)
    }
    serialized += ']';
    return serialized;
  }

  if (typeof value === 'object') {
    serialized += '{';
    for (let [innerKey, innerValue] of Object.entries(value)) {
      let keyType = '';
      let innerType: TerraformItemComplexPropertyType | undefined = undefined;
      if (typeof innerValue == 'object' && (innerValue as any)?.flagTerraformProperty) {
        innerType = (innerValue as any).type;
        innerKey = (innerValue as any).key || innerKey;
        keyType = (innerValue as any).keyType ? ` "${(innerValue as any).keyType}"` : '';
        innerValue = (innerValue as any).value;
      }
      serialized += '\n' + ' '.repeat(indent * level) + innerKey + keyType + getAttributionSign(innerValue, innerType);
      const formattedValue = formatValue(innerKey, innerValue, level, type);
      serialized += formattedValue || '';
      if (innerType === 'jsonencode') {
        serialized += ')'
      }
    }
    serialized += '\n' + ' '.repeat(indent * (level - 1)) + '}';
    return serialized;
  }

  const formatted = formatValue('', value, level);
  if (formatted === undefined) {
    return 'undefined';
  }
  return formatted;
}

function getAttributionSign(value: any, type?: TerraformItemComplexPropertyType): string {
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (type === 'jsonencode') {
      return ' = jsonencode(';
    } else if (type === 'attribution') {
      return ' = ';
    } else if (value.flagTerraformItem) {
      return ' = ';
    }
    return ' ';
  }

  return ' = ';
}
