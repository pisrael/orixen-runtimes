import { Block, BlockSchema } from "./Block";

export interface ApiBlock extends Block {
  type: 'apiTrigger';
  properties: {
    isSynchronous: boolean;
    path: string;
    method: ApiMethod;
  };
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface ApiBlockSchema extends BlockSchema {
  type: 'apiTrigger';
};