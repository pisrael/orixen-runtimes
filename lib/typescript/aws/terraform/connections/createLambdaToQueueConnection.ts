import { Connection } from '../../../../types/connections/Connection';
import { formatEnvVar } from '../../../../utils/formatEnvVar';
import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformResource,
  TerraformResourceIamPolicy,
  TerraformResourceIamRole,
  TerraformResourceIamRolePolicyAttachment,
  TerraformResourceLambdaFunction,
  TerraformResourceSqsQueue
} from '../types';

export function createLambdaToQueueConnection(
  connection: Connection, 
  lambda: TerraformResourceLambdaFunction, 
  lambdaRole: TerraformResourceIamRole,
  queue: TerraformResourceSqsQueue): TerraformResource[] {
  const name = `${lambda.name}_to_${queue.name}`;

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
                'sqs:SendMessage',
                'sqs:GetQueueUrl',
                'sqs:GetQueueAttributes',
              ],
              Resource: getItemReference(queue, 'arn'),
            },
          ],
        }
      },
    },
  };

  const policyAttachmentResource: TerraformResourceIamRolePolicyAttachment = {
    key: 'resource',
    name,
    type: 'aws_iam_role_policy_attachment',
    properties: {
      role: getItemReference(lambdaRole, 'name'),
      policy_arn: getItemReference(policyResource, 'arn'),
    },
  };

  const lambdaEnvVariables = { [formatEnvVar(connection.fromConnectorId)]: getItemReference(queue, 'id') };
  lambda.properties.environment = {
    variables: {
      flagTerraformProperty: true,
      type: 'attribution',
      value: {
       ...(lambda.properties.environment?.variables.value || {}),
       ...lambdaEnvVariables,
      }
    },
  };

  return [policyResource, policyAttachmentResource];
}