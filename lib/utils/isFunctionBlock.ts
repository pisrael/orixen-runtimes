import { Block } from '../types/blocks/Block';
import { FunctionBlock } from '../types/blocks/FunctionBlock';

export function isFunctionBlock(block: Block): block is FunctionBlock {
  return block && block.type === 'function';
}