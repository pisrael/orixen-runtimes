import * as Handlebars from 'handlebars';

import { FileSystem } from '../../../filesystem';
import { Block } from '../../types/blocks/Block';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import { Connection } from '../../types/connections/Connection';
import { getBlockPath } from '../../utils';
import { generateBlockProperties } from './generateBlockProperties';
import { generateConnectorLibCode } from './generateConnectorLibCode';
import { generateConnectorsInterfacesAndType } from './generateConnectorsInterfacesAndType';
import { generateIDs } from './generateIDs';

interface GenerateBlockLibFilesParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
  inputBlocks: Block[];
  outputBlocks: Block[];
  inputConnections: Connection[];
  outputConnections: Connection[];
}

export async function generateBlockLibFiles({
  fs,
  resourcesPath,
  projectPath,
  block,
  inputBlocks,
  outputBlocks,
  inputConnections,
  outputConnections,
}: GenerateBlockLibFilesParams): Promise<void> {
  const { inputs, outputs } = block;
  const blockPath = getBlockPath(projectPath, block);
  const blockLibPath = fs.join(blockPath, '_lib');

  await generateInputsFile(fs, resourcesPath, blockLibPath, inputs);
  await generateOutputsFile(fs, resourcesPath, blockLibPath, outputs);
  await generateIdsFile(fs, blockLibPath, block, inputBlocks, outputBlocks, inputConnections, outputConnections);
  await generatePropertiesFile(fs, projectPath, blockLibPath, block);
  await generateIoTypesFile(fs, resourcesPath, blockLibPath, inputs.length, outputs.length);
  await copyFunctionStatusFile(fs, resourcesPath, blockLibPath);
}

async function generateInputsFile(
  fs: FileSystem,
  resourcesPath: string,
  blockLibPath: string,
  inputs: FunctionBlock['inputs']
): Promise<void> {
  const inputStrings = generateConnectorsInterfacesAndType(inputs, 'Input');
  const generatedInputCode = await generateConnectorLibCode({
    fs,
    resourcesPath,
    parsed: inputStrings,
    connectorType: 'inputs',
  });
  await fs.writeFile(fs.join(blockLibPath, 'inputs.ts'), generatedInputCode);
}

async function generateOutputsFile(
  fs: FileSystem,
  resourcesPath: string,
  blockLibPath: string,
  outputs: FunctionBlock['outputs']
): Promise<void> {
  const outputStrings = generateConnectorsInterfacesAndType(outputs, 'Output');
  const generatedOutputCode = await generateConnectorLibCode({
    fs,
    resourcesPath,
    parsed: outputStrings,
    connectorType: 'outputs',
  });
  await fs.writeFile(fs.join(blockLibPath, 'outputs.ts'), generatedOutputCode);
}

async function generateIdsFile(
  fs: FileSystem,
  blockLibPath: string,
  block: Block,
  inputBlocks: Block[],
  outputBlocks: Block[],
  inputConnections: Connection[],
  outputConnections: Connection[]
): Promise<void> {
  const idsCode = generateIDs({
    block,
    inputConnections,
    inputBlocks,
    outputBlocks,
    outputConnections,
  });
  await fs.writeFile(fs.join(blockLibPath, 'ids.ts'), idsCode);
}

async function generatePropertiesFile(
  fs: FileSystem,
  projectPath: string,
  blockLibPath: string,
  block: FunctionBlock
): Promise<void> {
  const blockPropertiesCode = await generateBlockProperties({
    fs,
    projectPath,
    block,
  });
  await fs.writeFile(fs.join(blockLibPath, 'block-properties.ts'), blockPropertiesCode);
}

async function generateIoTypesFile(
  fs: FileSystem,
  resourcesPath: string,
  blockLibPath: string,
  inputLength: number,
  outputLength: number
): Promise<void> {
  const templatePath = fs.join(resourcesPath, 'typescript_io-types.ts.hbs');
  const templateContent = await fs.readFile(templatePath);

  const template = Handlebars.compile(templateContent);
  const ioTypesCode = template({ inputLength, outputLength });

  await fs.writeFile(fs.join(blockLibPath, 'io-types.ts'), ioTypesCode);
}

async function copyFunctionStatusFile(
  fs: FileSystem,
  resourcesPath: string,
  blockLibPath: string
): Promise<void> {
  const sourcePath = fs.join(resourcesPath, 'typescript_function-status.ts');
  const destPath = fs.join(blockLibPath, 'function-status.ts');
  await fs.copy(sourcePath, destPath);
}
