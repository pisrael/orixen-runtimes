import * as Handlebars from 'handlebars';

import { FileSystem } from '../../../../filesystem';
import { FunctionBlock } from '../../../types/blocks/FunctionBlock';
import { getBlockPath } from '../../../utils';

interface GenerateVsCodeLaunchConfigParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
  projectId: string;
}


export async function generateVsCodeLaunchConfig(params: GenerateVsCodeLaunchConfigParams): Promise < void> {
  const blockPath = getBlockPath(params.projectPath, params.block);
  const templatePath = params.fs.join(
    params.resourcesPath,
    'typescript_development_vscode_launch.json.hbs'
  );

  const templateContent = await params.fs.readFile(templatePath);
  const template = Handlebars.compile(templateContent);
  const content = template({ projectId: params.projectId });

  const vscodePath = params.fs.join(blockPath, '.vscode');
  await params.fs.mkdir(vscodePath);
  await params.fs.writeFile(params.fs.join(vscodePath, 'launch.json'), content);
}
