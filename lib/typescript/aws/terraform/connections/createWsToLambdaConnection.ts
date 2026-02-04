import { FunctionBlock } from '../../../../types/blocks/FunctionBlock';
import { generateTerraformBlockName } from '../blocks/generateTerraformId';
import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformItem,
  TerraformResourceApiGatewayV2Api,
  TerraformResourceApiGatewayV2Integration,
  TerraformResourceApiGatewayV2Route,
  TerraformResourceApiGatewayV2Stage,
  TerraformResourceIamPolicy,
  TerraformResourceIamRole,
  TerraformResourceIamRolePolicyAttachment,
  TerraformResourceLambdaFunction,
  TerraformResourceLambdaPermission
} from '../types';

export interface CreateWsToLambdaConnectionParams {
  lambda: TerraformResourceLambdaFunction;
  wsGateway?: TerraformResourceApiGatewayV2Api;
  wsStage?: TerraformResourceApiGatewayV2Stage;
  targetBlock: FunctionBlock;
  terraformPrefix: string;
}

export function createWsToLambdaConnection({
  lambda, 
  wsGateway, 
  wsStage, 
  targetBlock, 
  terraformPrefix}: CreateWsToLambdaConnectionParams): TerraformItem[] {
  if (!wsGateway || !wsStage) {
    throw new Error('WebSocket Gateway and Stage are required to create WS-to-Lambda connection');
  }

  const items: TerraformItem[] = [];
  
  const baseName = `${terraformPrefix}_ws_gateway_to_${generateTerraformBlockName(targetBlock)}`;
  const integrationResource: TerraformResourceApiGatewayV2Integration = {
    key: 'resource',
    name: baseName,
    type: 'aws_apigatewayv2_integration',
    properties: {
      api_id: getItemReference(wsGateway, 'id'),
      integration_type: 'AWS_PROXY',
      integration_uri: getItemReference(lambda, 'invoke_arn'),
    },
  };
  items.push(integrationResource);

  const connectRouteResource: TerraformResourceApiGatewayV2Route = {
    key: 'resource',
    name: `${baseName}-connect`,
    type: 'aws_apigatewayv2_route',
    properties: {
      api_id: getItemReference(wsGateway, 'id'),
      route_key: '$connect',
      target: `integrations/\${${getItemReference(integrationResource, 'id', true)}}`,
    },
  };
  items.push(connectRouteResource);

  const disconnectRouteResource: TerraformResourceApiGatewayV2Route = {
    key: 'resource',
    name: `${baseName}-disconnect`,
    type: 'aws_apigatewayv2_route',
    properties: {
      api_id: getItemReference(wsGateway, 'id'),
      route_key: '$disconnect',
      target: `integrations/\${${getItemReference(integrationResource, 'id', true)}}`,
    },
  };
  items.push(disconnectRouteResource);

  const defaultRouteResource: TerraformResourceApiGatewayV2Route = {
    key: 'resource',
    name: `${baseName}-default`,
    type: 'aws_apigatewayv2_route',
    properties: {
      api_id: getItemReference(wsGateway, 'id'),
      route_key: '$default',
      target: `integrations/\${${getItemReference(integrationResource, 'id', true)}}`,
    },
  };
  items.push(defaultRouteResource);

  const permissionResource: TerraformResourceLambdaPermission = {
    key: 'resource',
    name: `${baseName}-permission`,
    type: 'aws_lambda_permission',
    properties: {
      statement_id: baseName,
      action: 'lambda:InvokeFunction',
      function_name: getItemReference(lambda, 'function_name'),
      principal: 'apigateway.amazonaws.com',
      source_arn: `\${${getItemReference(wsGateway, 'execution_arn', true)}}/*/*`,
    },
  };
  items.push(permissionResource);

  return items;
}

export function createAllowLambdaToRespondToWs(
  lambda: TerraformResourceLambdaFunction,
  lambdaRole: TerraformResourceIamRole,
  lambdaWsRolePolicy?: TerraformResourceIamPolicy,
): TerraformItem[] {
  if (!lambdaWsRolePolicy) {
    throw new Error('LambdaWsRolePolicy is required to allow Lambda to respond to WebSocket');
  }

  const lambdaWsRoleAttachment: TerraformResourceIamRolePolicyAttachment = {
    key: 'resource',
    name: `${lambda.name}-ws-role`,
    type: 'aws_iam_role_policy_attachment',
    properties: {
      role: getItemReference(lambdaRole, 'name'),
      policy_arn: getItemReference(lambdaWsRolePolicy, 'arn'),
    },
  }
  return [lambdaWsRoleAttachment];
}