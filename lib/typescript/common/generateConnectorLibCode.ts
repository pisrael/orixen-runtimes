import * as Handlebars from 'handlebars';

import { FileSystem } from '../../../filesystem';
import { formatFileName } from '../../utils';
import { ParsedConnectors } from './types';

interface GenerateConnectorLibCodeParams {
  fs: FileSystem;
  resourcesPath: string;
  parsed: ParsedConnectors;
  connectorType: 'inputs' | 'outputs';
}

export async function generateConnectorLibCode({
  fs,
  resourcesPath,
  parsed,
  connectorType,
}: GenerateConnectorLibCodeParams): Promise<string> {
  const templatePath = fs.join(resourcesPath, `typescript_${connectorType}.ts.hbs`);
  const templateContent = await fs.readFile(templatePath);

  const template = Handlebars.compile(templateContent);

  return template({
    hasInterfaces: parsed.interfaces.length > 0,
    items: parsed.interfaces.map((type) => ({ type, file: formatFileName(type) })),
    names: parsed.names,
  });
}
