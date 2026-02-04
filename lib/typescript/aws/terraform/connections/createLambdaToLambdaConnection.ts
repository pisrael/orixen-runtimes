import { Connection } from '../../../../types/connections/Connection';
import { formatEnvVar } from '../../../../utils/formatEnvVar';
import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformResource,
  TerraformResourceIamPolicy,
  TerraformResourceIamRole,
  TerraformResourceIamRolePolicyAttachment,
  TerraformResourceLambdaFunction
} from '../types';

export function createLambdaToLambdaConnection(
  lambda: TerraformResourceLambdaFunction,
  lambdaRole: TerraformResourceIamRole,
  targetLambda: TerraformResourceLambdaFunction, 
  connection: Connection): TerraformResource[] 
{
  const baseName = `${lambda.name}_to_${targetLambda.name}`;
  const lambdaPolicy: TerraformResourceIamPolicy = {
    key: 'resource',
    name: `${baseName}_policy`,
    type: 'aws_iam_policy',
    properties: {
      name: `${baseName}_policy`,
      policy: {
        flagTerraformProperty: true,
        type: 'jsonencode',
        value:{
          Version: '2012-10-17',
          Statement: [{
            Action: ['lambda:InvokeFunction', 'lambda:InvokeAsync'],
            Effect: 'Allow',
            Resource: `\${aws_lambda_function.${targetLambda.name}.arn}`,
          }]
        }
      }
    }
  }

  const policyAttachment: TerraformResourceIamRolePolicyAttachment = {
    key: 'resource',
    name: `${baseName}_policy_attachment`,
    type: 'aws_iam_role_policy_attachment',
    properties: {
      role: getItemReference(lambdaRole, 'name'),
      policy_arn: getItemReference(lambdaPolicy, 'arn'),
    }
  }

  const lambdaEnvVariables = { [formatEnvVar(connection.fromConnectorId)]: `&aws_lambda_function.${targetLambda.name}.function_name` };
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

  return [lambdaPolicy, policyAttachment]
}