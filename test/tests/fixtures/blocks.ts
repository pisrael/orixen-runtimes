import {
  ApiBlock,
  ApiMethod,
  BlockConnector,
  QueueBlock,
  ResponseBlock,
  ScheduleBlock,
  WsBlock
} from '../../../lib';

export function createConnector(overrides?: Partial<BlockConnector>): BlockConnector {
  return {
    id: 'conn-1',
    name: 'defaultIn',
    x: 0,
    y: 0,
    ...overrides,
  };
}

interface FunctionBlockData {
  id: string;
  deployId: string;
  isPrimitive: boolean;
  type: 'function';
  title: string;
  description?: string;
  icon: string;
  category: 'process';
  inputs: BlockConnector[];
  outputs: BlockConnector[];
  properties: {
    language: string;
    languageVersion: string;
    skipDeploy?: boolean;
    dependsOn?: string[];
    lambda?: Record<string, any>;
  };
  appVersion: string;
  publicId: string;
  status: 'new' | 'unpublished' | 'published' | null;
}

export function createFunctionBlock(overrides?: Partial<FunctionBlockData>): FunctionBlockData {
  return {
    id: 'block-fn-1',
    deployId: 'deploy-fn-1',
    isPrimitive: false,
    type: 'function',
    title: 'My Function',
    icon: 'function',
    category: 'process',
    inputs: [createConnector({ id: 'input-1', name: 'defaultIn' })],
    outputs: [createConnector({ id: 'output-1', name: 'defaultOut' })],
    properties: {
      language: 'typescript',
      languageVersion: '5.0',
    },
    appVersion: '1.0.0',
    publicId: 'pub-fn-1',
    status: 'unpublished',
    ...overrides,
  };
}

export function createApiBlock(overrides?: Partial<ApiBlock>): ApiBlock {
  return {
    id: 'block-api-1',
    deployId: 'deploy-api-1',
    isPrimitive: true,
    type: 'apiTrigger',
    title: 'API Trigger',
    icon: 'api',
    category: 'trigger',
    inputs: [],
    outputs: [createConnector({ id: 'api-out-1', name: 'defaultOut' })],
    properties: {
      isSynchronous: false,
      path: '/items',
      method: 'GET' as ApiMethod,
    },
    appVersion: '1.0.0',
    ...overrides,
  } as ApiBlock;
}

export function createQueueBlock(overrides?: Partial<QueueBlock>): QueueBlock {
  return {
    id: 'block-queue-1',
    deployId: 'deploy-queue-1',
    isPrimitive: true,
    type: 'queue',
    title: 'My Queue',
    icon: 'queue',
    category: 'process',
    inputs: [createConnector({ id: 'queue-in-1', name: 'defaultIn' })],
    outputs: [createConnector({ id: 'queue-out-1', name: 'defaultOut' })],
    properties: {
      fifo: false,
      visibilityTimeout: 30,
      messageRetentionPeriod: 345600,
      delaySeconds: 0,
    },
    publicId: 'pub-queue-1',
    status: 'unpublished',
    appVersion: '1.0.0',
    ...overrides,
  } as QueueBlock;
}

export function createResponseBlock(overrides?: Partial<ResponseBlock>): ResponseBlock {
  return {
    id: 'block-response-1',
    deployId: 'deploy-response-1',
    isPrimitive: true,
    type: 'response',
    title: 'Response',
    icon: 'response',
    category: 'end',
    inputs: [createConnector({ id: 'response-in-1', name: 'defaultIn' })],
    outputs: [],
    properties: {},
    appVersion: '1.0.0',
    ...overrides,
  } as ResponseBlock;
}

export function createScheduleBlock(overrides?: Partial<ScheduleBlock>): ScheduleBlock {
  return {
    id: 'block-schedule-1',
    deployId: 'deploy-schedule-1',
    isPrimitive: true,
    type: 'scheduleTrigger',
    title: 'Daily Schedule',
    icon: 'schedule',
    category: 'trigger',
    inputs: [],
    outputs: [createConnector({ id: 'schedule-out-1', name: 'defaultOut' })],
    properties: {
      schedule: 'cron(0 12 * * ? *)',
      enabled: true,
    },
    publicId: 'pub-schedule-1',
    status: 'unpublished',
    appVersion: '1.0.0',
    ...overrides,
  } as ScheduleBlock;
}

export function createWsBlock(overrides?: Partial<WsBlock>): WsBlock {
  return {
    id: 'block-ws-1',
    deployId: 'deploy-ws-1',
    isPrimitive: true,
    type: 'wsTrigger',
    title: 'WebSocket',
    icon: 'websocket',
    category: 'trigger',
    inputs: [],
    outputs: [createConnector({ id: 'ws-out-1', name: 'defaultOut' })],
    properties: {},
    appVersion: '1.0.0',
    ...overrides,
  } as WsBlock;
}
