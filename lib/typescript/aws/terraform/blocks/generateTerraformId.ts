import { Block } from '../../../../types/blocks/Block';
import { FunctionBlock } from '../../../../types/blocks/FunctionBlock';
import {
  sanitizeBlockId,
  sanitizeDeployId
} from '../utils/terraformNaming';

export function generateTerraformFunctionBlockName(block: FunctionBlock) {
  const deployId = sanitizeDeployId(block.deployId);
  const blockId = sanitizeBlockId(block.id);
  return `${deployId}${blockId}`;
}

export function generateTerraformBlockName(block: Block) {
  const blockId = sanitizeBlockId(block.id);
  return `${block.type}${blockId}`;
}