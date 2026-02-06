import * as Handlebars from 'handlebars';

import { FileSystem } from '../../../filesystem';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import {
  getBlockPath,
  toPascalCase
} from '../../utils';

interface GeneratePackageJsonParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
}

export async function generatePackageJson(params: GeneratePackageJsonParams): Promise<void> {
  const blockPath = getBlockPath(params.projectPath, params.block);
  const sourcePath = params.fs.join(params.resourcesPath, 'typescript_shared_package.json.hbs');
  const templateContent = await params.fs.readFile(sourcePath);

  const template = Handlebars.compile(templateContent);
  const content = template({ 
    name: toPascalCase(params.block.title),
    description: params.block.description || ''  }
  );

  await params.fs.writeFile(params.fs.join(blockPath, 'package.json'), content);
}