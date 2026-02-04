import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformResourceApiGatewayV2Api,
  TerraformResourceApiGatewayV2Stage
} from '../types';

export function createApiGatewayWsResource(terraformPrefix: string): {api: TerraformResourceApiGatewayV2Api; stage: TerraformResourceApiGatewayV2Stage;} {
  const prefix = `${terraformPrefix}-ws`;
  const apiResource: TerraformResourceApiGatewayV2Api = {
    key: 'resource',
    name: `${prefix}`,
    type: 'aws_apigatewayv2_api',
    properties: {
      name: `${prefix}`,
      protocol_type: 'WEBSOCKET',
      route_selection_expression: "$request.body.action"
    },
  };

  const stageResource: TerraformResourceApiGatewayV2Stage = {
    key: 'resource',
    name: `${prefix}-stage`,
    type: 'aws_apigatewayv2_stage',
    properties: {
      api_id: getItemReference(apiResource, 'id'),
      name: 'prod',
      auto_deploy: true,
    },
  };

  return { api: apiResource, stage: stageResource };
}