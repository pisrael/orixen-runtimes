import { Block, BlockSchema } from "./Block";

export interface ScheduleBlock extends Block {
  type: 'scheduleTrigger';
  publicId: string;
  status: string;
  properties: {
    schedule: string;
    enabled: boolean;
    [key: string]: any;
  };
}

export interface ScheduleBlockSchema extends BlockSchema {
  type: 'scheduleTrigger';
}