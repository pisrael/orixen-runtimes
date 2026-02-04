import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformResource,
  TerraformResourceCloudWatchEventRule,
  TerraformResourceCloudWatchEventTarget,
  TerraformResourceLambdaFunction,
  TerraformResourceLambdaPermission
} from '../types';

export function createScheduleToLambdaConnection(
  lambda: TerraformResourceLambdaFunction, 
  schedule: TerraformResourceCloudWatchEventRule): TerraformResource[] {
  const name = `${schedule.name}_to_${lambda.name}`;
  const targetResource: TerraformResourceCloudWatchEventTarget = {
    key: 'resource',
    name,
    type: 'aws_cloudwatch_event_target',
    properties: {
      rule: getItemReference(schedule, 'name'),
      arn: getItemReference(lambda, 'arn'),
    },
  };

  const permissionResource: TerraformResourceLambdaPermission = {
    key: 'resource',
    name,
    type: 'aws_lambda_permission',
    properties: {
      action: 'lambda:InvokeFunction',
      function_name: getItemReference(lambda, 'function_name'),
      principal: 'events.amazonaws.com',
      source_arn: getItemReference(schedule, 'arn'),
      statement_id: name,
    },
  };

  return [targetResource, permissionResource]
}