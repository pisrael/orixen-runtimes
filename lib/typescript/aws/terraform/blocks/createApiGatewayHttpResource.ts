import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformResourceApiGatewayV2Api,
  TerraformResourceApiGatewayV2Stage
} from '../types';

export function createApiGatewayHttpResource(terraformPrefix: string): {api: TerraformResourceApiGatewayV2Api; stage: TerraformResourceApiGatewayV2Stage;} {
  const prefix = `${terraformPrefix}-http`;
  const apiResource: TerraformResourceApiGatewayV2Api = {
    key: 'resource',
    name: `${prefix}`,
    type: 'aws_apigatewayv2_api',
    properties: {
      name: `${prefix}`,
      protocol_type: 'HTTP',
      cors_configuration: {
        allow_origins: ['*'],
        allow_methods: ['*'],
        allow_headers: ['*'],
        expose_headers: ['*']
      },
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