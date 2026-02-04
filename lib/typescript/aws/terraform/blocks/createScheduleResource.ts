import { ScheduleBlock } from '../../../../types/blocks/ScheduleBlock';
import { TerraformResourceCloudWatchEventRule } from '../types';
import { generateTerraformBlockName } from './generateTerraformId';

export function createScheduleResource(terraformPrefix: string, block: ScheduleBlock): TerraformResourceCloudWatchEventRule {
  const name = generateTerraformBlockName(block);
  const scheduleResource: TerraformResourceCloudWatchEventRule = {
    key: 'resource',
    name: `${terraformPrefix}-${name}`,
    type: 'aws_cloudwatch_event_rule',
    properties: {
      name: `${terraformPrefix}-${name}`,
      schedule_expression: `cron(${block.properties.schedule})`,
    },
  };

  return scheduleResource;
}