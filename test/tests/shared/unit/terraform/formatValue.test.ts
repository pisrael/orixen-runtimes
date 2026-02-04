import {
  describe,
  expect,
  it
} from 'vitest';

import { formatValue } from '../../../../../lib/terraform/serializeTerraform/formatValue';

describe('formatValue', () => {
  it('wraps strings in quotes', () => {
    expect(formatValue('key', 'hello')).toBe('"hello"');
  });

  it('renders &-prefixed values as bare references', () => {
    expect(formatValue('key', '&aws_lambda_function.my_func.arn')).toBe(
      'aws_lambda_function.my_func.arn'
    );
  });

  it('renders numbers as-is', () => {
    expect(formatValue('key', 42)).toBe('42');
  });

  it('renders booleans as-is', () => {
    expect(formatValue('key', true)).toBe('true');
    expect(formatValue('key', false)).toBe('false');
  });

  it('renders null', () => {
    expect(formatValue('key', null)).toBe('null');
  });

  it('returns undefined for undefined', () => {
    expect(formatValue('key', undefined)).toBeUndefined();
  });

  it('renders arrays', () => {
    const result = formatValue('key', ['a', 'b']);
    expect(result).toBe('["a", "b"]');
  });

  it('renders empty arrays', () => {
    expect(formatValue('key', [])).toBe('[]');
  });

  it('renders objects as blocks', () => {
    const result = formatValue('key', { name: 'test' });
    expect(result).toContain('name');
    expect(result).toContain('"test"');
  });

  it('handles flagTerraformProperty with attribution type', () => {
    const value = {
      flagTerraformProperty: true,
      type: 'attribution' as const,
      value: { key1: 'val1' },
    };
    const result = formatValue('key', value);
    expect(result).toContain('key1');
    expect(result).toContain('"val1"');
    expect(result).toMatch(/^\{\n\s+key1 = "val1"\n\}$/);
  });

  it('handles arrays of references', () => {
    const result = formatValue('key', ['&ref1', '&ref2']);
    expect(result).toBe('[ref1, ref2]');
  });
});
