import { DeployParams } from '../../../GeneratorInterface';
import { ApiBlock } from '../../../types/blocks/ApiBlock';
import { Block } from '../../../types/blocks/Block';
import { FunctionBlock } from '../../../types/blocks/FunctionBlock';
import { QueueBlock } from '../../../types/blocks/QueueBlock';
import { ScheduleBlock } from '../../../types/blocks/ScheduleBlock';
import { WsBlock } from '../../../types/blocks/WsBlock';
import { Connection } from '../../../types/connections/Connection';
import { QueuedConnection } from '../../../types/connections/QueuedConnection';
import { Project } from '../../../types/Project';
import { getItemReference } from '../../../terraform/serializeTerraform/getItemReference';
import { createApiGatewayHttpResource } from './blocks/createApiGatewayHttpResource';
import { createApiGatewayWsResource } from './blocks/createApiGatewayWsResource';
import {
  createBasicLambdaDocuments,
  createWsManageConnectionsLambdaDocuments
} from './blocks/createLambdaDocuments';
import { createLambdaItems } from './blocks/createLambdaItems';
import { createScheduleResource } from './blocks/createScheduleResource';
import { createSqsResource } from './blocks/createSqsResource';
import { createSyntheticBlocksAndConnections } from './blocks/createSyntheticBlocksAndConnections';
import { createApiToLambdaConnection } from './connections/createApiToLambdaConnection';
import { createLambdaToLambdaConnection } from './connections/createLambdaToLambdaConnection';
import { createLambdaToQueueConnection } from './connections/createLambdaToQueueConnection';
import { createQueueToLambdaConnection } from './connections/createQueueToLambdaConnection';
import { createScheduleToLambdaConnection } from './connections/createScheduleToLambdaConnection';
import {
  createAllowLambdaToRespondToWs,
  createWsToLambdaConnection
} from './connections/createWsToLambdaConnection';
import { createAwsSetup } from './createAwsSetup';
import {
  createProjectInfra,
  ProjectInfra
} from './createProjectInfra';
import { createRolePolicy } from './createRolePolicy';
import {
  TerraformDataIamPolicyDocument,
  TerraformItem,
  TerraformOutput,
  TerraformResourceApiGatewayV2Api,
  TerraformResourceApiGatewayV2Stage,
  TerraformResourceCloudWatchEventRule,
  TerraformResourceIamPolicy,
  TerraformResourceIamRole,
  TerraformResourceLambdaFunction,
  TerraformResourceSqsQueue
} from './types';
import { generateTerraformPrefix } from './utils/terraformNaming';

export async function genAwsTerraformDeployData(params: DeployParams, project: Project): Promise<TerraformItem[]> {
  const projectId = project.project.projectId;
  const projectName = project.project.projectName;
  const region = params.region;
  const terraformPrefix = generateTerraformPrefix(projectId, projectName);

  const { newBlocks: blocks, newConnections: connections } = await createSyntheticBlocksAndConnections(project.connections, project.blocks);
  const setup = createAwsSetup(region, projectName);
  const projectInfra = createProjectInfra(terraformPrefix, project.project.includeVpc, project.project.includeFixedIp);
  const terraformBlockItems = await parseBlocksToTerraform({ blocks, terraformPrefix, projectInfra, envs: params.envs, region });
  const connectionItems = parseConnectionsToTerraform({ connections, blocks, terraformBlockItems, terraformPrefix });
  addStageDependsOnRoutes(terraformBlockItems, connectionItems);
  parseBlocksDependencies(blocks, terraformBlockItems);
  const outputs = parseOutputs(projectInfra, terraformBlockItems);

  return [
    setup.terraform,
    ...setup.providers,
    ...Object.values(projectInfra).filter(Boolean),
    ...terraformBlockItems.items,
    ...connectionItems,
    ...outputs
  ]
}

export interface TerraformBlockItems {
  items: TerraformItem[]
  apiGateway?: { api: TerraformResourceApiGatewayV2Api; stage: TerraformResourceApiGatewayV2Stage };
  wsGateway?: { api: TerraformResourceApiGatewayV2Api; stage: TerraformResourceApiGatewayV2Stage };
  schedules: Record<string, TerraformResourceCloudWatchEventRule>
  lambdas: Record<string, TerraformResourceLambdaFunction>
  lambdaRoles: Record<string, TerraformResourceIamRole>
  queues: Record<string, TerraformResourceSqsQueue>
  lambdaBasicRoleDocument?: TerraformDataIamPolicyDocument;
  lambdaWsRolePolicy?: TerraformResourceIamPolicy;
}

export interface ParseBlocksToTerraformParams {
  blocks: Block[];
  terraformPrefix: string;
  projectInfra: ProjectInfra;
  envs: Record<string, string>;
  region: string;
}

