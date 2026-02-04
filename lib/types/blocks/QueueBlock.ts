import { Block, BlockSchema } from "./Block";

export interface QueueBlock extends Block {
  type: 'queue';
  publicId: string;
  status: string;
  properties: QueueProperties;
}

export interface QueueProperties {
  fifo: boolean;
  visibilityTimeout: number;
  messageRetentionPeriod: number;
  delaySeconds: number;
  batchSize?: number;
}

export interface QueueBlockSchema extends BlockSchema {
  type: 'queue';
}