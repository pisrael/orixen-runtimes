import {
  describe,
  expect,
  it
} from 'vitest';

import {
  getBlockFolderName,
  getBlockPath
} from '../../../../lib/utils/folderPaths';
import { formatFileName } from '../../../../lib/utils/formatFileName';
import { isFunctionBlock } from '../../../../lib/utils/isFunctionBlock';
import { toPascalCase } from '../../../../lib/utils/toPascalCase';
import {
  createApiBlock,
  createFunctionBlock
} from '../../fixtures/blocks';

describe('toPascalCase', () => {
  it('converts space-separated words', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld');
  });

  it('converts a single word', () => {
    expect(toPascalCase('hello')).toBe('Hello');
  });

  it('handles underscores by removing them', () => {
    expect(toPascalCase('my_function')).toBe('MyFunction');
  });

  it('returns empty string for empty input', () => {
    expect(toPascalCase('')).toBe('');
  });

  it('removes special characters', () => {
    expect(toPascalCase('hello-world!')).toBe('Helloworld');
  });
});

describe('formatFileName', () => {
  it('converts to camelCase', () => {
    expect(formatFileName('Default In')).toBe('defaultIn');
  });

  it('handles single word', () => {
    expect(formatFileName('hello')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(formatFileName('')).toBe('');
  });

  it('lowercases first character of PascalCase result', () => {
    expect(formatFileName('My Output Name')).toBe('myOutputName');
  });
});

describe('getBlockFolderName', () => {
  it('combines normalized title and id', () => {
    expect(getBlockFolderName('My Function', 'abc123')).toBe('my_function-abc123');
  });

  it('handles single-word title', () => {
    expect(getBlockFolderName('handler', 'xyz')).toBe('handler-xyz');
  });
});

describe('getBlockPath', () => {
  it('returns blocks/{folderName} under projectPath', () => {
    const block = createFunctionBlock({ title: 'handler', id: 'xyz' });
    const result = getBlockPath('project', block as any);
    expect(result).toBe('project/blocks/handler-xyz');
  });
});

describe('isFunctionBlock', () => {
  it('returns true for function blocks', () => {
    const block = createFunctionBlock();
    expect(isFunctionBlock(block as any)).toBe(true);
  });

  it('returns false for non-function blocks', () => {
    const block = createApiBlock();
    expect(isFunctionBlock(block as any)).toBe(false);
  });
});
