import { TerraformSetup } from './types';

export function createAwsSetup(region: string, project: string): TerraformSetup {
  return {
    terraform: {
      key: 'terraform',
      properties: {
        required_version: '>= 1.6.0',
        required_providers: {
          type: 'object',
          flagTerraformProperty: true,
          value: {
            aws: {
              type: 'attribution',
              flagTerraformProperty: true,
              value: {
                source: 'hashicorp/aws',
                version: '~> 5.0',
              },
            },
            archive: {
              type: 'attribution',
              flagTerraformProperty: true,
              value: {
                source: 'hashicorp/archive',
                version: '~> 2.4.0',
              },
            }
          }
        }
      },
    },
    providers: [
      {
        key: 'provider',
        type: 'aws',
        properties: {
          region,
          default_tags: {
            tags: {
              flagTerraformProperty: true,
              type: 'attribution',
              value: {
                Project: project,
                ManagedBy: "Orixen"
              }
            }
          }
        },
      },
    ]
  };
}