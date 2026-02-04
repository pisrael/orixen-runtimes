import { ApiBlock } from '../types/blocks/ApiBlock';
import { Block } from '../types/blocks/Block';

export function isApiTriggerBlock(block: Block): block is ApiBlock {
  return block && block.type === 'apiTrigger';
}