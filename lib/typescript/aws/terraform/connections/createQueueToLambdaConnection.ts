import { QueuedConnection } from '../../../../types/connections/QueuedConnection';
import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformResourceIamPolicy,
  TerraformResourceIamRole,
  TerraformResourceIamRolePolicyAttachment,
  TerraformResourceLambdaEventSourceMapping,
  TerraformResourceLambdaFunction,
  TerraformResourceSqsQueue
} from '../types';

export function createQueueToLambdaConnection(
  connection: QueuedConnection,
  lambda: TerraformResourceLambdaFunction,
  lambdaRole: TerraformResourceIamRole,
  queue: TerraformResourceSqsQueue
) {
  const name = `${queue.name}_to_${lambda.name}`;

  // Create event source mapping to trigger Lambda from SQS
  const eventSourceMapping: TerraformResourceLambdaEventSourceMapping = {
    key: 'resource',
    name,
    type: 'aws_lambda_event_source_mapping',
    properties: {
      event_source_arn: getItemReference(queue, 'arn'),
      function_name: getItemReference(lambda, 'function_name'),
      batch_size: connection.properties?.batchSize || 1,
      enabled: true,
    },
  };

  // Create policy to allow Lambda to receive messages from SQS
  const policyResource: TerraformResourceIamPolicy = {
    key: 'resource',
    name,
    type: 'aws_iam_policy',
    properties: {
      name,
      policy: {
        flagTerraformProperty: true,
        type: 'jsonencode',
        value: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
                'sqs:ChangeMessageVisibility',
              ],
              Resource: getItemReference(queue, 'arn'),
            },
          ],
        },
      },
    },
  };

  // Attach the policy to the Lambda's IAM role
  const policyAttachmentResource: TerraformResourceIamRolePolicyAttachment = {
    key: 'resource',
    name,
    type: 'aws_iam_role_policy_attachment',
    properties: {
      role: getItemReference(lambdaRole, 'name'),
      policy_arn: getItemReference(policyResource, 'arn'),
    },
  };

  return [eventSourceMapping, policyResource, policyAttachmentResource];
}