import { TerraformItem } from "../types";

export function getItemReference(item: TerraformItem, field?: string, isPartOfString: boolean = false): string {
  let expression = '';

  if (!item) return '';

  if (item.key === 'data') {
    expression = item.key;
  }

  if (item.type) {
    expression += dot(expression) + item.type;
  }

  if (item.name) {
    expression += dot(expression) + item.name;
  }

  if (field) {
    expression += dot(expression) + field;
  }

  if (!isPartOfString) {
    expression = '&' + expression;
  }

  return expression;
}

function dot(expression: string) {
  if (expression.length > 0) {
    return '.';
  }
  return '';
}