async function parseBlocksToTerraform({
  blocks,
  terraformPrefix,
  projectInfra,
  envs,
  region
}: ParseBlocksToTerraformParams): Promise<TerraformBlockItems> {

  const items: TerraformItem[] = [];
  let lambdaBasicRoleDocument: TerraformDataIamPolicyDocument | undefined;
  let lambdaWsRolePolicy: TerraformResourceIamPolicy | undefined;
  let apiGateway: { api: TerraformResourceApiGatewayV2Api; stage: TerraformResourceApiGatewayV2Stage } | undefined;
  let wsGateway: { api: TerraformResourceApiGatewayV2Api; stage: TerraformResourceApiGatewayV2Stage } | undefined;
  const schedules: Record<string, TerraformResourceCloudWatchEventRule> = {};
  const lambdas: Record<string, TerraformResourceLambdaFunction> = {};
  const lambdaRoles: Record<string, TerraformResourceIamRole> = {};
  const queues: Record<string, TerraformResourceSqsQueue> = {};

  for (const block of blocks) {
    if (block.type == 'function') {
      const functionBlock = block as FunctionBlock;
      if (functionBlock.status === 'new' || functionBlock.properties.skipDeploy) continue;
      if (!lambdaBasicRoleDocument) {
        lambdaBasicRoleDocument = createBasicLambdaDocuments(terraformPrefix);
        items.push(lambdaBasicRoleDocument);
      }

      const lambdaItems = await createLambdaItems({
        block: functionBlock,
        terraformPrefix,
        lambdaBasicRoleDocument,
        projectInfra,
        blockEnvs: envs,
        region
      });
      items.push(...lambdaItems.items);
      lambdas[block.id] = lambdaItems.lambda;
      lambdaRoles[block.id] = lambdaItems.role;
    } else if (block.type == 'queue') {
      const queue = createSqsResource(terraformPrefix, block as QueueBlock);
      items.push(queue);
      queues[block.id] = queue;
    } else if (block.type == 'apiTrigger') {
      if (!apiGateway) {
        apiGateway = createApiGatewayHttpResource(terraformPrefix);
        items.push(apiGateway.api, apiGateway.stage);
      }
    } else if (block.type == 'wsTrigger') {
      if (!wsGateway) {
        wsGateway = createApiGatewayWsResource(terraformPrefix);
        if (!lambdaWsRolePolicy && projectInfra.awsCallerIdentity) {
          const lambdaWsRoleDocument = createWsManageConnectionsLambdaDocuments(wsGateway.api, wsGateway.stage, region, projectInfra.awsCallerIdentity);
          lambdaWsRolePolicy = createRolePolicy(lambdaWsRoleDocument);
          items.push(lambdaWsRoleDocument, lambdaWsRolePolicy);
        }
        items.push(wsGateway.api, wsGateway.stage);
      }
    }
    else if (block.type == 'scheduleTrigger') {
      const schedule = createScheduleResource(terraformPrefix, block as ScheduleBlock);
      items.push(schedule);
      schedules[block.id] = schedule;
    }
  }

  return {
    items,
    lambdas,
    lambdaRoles,
    queues,
    schedules,
    apiGateway,
    wsGateway,
    lambdaBasicRoleDocument,
    lambdaWsRolePolicy,
  };
}


export interface ParseConnectionsToTerraformParams {
  connections: Connection[];
  blocks: Block[];
  terraformBlockItems: TerraformBlockItems;
  terraformPrefix: string;
}
function parseConnectionsToTerraform({ connections, blocks, terraformBlockItems, terraformPrefix }: ParseConnectionsToTerraformParams): TerraformItem[] {
  const items: TerraformItem[] = [];

  for (const connection of connections) {
    const sourceBlock = blocks.find((b) => b.id == connection.fromBlockId);
    const targetBlock = blocks.find((b) => b.id == connection.toBlockId);

    if (sourceBlock && targetBlock) {
      if (sourceBlock.type == 'apiTrigger' && targetBlock.type == 'function') {
        const newItems = connectApiTriggerToLambdaFunction(sourceBlock as ApiBlock, targetBlock as FunctionBlock, terraformPrefix, terraformBlockItems);
        items.push(...newItems);
      } else if (sourceBlock.type == 'scheduleTrigger' && targetBlock.type == 'function') {
        const newItems = connectScheduleTriggerToLambdaFunction(sourceBlock as ScheduleBlock, targetBlock as FunctionBlock, terraformBlockItems);
        items.push(...newItems);
      } else if (sourceBlock.type == 'function' && targetBlock.type == 'function') {
        const newItems = connectLambdaToLambda(sourceBlock as FunctionBlock, targetBlock as FunctionBlock, connection, terraformBlockItems);
        items.push(...newItems);
      } else if (sourceBlock.type == 'function' && targetBlock.type == 'queue') {
        const newItems = connectLambdaToQueue(sourceBlock as FunctionBlock, targetBlock as QueueBlock, connection, terraformBlockItems);
        items.push(...newItems);
      } else if (sourceBlock.type == 'queue' && targetBlock.type == 'function') {
        const newItems = connectQueueToLambda(sourceBlock as QueueBlock, targetBlock as FunctionBlock, connection, terraformBlockItems);
        items.push(...newItems);
      } else if (sourceBlock.type == 'wsTrigger' && targetBlock.type == 'function') {
        const newItems = connectWsTriggerToLambdaFunction(targetBlock as FunctionBlock, terraformBlockItems, terraformPrefix, terraformBlockItems.lambdaWsRolePolicy);
        items.push(...newItems);
        const functions = findFunctionBlocksWithResponseOutput(targetBlock as FunctionBlock, blocks, connections);
        for (const functionBlock of functions) {
          const newItems = allowLambdaToRespondWs(terraformBlockItems, functionBlock);
          items.push(...newItems);
        }
      }
    }
  }
  return items;
}

