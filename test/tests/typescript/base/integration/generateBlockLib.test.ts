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
  createApiBlock,
  createConnector,
  createFunctionBlock
} from '../../../fixtures/blocks';
import { createConnection } from '../../../fixtures/connections';

describe('generateBlockLib', () => {
  let tmpDir: string;
  let nodeFs: NodeFileSystem;
  let generator: TypeScriptGenerator;
  const resourcesPath = path.resolve(__dirname, '../../../../../resources/typescript');

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'orixen-lib-'));
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

  function getLibPath(title: string, id: string) {
    const normalized = title.toLowerCase().replace(/\s+/g, '_');
    return path.join(tmpDir, 'blocks', `${normalized}-${id}`, '_lib');
  }

  it('generates _lib/inputs.ts with connector type unions', async () => {
    const block = createFunctionBlock({
      title: 'Worker',
      id: 'w1',
      inputs: [
        createConnector({ id: 'in-1', name: 'first' }),
        createConnector({ id: 'in-2', name: 'second' }),
      ],
      outputs: [createConnector({ id: 'out-1', name: 'result' })],
    });
    const apiBlock = createApiBlock({ id: 'api-1' });
    const conn = createConnection({
      fromBlockId: 'api-1',
      toBlockId: 'w1',
      fromConnectorId: 'api-out-1',
      toConnectorId: 'in-1',
    });

    await generator.generateBlockLib(block as any, [block as any, apiBlock as any], [conn], tmpDir);

    const inputsPath = path.join(getLibPath('Worker', 'w1'), 'inputs.ts');
    expect(fs.existsSync(inputsPath)).toBe(true);

    const content = fs.readFileSync(inputsPath, 'utf-8');
    expect(content).toContain('First');
    expect(content).toContain('Second');
  });

  it('generates _lib/outputs.ts with connector type unions', async () => {
    const block = createFunctionBlock({
      title: 'Worker',
      id: 'w1',
      inputs: [createConnector({ id: 'in-1', name: 'defaultIn' })],
      outputs: [
        createConnector({ id: 'out-1', name: 'sync' }),
        createConnector({ id: 'out-2', name: 'async' }),
      ],
    });

    await generator.generateBlockLib(block as any, [block as any], [], tmpDir);

    const outputsPath = path.join(getLibPath('Worker', 'w1'), 'outputs.ts');
    expect(fs.existsSync(outputsPath)).toBe(true);

    const content = fs.readFileSync(outputsPath, 'utf-8');
    expect(content).toContain('Sync');
    expect(content).toContain('Async');
  });

  it('generates _lib/ids.ts with routing constants', async () => {
    const block = createFunctionBlock({
      title: 'Fn',
      id: 'f1',
      inputs: [createConnector({ id: 'in-1', name: 'defaultIn' })],
      outputs: [createConnector({ id: 'out-1', name: 'defaultOut' })],
    });
    const apiBlock = createApiBlock({
      id: 'api-1',
      properties: { isSynchronous: false, path: '/test', method: 'GET' },
    });
    const conn = createConnection({
      fromBlockId: 'api-1',
      toBlockId: 'f1',
      fromConnectorId: 'api-out-1',
      toConnectorId: 'in-1',
    });

    await generator.generateBlockLib(block as any, [block as any, apiBlock as any], [conn], tmpDir);

    const idsPath = path.join(getLibPath('Fn', 'f1'), 'ids.ts');
    expect(fs.existsSync(idsPath)).toBe(true);

    const content = fs.readFileSync(idsPath, 'utf-8');
    expect(content).toContain('OUTPUTS_TYPES');
    expect(content).toContain('OUTPUT_NAME_TO_ID');
    expect(content).toContain('INPUT_CONNECTIONS');
    expect(content).toContain('INPUT_SYNCHRONOUS');
    expect(content).toContain('OUTPUT_RESPONSE');
    expect(content).toContain('/test');
    expect(content).toContain('in-1');
  });

  it('generates _lib/io-types.ts with InputData and SendOptions', async () => {
    const block = createFunctionBlock({
      title: 'Fn',
      id: 'f1',
      inputs: [createConnector({ id: 'in-1', name: 'defaultIn' })],
      outputs: [createConnector({ id: 'out-1', name: 'defaultOut' })],
    });

    await generator.generateBlockLib(block as any, [block as any], [], tmpDir);

    const ioTypesPath = path.join(getLibPath('Fn', 'f1'), 'io-types.ts');
    expect(fs.existsSync(ioTypesPath)).toBe(true);

    const content = fs.readFileSync(ioTypesPath, 'utf-8');
    expect(content).toContain('InputNames');
    expect(content).toContain('OutputNames');
  });

  it('generates _lib/block-properties.ts (empty object when no YAML)', async () => {
    const block = createFunctionBlock({ title: 'Fn', id: 'f1' });

    await generator.generateBlockLib(block as any, [block as any], [], tmpDir);

    const propsPath = path.join(getLibPath('Fn', 'f1'), 'block-properties.ts');
    expect(fs.existsSync(propsPath)).toBe(true);

    const content = fs.readFileSync(propsPath, 'utf-8');
    expect(content).toContain('BLOCK_PROPERTIES');
    expect(content).toContain('{}');
  });

  it('copies _lib/function-status.ts', async () => {
    const block = createFunctionBlock({ title: 'Fn', id: 'f1' });

    await generator.generateBlockLib(block as any, [block as any], [], tmpDir);

    const statusPath = path.join(getLibPath('Fn', 'f1'), 'function-status.ts');
    expect(fs.existsSync(statusPath)).toBe(true);
  });
});
