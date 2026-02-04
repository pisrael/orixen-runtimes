import {
  describe,
  expect,
  it
} from 'vitest';

import { DeployParams } from '../../../../../../lib/GeneratorInterface';
import { Project } from '../../../../../../lib/types/Project';
import { Block } from '../../../../../../lib/types/blocks/Block';
import { Connection } from '../../../../../../lib/types/connections/Connection';
import { genAwsTerraformDeployData } from '../../../../../../lib/typescript/aws/terraform/index';
import { serializeTerraform } from '../../../../../../lib/terraform/serializeTerraform/index';
import {
  createApiBlock,
  createConnector,
  createFunctionBlock,
  createQueueBlock,
  createResponseBlock,
  createScheduleBlock
} from '../../../../fixtures/blocks';
import {
  createConnection,
  createQueueConnection
} from '../../../../fixtures/connections';

function makeDeployParams(): DeployParams {
  return {
    deployFolder: '/tmp/deploy',
    projectFolder: '/tmp/project',
    region: 'us-east-1',
    envs: {
      "T1": "V1",
      "T2": "V2"
    },
  };
}

function makeProject(overrides?: {
  blocks?: Block[];
  connections?: Connection[];
  includeVpc?: boolean;
  includeFixedIp?: boolean;
}): Project {
  return {
    blocks: overrides?.blocks ?? [],
    connections: overrides?.connections ?? [],
    project: {
      projectName: 'test-project',
      projectId: 'proj-123',
      includeVpc: overrides?.includeVpc ?? false,
      includeFixedIp: overrides?.includeFixedIp ?? false,
      vpcId: '',
    },
    version: '1.0.0',
  };
}

