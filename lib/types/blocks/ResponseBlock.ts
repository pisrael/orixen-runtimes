import { Block, BlockSchema } from "./Block";

export interface ResponseBlock extends Block {
  type: 'response';
}

export interface ResponseBlockSchema extends BlockSchema {
  type: 'response';
  width: 40;
  height: 40;
  minInputs: 1;
  maxInputs: 1;
  minOutputs: 0;
  maxOutputs: 0;
};