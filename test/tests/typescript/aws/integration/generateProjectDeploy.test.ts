import { execSync } from 'child_process';
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
import {
  AwsTypeScriptGenerator,
  DeployParams
} from '../../../../../lib';

function isTerraformAvailable(): boolean {
  try {
    execSync('terraform version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('generateProjectDeploy', () => {
  let tmpDir: string;
  let projectPath: string;
  let deployPath: string;
  let nodeFs: NodeFileSystem;
  let generator: AwsTypeScriptGenerator;
  const resourcesPath = path.resolve(__dirname, '../../../../../resources');

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'orixen-test'));
    projectPath = path.resolve(__dirname, '../../../../test-project');
    deployPath = path.join(tmpDir, 'deploy', 'aws');
    nodeFs = new NodeFileSystem(tmpDir);

    generator = new AwsTypeScriptGenerator();
    generator.initialize({
      fs: nodeFs,
      resourcesPath
    });
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  function makeDeployParams(): DeployParams {
    return {
      projectFolder: projectPath,
      deployFolder: deployPath,
      region: 'us-east-1',
      envs: {
        'VAR_1': 'value1',
        'VAR_2': 'value2',
      },
    };
  }

  it('generates deploy for all function blocks from test-project', async () => {
    const params = makeDeployParams();
    const progressReports: { progress: number; message: string }[] = [];

    await generator.generateProjectDeploy(params, (report) => {
      progressReports.push(report);
    });

    // Expected deploy paths for function blocks (deployId-id pattern)
    const expectedBlockPaths = [
      'function_a-bmk7p2se9',
      'function_b-bmk7p2umq',
      'ws_handler-bmk7p5zse',
      'callback-bmk7p7v1m',
    ];

    // Verify deploy folders created for all function blocks
    for (const blockPath of expectedBlockPaths) {
      const deployBlockPath = path.join(deployPath, 'blocks', blockPath);
      expect(fs.existsSync(deployBlockPath)).toBe(true);
    }

    // Verify skip_deploy block is NOT deployed
    const skipDeployPath = path.join(deployPath, 'blocks', 'skip_deploy-bml1p6dda');
    expect(fs.existsSync(skipDeployPath)).toBe(false);

    // Verify Lambda runtime files in _lib/ for the first function block
    const firstBlockLibPath = path.join(deployPath, 'blocks', expectedBlockPaths[0], '_lib');
    const expectedLibFiles = [
      'handler.ts',
      'handler-io.ts',
      'send-to-function.ts',
      'send-to-queue.ts',
      'handler-result.ts',
    ];
    for (const libFile of expectedLibFiles) {
      expect(fs.existsSync(path.join(firstBlockLibPath, libFile))).toBe(true);
    }

    // Verify AWS dependencies in package.json
    const deployPkgPath = path.join(deployPath, 'blocks', expectedBlockPaths[0], 'package.json');
    expect(fs.existsSync(deployPkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(deployPkgPath, 'utf-8'));
    expect(pkg.dependencies).toHaveProperty('aws-sdk');
    expect(pkg.dependencies).toHaveProperty('@aws-sdk/client-apigatewaymanagementapi');

    // Verify terraform.tf contains expected resources
    const tfPath = path.join(deployPath, 'terraform.tf');
    expect(fs.existsSync(tfPath)).toBe(true);
    const tfContent = fs.readFileSync(tfPath, 'utf-8');

    // Lambda functions
    expect(tfContent).toContain('aws_lambda_function');

    // API Gateway (for API and WebSocket triggers)
    expect(tfContent).toContain('aws_apigatewayv2_api');

    // SQS Queue
    expect(tfContent).toContain('aws_sqs_queue');

    // CloudWatch Event Rule (for schedule trigger)
    expect(tfContent).toContain('aws_cloudwatch_event_rule');

    // Verify function_a has WS_SOCKET_TEST env var (from dependsOn WebSocket trigger)
    const functionAMatch = tfContent.match(/resource\s+"aws_lambda_function"\s+"pmk7-testproject-function_abmk7p2se9"\s+\{[\s\S]*?\n\}/);
    expect(functionAMatch).not.toBeNull();
    expect(functionAMatch![0]).toContain('WS_SOCKET_TEST');

    // Verify progress callback
    expect(progressReports.length).toBeGreaterThanOrEqual(2);
    expect(progressReports[0].progress).toBe(25);
    expect(progressReports[progressReports.length - 1].progress).toBe(100);

    // Validate terraform configuration compiles
    if (isTerraformAvailable()) {
      try {
        execSync('terraform init -backend=false', {
          cwd: deployPath,
          stdio: 'pipe',
        });
      } catch (error: any) {
        const stderr = error.stderr?.toString() || '';
        const stdout = error.stdout?.toString() || '';
        throw new Error(`terraform init failed:\n${stderr}\n${stdout}`);
      }

      try {
        execSync('terraform validate', {
          cwd: deployPath,
          stdio: 'pipe',
        });
      } catch (error: any) {
        const stderr = error.stderr?.toString() || '';
        const stdout = error.stdout?.toString() || '';
        throw new Error(`terraform validate failed:\n${stderr}\n${stdout}`);
      }
    }
  }, 60_000); // Extended timeout for terraform init/validate (downloads AWS provider)
});
