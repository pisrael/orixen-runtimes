import {
  describe,
  expect,
  it
} from 'vitest';

import { serializeTerraform } from '../../../../../lib/terraform/serializeTerraform/index';
import { TerraformItem } from '../../../../../lib/terraform/types';

describe('serializeTerraform', () => {
  it('serializes a resource block', () => {
    const item: TerraformItem = {
      key: 'resource',
      type: 'aws_lambda_function',
      name: 'my_lambda',
      properties: {
        function_name: 'my-lambda',
        runtime: 'nodejs22.x',
      },
    };

    const result = serializeTerraform([item]);
    expect(result).toContain('resource "aws_lambda_function" "my_lambda"');
    expect(result).toContain('function_name');
    expect(result).toContain('"my-lambda"');
    expect(result).toContain('"nodejs22.x"');

    // Validates: resource "aws_lambda_function" "my_lambda" {
    //              function_name = "my-lambda"
    //              runtime = "nodejs22.x"
    //            }
    const resourceBlockRegex = /resource\s+"aws_lambda_function"\s+"my_lambda"\s*\{\s*function_name\s*=\s*"my-lambda"\s*runtime\s*=\s*"nodejs22\.x"\s*\}/;
    expect(result).toMatch(resourceBlockRegex);
  });

  it('serializes a data block', () => {
    const item: TerraformItem = {
      key: 'data',
      type: 'aws_iam_policy_document',
      name: 'assume_role',
      properties: {
        statement: {
          flagTerraformProperty: true as const,
          type: 'object' as const,
          value: {
            actions: ['sts:AssumeRole'],
          },
        },
      },
    };

    const result = serializeTerraform([item]);
    expect(result).toContain('data "aws_iam_policy_document" "assume_role"');
    expect(result).toContain('statement');

    // Validates: data "aws_iam_policy_document" "assume_role" {
    //              statement {
    //                actions = ["sts:AssumeRole"]
    //              }
    //            }
    const dataBlockRegex = /data\s+"aws_iam_policy_document"\s+"assume_role"\s*\{\s*statement\s+\{\s*actions\s*=\s*\["sts:AssumeRole"\]\s*\}\s*\}/;
    expect(result).toMatch(dataBlockRegex);
  });

  it('serializes a provider block', () => {
    const item: TerraformItem = {
      key: 'provider',
      type: 'aws',
      properties: {
        region: 'us-east-2',
      },
    };

    const result = serializeTerraform([item]);
    expect(result).toContain('provider "aws"');
    expect(result).toContain('"us-east-2"');

    // Validates: provider "aws" {
    //              region = "us-east-2"
    //            }
    const providerBlockRegex = /provider\s+"aws"\s*\{\s*region\s*=\s*"us-east-2"\s*\}/;
    expect(result).toMatch(providerBlockRegex);
  });

  it('serializes an output block', () => {
    const item: TerraformItem = {
      key: 'output',
      name: 'api_url',
      properties: {
        value: '&aws_apigatewayv2_api.api.api_endpoint',
      },
    };

    const result = serializeTerraform([item]);
    expect(result).toContain('output "api_url"');
    expect(result).toContain('aws_apigatewayv2_api.api.api_endpoint');

    // Validates: output "api_url" {
    //              value = aws_apigatewayv2_api.api.api_endpoint
    //            }
    const outputBlockRegex = /output\s+"api_url"\s*\{\s*value\s*=\s*aws_apigatewayv2_api\.api\.api_endpoint\s*\}/;
    expect(result).toMatch(outputBlockRegex);
  });

  it('serializes nested blocks like environment variables', () => {
    const item: TerraformItem = {
      key: 'resource',
      type: 'aws_lambda_function',
      name: 'fn',
      properties: {
        function_name: 'fn',
        environment: {
          flagTerraformProperty: true as const,
          type: 'object' as const,
          value: {
            variables: {
              flagTerraformProperty: true as const,
              type: 'attribution' as const,
              value: {
                MY_VAR: 'hello',
              },
            },
          },
        },
      },
    };

    const result = serializeTerraform([item]);
    expect(result).toContain('environment');
    expect(result).toContain('variables');
    expect(result).toContain('MY_VAR');
    expect(result).toContain('"hello"');

    // Validates: resource "aws_lambda_function" "fn" {
    //              function_name = "fn"
    //              environment {
    //                variables = {
    //                  MY_VAR = "hello"
    //                }
    //              }
    //            }
    const nestedBlockRegex = /resource\s+"aws_lambda_function"\s+"fn"\s*\{\s*function_name\s*=\s*"fn"\s*environment\s+\{\s*variables\s*=\s*\{\s*MY_VAR\s*=\s*"hello"\s*\}\s*\}\s*\}/;
    expect(result).toMatch(nestedBlockRegex);
  });

  it('joins multiple items with double newlines', () => {
    const items: TerraformItem[] = [
      { key: 'provider', type: 'aws', properties: { region: 'us-east-1' } },
      { key: 'resource', type: 'aws_sqs_queue', name: 'q', properties: { name: 'my-queue' } },
    ];

    const result = serializeTerraform(items);
    const parts = result.split('\n\n');
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });

  it('serializes provisioner blocks with quoted keyType', () => {
    const item: TerraformItem = {
      key: 'resource',
      type: 'null_resource',
      name: 'build',
      properties: {
        provisioner: {
          flagTerraformProperty: true as const,
          type: 'object' as const,
          keyType: 'local-exec',
          value: {
            command: 'npm run build',
            working_dir: '${path.module}/blocks/my_function',
          },
        },
      },
    };

    const result = serializeTerraform([item]);
    expect(result).toContain('provisioner "local-exec"');
    expect(result).not.toContain('keyType');
    expect(result).toContain('command = "npm run build"');
  });
});
