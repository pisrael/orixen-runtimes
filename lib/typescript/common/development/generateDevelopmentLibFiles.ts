
import { FileSystem } from '../../../../filesystem';
import { FunctionBlock } from '../../../types/blocks/FunctionBlock';
import { getBlockPath } from '../../../utils';

interface GenerateDevelopmentFilesParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
}

export async function generateDevelopmentLibFiles(params: GenerateDevelopmentFilesParams): Promise<void> {
  const blockPath = getBlockPath(params.projectPath, params.block);
  const blockLibPath = params.fs.join(blockPath, '_lib');

  await copyCliFile(params.fs, params.resourcesPath, blockLibPath);
  await copyEnvFile(params.fs, params.resourcesPath, blockLibPath);
}

async function copyCliFile(fs: FileSystem, resourcePath: string, blockLibPath: string): Promise<void> {
  const sourcePath = fs.join(
    resourcePath,
    'typescript_development_cli.ts'
  );
  const destPath = fs.join(blockLibPath, 'cli.ts');
  await fs.copy(sourcePath, destPath);
}

async function copyEnvFile(fs: FileSystem, resourcePath: string, libPath: string): Promise<void> {
  const sourcePath = fs.join(
    resourcePath,
    'typescript_development_env.ts'
  );
  const destPath = fs.join(libPath, 'env.ts');
  await fs.copy(sourcePath, destPath);
}