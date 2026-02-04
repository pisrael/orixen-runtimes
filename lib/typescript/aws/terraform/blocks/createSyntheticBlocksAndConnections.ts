import { Block } from '../../../../types/blocks/Block';
import { FunctionBlock } from '../../../../types/blocks/FunctionBlock';
import { QueueBlock } from '../../../../types/blocks/QueueBlock';
import { Connection } from '../../../../types/connections/Connection';
import { QueuedConnection } from '../../../../types/connections/QueuedConnection';

export async function createSyntheticBlocksAndConnections(connections: Connection[], blocks: Block[]) {
  const { newBlocks, newConnections } = await createSytheticQueueAndConnectionsForQueuedConnections(blocks, connections);
  return { newBlocks, newConnections };
}

async function createSytheticQueueAndConnectionsForQueuedConnections(blocks: Block[], connections: Connection[]) {

  const queuedConnections: QueuedConnection[] = connections.filter((c) => c.connectionType === 'queue') as QueuedConnection[];

  let newBlocks: Block[] = [...blocks];
  let newConnections: (Connection)[] = [...connections];

  for (const connection of queuedConnections) {
    const sourceBlock = blocks.find((b) => b.id === connection.fromBlockId) as FunctionBlock | undefined;
    const targetBlock = blocks.find((b) => b.id === connection.toBlockId) as FunctionBlock | undefined;
    if (!sourceBlock || !targetBlock) continue;

    // Remove the direct queue connection to replace by explicit Queue block
    newConnections = newConnections.filter((c) => c.id !== connection.id);

    const queueBlock = await createSynthethicQueueBlock(newBlocks, sourceBlock, {
      fifo: connection.properties?.fifo || false,
      visibilityTimeout: connection.properties?.visibilityTimeout || 300,
      messageRetentionPeriod: connection.properties?.messageRetentionPeriod || 1209600,
      delaySeconds: connection.properties?.delaySeconds || 0,
    });

    newBlocks.push(queueBlock);

    // Wire function -> queue
    newConnections.push({
      id: `${connection.id}_queue_in`,
      isTemporary: false,
      fromBlockId: sourceBlock.id,
      toBlockId: queueBlock.id,
      connectionType: 'regular',
      fromConnectorId: connection.fromConnectorId,
      toConnectorId: queueBlock.inputs[0].id,
    });

    // Wire queue -> function (queued)
    newConnections.push({
      id: `${connection.id}_queue_out`,
      isTemporary: false,
      fromBlockId: queueBlock.id,
      toBlockId: targetBlock.id,
      connectionType: 'queue',
      fromConnectorId: queueBlock.outputs[0].id,
      toConnectorId: connection.toConnectorId,
      properties: { batchSize: connection.properties?.batchSize },
    } as QueuedConnection);
  }

  return { newBlocks, newConnections };
}

async function createSynthethicQueueBlock(newBlocks: Block[], baseBlock: FunctionBlock, overrides?: any): Promise<QueueBlock> {
  const existing = newBlocks.find((b) => b.id === `${baseBlock.id}_queue`) as QueueBlock | undefined;
  if (existing) return existing;

  const queueBlock: QueueBlock = {
    type: 'queue',
    id: `${baseBlock.id}_queue`,
    deployId: `${baseBlock.deployId}_queue`,
    publicId: '',
    status: 'active',
    isPrimitive: true,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    title: `${baseBlock.title} Queue`,
    properties: {
      fifo: false,
      visibilityTimeout: 300,
      messageRetentionPeriod: 1209600,
      delaySeconds: 0,
      ...(overrides || {}),
    },
    inputs: [
      { id: `${baseBlock.id}_queue_input`, name: `${baseBlock.title} Queue Input`, x: 0, y: 0 },
    ],
    outputs: [
      { id: `${baseBlock.id}_queue_output`, name: `${baseBlock.title} Queue Output`, x: 0, y: 0 },
    ],
    icon: 'queue',
    category: 'process',
    appVersion: '',
  };
  return queueBlock;
}