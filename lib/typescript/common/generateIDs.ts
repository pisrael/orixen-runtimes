import { Block } from '../../types/blocks/Block';
import { Connection } from '../../types/connections/Connection';
import { toPascalCase } from '../../utils';
import { isApiTriggerBlock } from '../../utils/isApiTriggerBlock';

interface GenerateIDsParams {
  block: Block;
  inputConnections: Connection[];
  inputBlocks: Block[];
  outputBlocks: Block[];
  outputConnections: Connection[];
}

export function generateIDs({
  block,
  inputConnections,
  inputBlocks,
  outputBlocks,
  outputConnections,
}: GenerateIDsParams): string {
  const inputConnectionsMap = buildInputConnectionsMap(inputConnections, inputBlocks);
  const outputTypesRecord = buildOutputTypesRecord(outputConnections, outputBlocks);
  const outputNameToIdRecord = buildOutputNameToIdRecord(block);
  const inputSynchronousRecord = buildInputSynchronousRecord(inputConnections, inputBlocks);
  const outputResponseRecord = buildOutputResponseRecord(outputConnections, outputBlocks);

  return `
export const OUTPUTS_TYPES: Record<string, string> = ${JSON.stringify(outputTypesRecord, null, 2)};

export const OUTPUT_NAME_TO_ID: Record<string, string> = ${JSON.stringify(outputNameToIdRecord, null, 2)};

export const INPUT_CONNECTIONS: Record<string, string> = ${JSON.stringify(inputConnectionsMap, null, 2)};

export const INPUT_SYNCHRONOUS: Record<string, boolean> = ${JSON.stringify(inputSynchronousRecord, null, 2)}

export const OUTPUT_RESPONSE: Record<string, boolean> = ${JSON.stringify(outputResponseRecord, null, 2)}
`;
}

export function buildInputConnectionsMap(
  inputConnections: Connection[],
  inputBlocks: Block[]
): Record<string, string> {
  const inputConnectionsMap: Record<string, string> = {};

  inputConnections.forEach((connection) => {
    const inputBlock = inputBlocks.find((b) => b.id === connection.fromBlockId);
    if (!inputBlock) return;

    switch (inputBlock.type) {
      case 'function':
        inputConnectionsMap[connection.fromConnectorId] = connection.toConnectorId;
        break;
      case 'apiTrigger':
        if (isApiTriggerBlock(inputBlock)) {
          inputConnectionsMap[inputBlock.properties.path] = connection.toConnectorId;
        }
        break;
      case 'scheduleTrigger':
        inputConnectionsMap[inputBlock.title] = connection.toConnectorId;
        break;
    }
  });

  return inputConnectionsMap;
}

export function buildOutputTypesRecord(
  outputConnections: Connection[],
  outputBlocks: Block[]
): Record<string, string> {
  const outputTypesRecord: Record<string, string> = {};

  outputConnections.forEach((connection) => {
    const connectionType = connection.connectionType;
    const outputBlock = outputBlocks.find((b) => b.id === connection.toBlockId);
    const outputType = connectionType === 'queue' ? 'queue' : (outputBlock?.type || 'function');
    outputTypesRecord[connection.fromConnectorId] = outputType;

    if (!outputTypesRecord.default) {
      outputTypesRecord.default = outputType;
    }
  });

  return outputTypesRecord;
}

export function buildOutputNameToIdRecord(block: Block): Record<string, string> {
  const outputNameToIdRecord: Record<string, string> = {};

  for (const output of block.outputs) {
    const outputNamePascalCase = toPascalCase(output.name);
    outputNameToIdRecord[outputNamePascalCase] = output.id;

    if (!outputNameToIdRecord.default) {
      outputNameToIdRecord.default = output.id;
    }
  }

  return outputNameToIdRecord;
}

export function buildInputSynchronousRecord(
  inputConnections: Connection[],
  inputBlocks: Block[]
): Record<string, boolean> {
  const inputSynchronousRecord: Record<string, boolean> = {};

  inputConnections.forEach((connection) => {
    const inputBlock = inputBlocks.find((b) => b.id === connection.fromBlockId);
    if (!inputBlock) return;

    if (isApiTriggerBlock(inputBlock) && inputBlock.properties.isSynchronous) {
      inputSynchronousRecord[connection.toConnectorId] = true;
    }
  });

  return inputSynchronousRecord;
}

export function buildOutputResponseRecord(
  outputConnections: Connection[],
  outputBlocks: Block[]
): Record<string, boolean> {
  const outputResponseRecord: Record<string, boolean> = {};

  outputConnections.forEach((connection) => {
    const outputBlock = outputBlocks.find((b) => b.id === connection.toBlockId);
    if (!outputBlock) return;

    if (outputBlock.type === 'response') {
      outputResponseRecord[connection.fromConnectorId] = true;
    }
  });

  return outputResponseRecord;
}
