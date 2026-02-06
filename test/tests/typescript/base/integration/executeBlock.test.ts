import {
  spawn,
  spawnSync
} from 'child_process';
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

describe('block execution', () => {
  let tmpDir: string;
  let nodeFs: NodeFileSystem;
  let generator: TypeScriptGenerator;
  const resourcesPath = path.resolve(__dirname, '../../../../../resources');

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'orixen-exec-'));
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

  function getBlockPath(title: string, id: string): string {
    const normalized = title.toLowerCase().replace(/\s+/g, '_');
    return path.join(tmpDir, 'blocks', `${normalized}-${id}`);
  }

  function writeBlockImplementation(indexPath: string): void {
    const implementation = `import { InputData, SendOptions } from './_lib/io-types';
import { Outputs } from './_lib/outputs';

export default function run(input: InputData, send: (payload: Outputs, options?: SendOptions) => void) {
  console.log('TEST_MARKER: Block executed');
  console.log('INPUT_DATA:', JSON.stringify(input.payload));
  send({ data: JSON.stringify(input.payload) });
}
`;
    fs.writeFileSync(indexPath, implementation);
  }

  function createInputFile(filePath: string, data: unknown): void {
    fs.writeFileSync(filePath, JSON.stringify(data));
  }

  function installDependencies(blockPath: string): void {
    spawnSync('npm', ['install'], {
      cwd: blockPath,
      shell: true,
      stdio: 'pipe'
    });
  }

  async function executeBlock(
    blockPath: string,
    inputPath: string,
    inputId: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const cliPath = path.join(blockPath, '_lib', 'cli.ts');
      const child = spawn('npx', ['ts-node', cliPath, inputPath, inputId], {
        cwd: blockPath,
        shell: true,
        env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1
        });
      });
    });
  }

  it('executes a block and verifies console output', async () => {
    const block = createFunctionBlock({
      title: 'Test Block',
      id: 'test-exec-123',
      inputs: [createConnector({ id: 'in-1', name: 'testInput' })],
      outputs: [createConnector({ id: 'out-1', name: 'testOutput' })],
    });
    
    await generator.generateNewBlockCodeForDevelopment(block as any, tmpDir);

    const blockPath = getBlockPath('Test Block', 'test-exec-123');
    const indexPath = path.join(blockPath, 'index.ts');
    writeBlockImplementation(indexPath);

    const inputPath = path.join(blockPath, 'input.json');
    const testPayload = { message: 'hello world', value: 42 };
    createInputFile(inputPath, testPayload);

    installDependencies(blockPath);

    const { stdout, exitCode } = await executeBlock(blockPath, inputPath, 'in-1');

    expect(exitCode).toBe(0);
    expect(stdout).toContain('TEST_MARKER: Block executed');
    expect(stdout).toContain('INPUT_DATA:');
    expect(stdout).toContain('hello world');
    expect(stdout).toContain('<$SEND');
    expect(stdout).toContain('out-1');
  }, 30000);
});
