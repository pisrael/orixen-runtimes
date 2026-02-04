import { Block, BlockSchema } from "./Block";

export interface WsBlock extends Block {
  type: 'wsTrigger';
  properties: {
    wsUrlEnvName?: string;
  };
}

export interface WsBlockSchema extends BlockSchema {
  type: 'wsTrigger';
};