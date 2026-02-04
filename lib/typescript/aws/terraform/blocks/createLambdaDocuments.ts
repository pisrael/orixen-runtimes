import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformDataAwsCallerIdentity,
  TerraformDataIamPolicyDocument,
  TerraformResourceApiGatewayV2Api,
  TerraformResourceApiGatewayV2Stage
} from '../types';

export function createBasicLambdaDocuments(terraformPrefix: string): TerraformDataIamPolicyDocument {
  const lambdaBasicRoleDocument: TerraformDataIamPolicyDocument = {
    key: 'data',
    name: `${terraformPrefix}-lambda-basic-doc`,
    type: 'aws_iam_policy_document',
    properties: {
      statement: {
        actions: ['sts:AssumeRole'],
        principals: {
          type: 'Service',
          identifiers: ['lambda.amazonaws.com'],
        },
      }
    },
  };
  
  return lambdaBasicRoleDocument;
}

export function createWsManageConnectionsLambdaDocuments(
  wsApi: TerraformResourceApiGatewayV2Api,
  wsStage: TerraformResourceApiGatewayV2Stage,
  region: string,
  callerIdentity: TerraformDataAwsCallerIdentity): TerraformDataIamPolicyDocument {
  const lambdaWsManageConnectionsRoleDocument: TerraformDataIamPolicyDocument = {
    key: 'data',
    name: `${wsApi.name}-manage-connections-doc`,
    type: 'aws_iam_policy_document',
    properties: {
      statement: {
        sid: 'ManageConnections',
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:${region}:\${${getItemReference(callerIdentity, 'account_id', true)}}:\${aws_apigatewayv2_api.${wsApi.name}.id}/\${aws_apigatewayv2_stage.${wsStage.name}.name}/*/@connections/*`
        ]
      }
    },
  };

  return lambdaWsManageConnectionsRoleDocument;
}