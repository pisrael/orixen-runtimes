import * as YAML from 'yaml';

import { FileSystem } from '../../../filesystem';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import { getBlockPath } from '../../utils';

interface GenerateBlockPropertiesParams {
  fs: FileSystem;
  projectPath: string;
  block: FunctionBlock;
}

export async function generateBlockProperties({
  fs,
  projectPath,
  block,
}: GenerateBlockPropertiesParams): Promise<string> {
  const properties = await getBlockProperties(fs, projectPath, block);

  return `const BLOCK_PROPERTIES = ${JSON.stringify(properties, null, 2)};
export default BLOCK_PROPERTIES;`;
}

async function getBlockProperties(
  fs: FileSystem,
  projectPath: string,
  block: FunctionBlock
): Promise<Record<string, unknown>> {
  const blockPath = getBlockPath(projectPath, block);
  const filePath = fs.join(blockPath, '.orixen', 'block_properties.yaml');

  try {
    const exists = await fs.exists(filePath);
    if (!exists) {
      return {};
    }

    const data = await fs.readFile(filePath);
    if (!data) {
      return {};
    }

    const properties = YAML.parse(data);

    if (typeof properties === 'string' || (typeof properties === 'object' && Array.isArray(properties))) {
      throw new Error(`Invalid block properties format in ${filePath}`);
    }

    return properties || {};
  } catch (error) {
    throw new Error(`Unable to parse YAML block properties file ${filePath}: ${error instanceof Error ? error.message : error}`);
  }
}
