import * as Handlebars from 'handlebars';

import { FileSystem } from '../../../filesystem';
import { BlockConnector } from '../../types/blocks/Block';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import {
  formatFileName,
  getBlockPath,
  toPascalCase
} from '../../utils';

interface GenerateConnectorCodeParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
  connector: BlockConnector;
  connectorType: 'inputs' | 'outputs';
}

export async function generateConnectorCode({
  fs,
  resourcesPath,
  projectPath,
  block,
  connector,
  connectorType,
}: GenerateConnectorCodeParams): Promise<void> {
  const templatePath = fs.join(resourcesPath, 'connector.ts.hbs');
  const templateContent = await fs.readFile(templatePath);

  const template = Handlebars.compile(templateContent);
  const content = template({ name: toPascalCase(connector.name) });

  const blockPath = getBlockPath(projectPath, block);
  const filePath = fs.join(blockPath, connectorType, `${formatFileName(connector.name)}.ts`);
  await fs.writeFile(filePath, content);
}