import { ApiBlock } from '../../../../types/blocks/ApiBlock';
import { FunctionBlock } from '../../../../types/blocks/FunctionBlock';
import { generateTerraformBlockName } from '../blocks/generateTerraformId';
import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import { sanitizeBlockId } from '../utils/terraformNaming';
import {
  TerraformResource,
  TerraformResourceApiGatewayV2Api,
  TerraformResourceApiGatewayV2Integration,
  TerraformResourceApiGatewayV2Route,
  TerraformResourceLambdaFunction,
  TerraformResourceLambdaPermission
} from '../types';

export interface CreateApiToLambdaConnectionParams {
  terraformPrefix: string;
  lambda: TerraformResourceLambdaFunction;
  api: TerraformResourceApiGatewayV2Api;
  sourceBlock: ApiBlock;
  targetBlock: FunctionBlock;
}
export function createApiToLambdaConnection({terraformPrefix, lambda, api, sourceBlock, targetBlock}: CreateApiToLambdaConnectionParams): TerraformResource[] {
  if (!api) {
    throw new Error('API Gateway is required to create API-to-Lambda connection');
  }

  const sourceId = sanitizeBlockId(sourceBlock.id);
  const baseName = `${terraformPrefix}_api${sourceId}_to_${generateTerraformBlockName(targetBlock)}`;
  const integrationResource: TerraformResourceApiGatewayV2Integration = {
    key: 'resource',
    name: baseName,
    type: 'aws_apigatewayv2_integration',
    properties: {
      api_id: getItemReference(api, 'id'),
      integration_type: 'AWS_PROXY',
      integration_uri: getItemReference(lambda, 'invoke_arn'),
      integration_method: 'POST',
      payload_format_version: '2.0',
    },
  };

  const routeResource: TerraformResourceApiGatewayV2Route = {
    key: 'resource',
    name: `${baseName}-route`,
    type: 'aws_apigatewayv2_route',
    properties: {
      api_id: getItemReference(api, 'id'),
      route_key: `${sourceBlock.properties.method || 'GET'} ${sourceBlock.properties.path}`,
      target: `integrations/\${${getItemReference(integrationResource, 'id', true)}}`,
    },
  };

  const permissionResource: TerraformResourceLambdaPermission = {
    key: 'resource',
    name: `${baseName}-permission`,
    type: 'aws_lambda_permission',
    properties: {
      statement_id: baseName,
      action: 'lambda:InvokeFunction',
      function_name: getItemReference(lambda, 'function_name'),
      principal: 'apigateway.amazonaws.com',
      source_arn: `\${${getItemReference(api, 'execution_arn', true)}}/*/*`,
    },
  };

  return [integrationResource, routeResource, permissionResource]
}