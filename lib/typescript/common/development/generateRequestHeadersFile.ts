import { FileSystem } from '../../../../filesystem';
import { FunctionBlock } from '../../../types/blocks/FunctionBlock';
import { getBlockPath } from '../../../utils';

interface GenerateDevelopmentFilesParams {
  fs: FileSystem;
  resourcesPath: string;
  projectPath: string;
  block: FunctionBlock;
}

export async function generateRequestHeadersFile(params: GenerateDevelopmentFilesParams): Promise<void> {
  const blockPath = getBlockPath(params.projectPath, params.block);
  const sourcePath = params.fs.join(
    params.resourcesPath,
    'typescript',
    'development',
    'request_headers.json'
  );
  const destPath = params.fs.join(blockPath, '.orixen', 'request', 'request_headers.json');
  await params.fs.copy(sourcePath, destPath);
}