describe('genAwsTerraformDeployData', () => {
  it('generates terraform, provider, lambda, API gateway and IAM for API->Lambda->Response', async () => {
    const apiBlock = createApiBlock({
      id: 'api-1',
      properties: { isSynchronous: true, path: '/items', method: 'GET' },
    });
    const fnBlock = createFunctionBlock({
      id: 'fn-1',
      status: 'unpublished',
      inputs: [createConnector({ id: 'fn-in-1', name: 'defaultIn' })],
      outputs: [createConnector({ id: 'fn-out-1', name: 'response' })],
    });
    const responseBlock = createResponseBlock({ id: 'resp-1' });

    const conn1 = createConnection({
      id: 'c1',
      fromBlockId: 'api-1',
      toBlockId: 'fn-1',
      fromConnectorId: 'api-out-1',
      toConnectorId: 'fn-in-1',
    });
    const conn2 = createConnection({
      id: 'c2',
      fromBlockId: 'fn-1',
      toBlockId: 'resp-1',
      fromConnectorId: 'fn-out-1',
      toConnectorId: 'response-in-1',
    });

    const params = makeDeployParams();
    const project = makeProject({
      blocks: [apiBlock as any, fnBlock as any, responseBlock as any],
      connections: [conn1, conn2],
    });

    const items = await genAwsTerraformDeployData(params, project);
    const serialized = serializeTerraform(items);

    expect(serialized).toContain('terraform');
    expect(serialized).toContain('provider "aws"');
    expect(serialized).toContain('aws_lambda_function');
    expect(serialized).toContain('aws_apigatewayv2_api');
    expect(serialized).toContain('aws_iam_role');
  });

  it('generates SQS resources for Lambda->Queue->Lambda', async () => {
    const fn1 = createFunctionBlock({
      id: 'fn-1',
      title: 'Sender',
      status: 'unpublished',
      inputs: [createConnector({ id: 'fn1-in', name: 'defaultIn' })],
      outputs: [createConnector({ id: 'fn1-out', name: 'toQueue' })],
    });
    const fn2 = createFunctionBlock({
      id: 'fn-2',
      title: 'Receiver',
      status: 'unpublished',
      inputs: [createConnector({ id: 'fn2-in', name: 'fromQueue' })],
      outputs: [],
    });

    // Use a queue connection to trigger synthetic queue creation
    const queueConn = createQueueConnection({
      id: 'qc1',
      fromBlockId: 'fn-1',
      toBlockId: 'fn-2',
      fromConnectorId: 'fn1-out',
      toConnectorId: 'fn2-in',
    });

    // Also need an input trigger for fn-1 so it has inputs
    const apiBlock = createApiBlock({ id: 'api-1' });
    const apiConn = createConnection({
      id: 'ac1',
      fromBlockId: 'api-1',
      toBlockId: 'fn-1',
      fromConnectorId: 'api-out-1',
      toConnectorId: 'fn1-in',
    });

    const params = makeDeployParams();
    const project = makeProject({
      blocks: [apiBlock as any, fn1 as any, fn2 as any],
      connections: [apiConn, queueConn],
    });

    const items = await genAwsTerraformDeployData(params, project);
    const serialized = serializeTerraform(items);

    expect(serialized).toContain('aws_sqs_queue');
  });

  it('generates EventBridge rule for Schedule->Lambda', async () => {
    const scheduleBlock = createScheduleBlock({
      id: 'sched-1',
      title: 'DailyJob',
    });
    const fnBlock = createFunctionBlock({
      id: 'fn-1',
      status: 'unpublished',
      inputs: [createConnector({ id: 'fn-in-1', name: 'defaultIn' })],
    });

    const conn = createConnection({
      id: 'c1',
      fromBlockId: 'sched-1',
      toBlockId: 'fn-1',
      fromConnectorId: 'schedule-out-1',
      toConnectorId: 'fn-in-1',
    });

    const params = makeDeployParams();
    const project = makeProject({
      blocks: [scheduleBlock as any, fnBlock as any],
      connections: [conn],
    });

    const items = await genAwsTerraformDeployData(params, project);
    const serialized = serializeTerraform(items);

    expect(serialized).toContain('aws_cloudwatch_event_rule');
    expect(serialized).toContain('aws_cloudwatch_event_target');
  });

  it('generates VPC infrastructure when includeVpc is true', async () => {
    const fnBlock = createFunctionBlock({
      id: 'fn-1',
      status: 'unpublished',
      inputs: [createConnector({ id: 'fn-in-1', name: 'defaultIn' })],
    });
    const apiBlock = createApiBlock({ id: 'api-1' });
    const conn = createConnection({
      id: 'c1',
      fromBlockId: 'api-1',
      toBlockId: 'fn-1',
      fromConnectorId: 'api-out-1',
      toConnectorId: 'fn-in-1',
    });

    const params = makeDeployParams();
    const project = makeProject({
      blocks: [apiBlock as any, fnBlock as any],
      connections: [conn],
      includeVpc: true,
    });

    const items = await genAwsTerraformDeployData(params, project);
    const serialized = serializeTerraform(items);

    expect(serialized).toContain('aws_vpc');
    expect(serialized).toContain('aws_subnet');
  });

  it('excludes blocks with status new', async () => {
    const fnNew = createFunctionBlock({
      id: 'fn-new',
      status: 'new',
      inputs: [createConnector({ id: 'fn-in', name: 'defaultIn' })],
    });
    const apiBlock = createApiBlock({ id: 'api-1' });
    const conn = createConnection({
      id: 'c1',
      fromBlockId: 'api-1',
      toBlockId: 'fn-new',
      fromConnectorId: 'api-out-1',
      toConnectorId: 'fn-in',
    });

    const params = makeDeployParams();
    const project = makeProject({
      blocks: [apiBlock as any, fnNew as any],
      connections: [conn],
    });

    const items = await genAwsTerraformDeployData(params, project);
    const serialized = serializeTerraform(items);

    // Should not contain lambda since the block has status 'new'
    expect(serialized).not.toContain('aws_lambda_function');
  });

  it('excludes blocks with skipDeploy', async () => {
    const fnSkip = createFunctionBlock({
      id: 'fn-skip',
      status: 'unpublished',
      properties: { language: 'typescript', languageVersion: '5.0', skipDeploy: true },
      inputs: [createConnector({ id: 'fn-in', name: 'defaultIn' })],
    });
    const apiBlock = createApiBlock({ id: 'api-1' });
    const conn = createConnection({
      id: 'c1',
      fromBlockId: 'api-1',
      toBlockId: 'fn-skip',
      fromConnectorId: 'api-out-1',
      toConnectorId: 'fn-in',
    });

    const params = makeDeployParams();
    const project = makeProject({
      blocks: [apiBlock as any, fnSkip as any],
      connections: [conn],
    });

    const items = await genAwsTerraformDeployData(params, project);
    const serialized = serializeTerraform(items);

    expect(serialized).not.toContain('aws_lambda_function');
  });
});
