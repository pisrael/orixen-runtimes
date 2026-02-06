import * as Handlebars from 'handlebars';

import { FileSystem } from '../../../filesystem';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import {
  getBlockPath,
  toPascalCase
} from '../../utils';

interface GenerateIndexTsParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
}

Handlebars.registerHelper('gt', function (this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
  return a > b ? options.fn(this) : options.inverse(this);
});

export async function generateIndexTs({
  fs,
  resourcesPath,
  projectPath,
  block,
}: GenerateIndexTsParams): Promise<void> {
  const templatePath = fs.join(resourcesPath, 'typescript_shared_index.ts.hbs');
  const templateContent = await fs.readFile(templatePath);

  const template = Handlebars.compile(templateContent);
  const indexCode = template({
    firstOutputName: toPascalCase(block?.outputs?.[0]?.name || ''),
    outputLength: block?.outputs?.length || 0,
    inputLength: block?.inputs?.length || 0,
  });

  const blockPath = getBlockPath(projectPath, block);
  await fs.writeFile(fs.join(blockPath, 'index.ts'), indexCode);
}
