import { Block } from '../types/blocks/Block';
import {
  FunctionBlock,
  FunctionLanguage
} from '../types/blocks/FunctionBlock';
import { Connection } from '../types/connections/Connection';

export interface BlockCodeParams {
  block: FunctionBlock;
  codeLanguage?: FunctionLanguage;
  inputConnections: Connection[];
  inputBlocks: Block[];
  outputBlocks: Block[];
  outputConnections: Connection[];
}

export function getBlockCodeParams(
    block: FunctionBlock,
    connections: Connection[],
    blocks: Block[]
  ): BlockCodeParams {
    const inputConnections = connections.filter((c) => c.toBlockId === block.id);
    const outputConnections = connections.filter((c) => c.fromBlockId === block.id);

    const inputBlocks = inputConnections
      .map((c) => blocks.find((b) => b.id === c.fromBlockId))
      .filter((b): b is Block => b !== undefined);

    const outputBlocks = outputConnections
      .map((c) => blocks.find((b) => b.id === c.toBlockId))
      .filter((b): b is Block => b !== undefined);

    return {
      block,
      codeLanguage: block.properties.language,
      inputConnections,
      outputConnections,
      inputBlocks,
      outputBlocks,
    };
  }