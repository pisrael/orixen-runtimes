import { FileSystem } from '../../../../filesystem';
import { FunctionBlock } from '../../../types/blocks/FunctionBlock';
import { getBlockPath } from '../../../utils';

interface CopyBlockGitignoreParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
}

export async function copyBlockGitignore(params: CopyBlockGitignoreParams): Promise<void> {
  const blockPath = getBlockPath(params.projectPath, params.block);
  const sourcePath = params.fs.join(params.resourcesPath, 'typescript_development_block_gitignore');
  const destPath = params.fs.join(blockPath, '.gitignore');
  await params.fs.copy(sourcePath, destPath);
}
