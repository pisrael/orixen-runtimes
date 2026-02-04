import { FunctionBlock } from '../types';

export function getBlockFolderName(title: string, blockId: string): string {
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, '_');
  return `${normalizedTitle}-${blockId}`;
}

export function getBlockPath(basePath: string, block: FunctionBlock): string {
  const folderName = getBlockFolderName(block.title, block.id);
  return `${basePath}/blocks/${folderName}`;
}