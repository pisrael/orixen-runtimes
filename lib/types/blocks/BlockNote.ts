import { Block, BlockSchema } from "./Block";

export interface BlockNote extends Block {
  type: 'note';
  category: 'documentation';
}

export interface BlockNoteSchema extends BlockSchema {
  type: 'note';
  category: 'documentation';
  minInputs: 0;
  maxInputs: 0;
  minOutputs: 0;
  maxOutputs: 0;
};