function connectApiTriggerToLambdaFunction(sourceBlock: ApiBlock, targetBlock: FunctionBlock, terraformPrefix: string, terraformBlockItems: TerraformBlockItems) {
  if (targetBlock.status === 'new' || targetBlock.properties.skipDeploy) return [];
  const lambda = terraformBlockItems.lambdas[targetBlock.id];
  const api = terraformBlockItems.apiGateway?.api as TerraformResourceApiGatewayV2Api;
  const items = createApiToLambdaConnection({ terraformPrefix, lambda, api, sourceBlock, targetBlock });
  return items;
}

function connectScheduleTriggerToLambdaFunction(sourceBlock: ScheduleBlock, targetBlock: FunctionBlock, terraformBlockItems: TerraformBlockItems) {
  if (targetBlock.status === 'new' || targetBlock.properties.skipDeploy) return [];
  const lambda = terraformBlockItems.lambdas[targetBlock.id];
  const schedule = terraformBlockItems.schedules[sourceBlock.id];
  const items = createScheduleToLambdaConnection(lambda, schedule);
  return items;
}

function connectLambdaToLambda(sourceBlock: FunctionBlock, targetBlock: FunctionBlock, connection: Connection, terraformBlockItems: TerraformBlockItems) {
  if (targetBlock.status === 'new' || sourceBlock.status === 'new' || targetBlock.properties.skipDeploy || sourceBlock.properties.skipDeploy) return [];
  const lambda = terraformBlockItems.lambdas[sourceBlock.id];
  const lambdaRole = terraformBlockItems.lambdaRoles[sourceBlock.id];
  const targetLambda = terraformBlockItems.lambdas[targetBlock.id];
  const items = createLambdaToLambdaConnection(lambda, lambdaRole, targetLambda, connection);
  return items;
}

function connectLambdaToQueue(sourceBlock: FunctionBlock, targetBlock: QueueBlock, connection: Connection, terraformBlockItems: TerraformBlockItems) {
  if (sourceBlock.status === 'new' || sourceBlock.properties.skipDeploy) return [];
  const lambda = terraformBlockItems.lambdas[sourceBlock.id];
  const lambdaRole = terraformBlockItems.lambdaRoles[sourceBlock.id];
  const queue = terraformBlockItems.queues[targetBlock.id];
  const items = createLambdaToQueueConnection(connection, lambda, lambdaRole, queue);
  return items;
}

function connectQueueToLambda(sourceBlock: QueueBlock, targetBlock: FunctionBlock, connection: Connection, terraformBlockItems: TerraformBlockItems) {
  if (targetBlock.status === 'new' || targetBlock.properties.skipDeploy) return [];
  const queue = terraformBlockItems.queues[sourceBlock.id];
  const lambda = terraformBlockItems.lambdas[targetBlock.id];
  const lambdaRole = terraformBlockItems.lambdaRoles[targetBlock.id];
  const items = createQueueToLambdaConnection(connection as QueuedConnection, lambda, lambdaRole, queue);
  return items;
}

function connectWsTriggerToLambdaFunction(targetBlock: FunctionBlock, terraformBlockItems: TerraformBlockItems, terraformPrefix: string, lambdaWsRolePolicy?: TerraformResourceIamPolicy) {
  if (targetBlock.status === 'new' || targetBlock.properties.skipDeploy) return [];
  if (!lambdaWsRolePolicy) {
    throw new Error('LambdaWsRolePolicy is required to connect WebSocket trigger to Lambda function');
  }
  const lambda = terraformBlockItems.lambdas[targetBlock.id];
  const wsGateway = terraformBlockItems.wsGateway?.api;
  const wsStage = terraformBlockItems.wsGateway?.stage;
  const items = createWsToLambdaConnection({
    lambda,
    wsGateway,
    wsStage,
    targetBlock,
    terraformPrefix
  });
  return items;
}

