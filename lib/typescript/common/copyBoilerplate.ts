import { FileSystem } from '../../../filesystem';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import { getBlockPath } from '../../utils';

export interface CopyBlockBoilerplateParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
}

export async function copyBlockBoilerplate(params: CopyBlockBoilerplateParams): Promise<void> {
  const blockPath = getBlockPath(params.projectPath, params.block);
  await copyTsConfig(params, blockPath);
  await copyDockerfileTemplate(params, blockPath);
}

async function copyTsConfig(params: CopyBlockBoilerplateParams, blockPath: string): Promise<void> {
  const sourcePath = params.fs.join(params.resourcesPath, 'typescript_shared_tsconfig.json');
  const destPath = params.fs.join(blockPath, 'tsconfig.json');
  await params.fs.copy(sourcePath, destPath);
}

async function copyDockerfileTemplate(params: CopyBlockBoilerplateParams, blockPath: string): Promise<void> {
  const sourcePath = params.fs.join(params.resourcesPath, 'typescript_shared_Dockerfile.hbs');
  const destPath = params.fs.join(blockPath, 'Dockerfile.hbs');
  await params.fs.copy(sourcePath, destPath);
}