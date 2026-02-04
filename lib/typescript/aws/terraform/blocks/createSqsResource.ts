import { QueueBlock } from '../../../../types/blocks/QueueBlock';
import { TerraformResourceSqsQueue } from '../types';
import { generateTerraformBlockName } from './generateTerraformId';

export function createSqsResource(terraformPrefix: string, block: QueueBlock): TerraformResourceSqsQueue {
  const name = `${terraformPrefix}-${generateTerraformBlockName(block)}`;
  const sqsResource: TerraformResourceSqsQueue = {
    key: 'resource',
    name,
    type: 'aws_sqs_queue',
    properties: {
      name,
      fifo_queue: block.properties.fifo,
      visibility_timeout_seconds: block.properties.visibilityTimeout,
      message_retention_seconds: block.properties.messageRetentionPeriod,
      delay_seconds: block.properties.delaySeconds,
    },
  };

  return sqsResource;
}