function findFunctionBlocksWithResponseOutput(startBlock: FunctionBlock, blocks: Block[], connections: Connection[]): FunctionBlock[] {
  const functionBlocks: FunctionBlock[] = [];
  const stack: FunctionBlock[] = [startBlock];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) continue;
    const allConnectedFromCurrent = connections.filter((c) => c.fromBlockId === current.id);
    for (const connectionFromCurrent of allConnectedFromCurrent) {
      const targetBlock = blocks.find((b) => b.id === connectionFromCurrent.toBlockId);
      if (targetBlock && targetBlock.type === 'function') {
        stack.push(targetBlock as FunctionBlock);
      } else if (targetBlock && targetBlock.type === 'response') {
        functionBlocks.push(current);
      }
    }
  }
  return functionBlocks;
}

function allowLambdaToRespondWs(terraformBlockItems: TerraformBlockItems, functionBlock: FunctionBlock) {
  const lambda = terraformBlockItems.lambdas[functionBlock.id];
  const lambdaRole = terraformBlockItems.lambdaRoles[functionBlock.id];
  const lambdaWsRolePolicy = terraformBlockItems.lambdaWsRolePolicy;
  const newItems = createAllowLambdaToRespondToWs(lambda, lambdaRole, lambdaWsRolePolicy);
  return newItems;
}

function addStageDependsOnRoutes(terraformBlockItems: TerraformBlockItems, connectionItems: TerraformItem[]) {
  const routeItems = connectionItems.filter(item => item.type === 'aws_apigatewayv2_route');
  if (routeItems.length === 0) return;

  const routeRefs = routeItems.map(route => getItemReference(route));

  if (terraformBlockItems.wsGateway) {
    terraformBlockItems.wsGateway.stage.properties.depends_on = routeRefs.filter(
      ref => ref.includes('_ws_gateway_')
    );
  }

  if (terraformBlockItems.apiGateway) {
    terraformBlockItems.apiGateway.stage.properties.depends_on = routeRefs.filter(
      ref => ref.includes('_api_gateway_')
    );
  }
}

function parseBlocksDependencies(blocks: Block[], terraformObjects: TerraformBlockItems) {
  for (const block of blocks) {
    if (block.type === 'function') {
      const functionBlock = block as FunctionBlock;
      if (functionBlock.properties.dependsOn && functionBlock.properties.dependsOn.length > 0) {
        functionBlock.properties.dependsOn.forEach(dependencyId => {
          const dependency = blocks.find((b => b.id === dependencyId));
          if (dependency && dependency.type === 'wsTrigger') {
            const wsGateway = terraformObjects.wsGateway;
            const lambda = terraformObjects.lambdas[functionBlock.id];
            if (lambda && lambda.properties?.environment?.variables && wsGateway) {
              const wsUrl = `\${aws_apigatewayv2_api.${wsGateway.api.name}.api_endpoint}/\${aws_apigatewayv2_stage.${wsGateway.stage.name}.name}`;
              const envName = ((dependency as WsBlock).properties.wsUrlEnvName || 'WS_URL').toUpperCase();
              lambda.properties.environment.variables.value[envName] = wsUrl;
            } else {
              throw new Error(`Cannot set Lambda environment variables for WebSocket URLs on block ${functionBlock.id}`);
            }
          }
        });
      }
    }
  }
}

function parseOutputs(projectInfra: ProjectInfra, terraformBlockItems: TerraformBlockItems): TerraformOutput[] {
  const outputs: TerraformOutput[] = [];

  if (projectInfra.vpc) {
    outputs.push({
      key: 'output',
      name: 'project_vpc_id',
      properties: {
        value: `&aws_vpc.${projectInfra.vpc.name}.id`,
      },
    });
  }

  if (projectInfra.natElasticIp) {
    outputs.push({
      key: 'output',
      name: 'project_fixed_ip',
      properties: {
        value: `&aws_eip.${projectInfra.natElasticIp.name}.public_ip`,
      },
    });
  }

  if (terraformBlockItems.apiGateway) {
    outputs.push({
      key: 'output',
      name: 'api_gateway_url',
      properties: {
        value: `\${aws_apigatewayv2_api.${terraformBlockItems.apiGateway.api.name}.api_endpoint}/\${aws_apigatewayv2_stage.${terraformBlockItems.apiGateway.stage.name}.name}`,
      },
    });
  }

  if (terraformBlockItems.wsGateway) {
    outputs.push({
      key: 'output',
      name: 'ws_wss_url',
      properties: {
        value: `\${aws_apigatewayv2_api.${terraformBlockItems.wsGateway.api.name}.api_endpoint}/\${aws_apigatewayv2_stage.${terraformBlockItems.wsGateway.stage.name}.name}`,
      },
    });
  }

  return outputs;
}