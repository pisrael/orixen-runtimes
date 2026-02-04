import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it
} from 'vitest';

import { NodeFileSystem } from '../../../../../filesystem';
import { TypeScriptGenerator } from '../../../../../lib';
import {
  createConnector,
  createFunctionBlock
} from '../../../fixtures/blocks';

describe('generateNewBlockCodeForDevelopment', () => {
  let tmpDir: string;
  let nodeFs: NodeFileSystem;
  let generator: TypeScriptGenerator;
  const resourcesPath = path.resolve(__dirname, '../../../../../resources/typescript');

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'orixen-test-'));
    nodeFs = new NodeFileSystem(tmpDir);
    generator = new TypeScriptGenerator();
    generator.initialize({
      fs: nodeFs,
      resourcesPath
    });
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates index.ts with correct imports for block with inputs and outputs', async () => {
    const block = createFunctionBlock({
      title: 'My Function',
      id: 'abc123',
      inputs: [createConnector({ id: 'in-1', name: 'defaultIn' })],
      outputs: [createConnector({ id: 'out-1', name: 'defaultOut' })],
    });

    await generator.generateNewBlockCodeForDevelopment(block as any, tmpDir);

    const indexPath = path.join(tmpDir, 'blocks', 'my_function-abc123', 'index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('InputData');
    expect(content).toContain('send');
  });

  it('creates input connector files with interface declarations', async () => {
    const block = createFunctionBlock({
      title: 'Handler',
      id: 'h1',
      inputs: [
        createConnector({ id: 'in-1', name: 'first input' }),
        createConnector({ id: 'in-2', name: 'second input' }),
      ],
    });

    await generator.generateNewBlockCodeForDevelopment(block as any, tmpDir);

    const basePath = path.join(tmpDir, 'blocks', 'handler-h1');
    const input1 = path.join(basePath, 'inputs', 'firstInput.ts');
    const input2 = path.join(basePath, 'inputs', 'secondInput.ts');

    expect(fs.existsSync(input1)).toBe(true);
    expect(fs.existsSync(input2)).toBe(true);

    const content1 = fs.readFileSync(input1, 'utf-8');
    expect(content1).toContain('export interface FirstInput');
  });

  it('creates output connector files', async () => {
    const block = createFunctionBlock({
      title: 'Worker',
      id: 'w1',
      outputs: [createConnector({ id: 'out-1', name: 'sync' })],
    });

    await generator.generateNewBlockCodeForDevelopment(block as any, tmpDir);

    const outputPath = path.join(tmpDir, 'blocks', 'worker-w1', 'outputs', 'sync.ts');
    expect(fs.existsSync(outputPath)).toBe(true);

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('export interface Sync');
  });

  it('copies tsconfig.json boilerplate', async () => {
    const block = createFunctionBlock({ title: 'Fn', id: 'f1' });

    await generator.generateNewBlockCodeForDevelopment(block as any, tmpDir);

    const tsconfigPath = path.join(tmpDir, 'blocks', 'fn-f1', 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  it('generates package.json with block title in PascalCase', async () => {
    const block = createFunctionBlock({ title: 'my cool function', id: 'mc1' });

    await generator.generateNewBlockCodeForDevelopment(block as any, tmpDir);

    const pkgPath = path.join(tmpDir, 'blocks', 'my_cool_function-mc1', 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBe('MyCoolFunction');
  });

  it('block with no outputs - index.ts has no send parameter', async () => {
    const block = createFunctionBlock({
      title: 'NoOut',
      id: 'no1',
      inputs: [createConnector({ id: 'in-1', name: 'defaultIn' })],
      outputs: [],
    });

    await generator.generateNewBlockCodeForDevelopment(block as any, tmpDir);

    const indexPath = path.join(tmpDir, 'blocks', 'noout-no1', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).not.toContain('send');
    expect(content).not.toContain('Outputs');
  });

  it('block with no inputs - index.ts has no InputData import', async () => {
    const block = createFunctionBlock({
      title: 'NoIn',
      id: 'ni1',
      inputs: [],
      outputs: [createConnector({ id: 'out-1', name: 'defaultOut' })],
    });

    await generator.generateNewBlockCodeForDevelopment(block as any, tmpDir);

    const indexPath = path.join(tmpDir, 'blocks', 'noin-ni1', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).not.toContain('Inputs');
    expect(content).not.toContain('InputData');
  });
});
