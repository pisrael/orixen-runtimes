export interface TerraformItem {
  key: string;
  name?: string;
  type?: string;
  properties?: {
    [key: string]: any | TerraformItemComplexProperty;
    depends_on?: string[];
    tags?: {
      flagTerraformProperty: true,
      type: 'attribution',
      value: {
        [key: string]: string
      }
    }
  };
}

export interface TerraformItemComplexProperty {
  value: object | TerraformItemComplexProperty;
  type: TerraformItemComplexPropertyType;
  key?: string;
  keyType?: string;
  flagTerraformProperty: true;
}

export type TerraformItemComplexPropertyType = 'object' | 'jsonencode' | 'attribution';

export interface TerraformProvisioner {
  type: 'local-exec' | 'remote-exec' | 'null';
  command: string;
}

export interface TerraformMain extends TerraformItem {
  key: 'terraform';
  properties: {
    required_version: string;
    required_providers: {
      type: 'object';
      flagTerraformProperty: true;
      value: {
        [key: string]: {
          key?: string;
          type: 'attribution';
          flagTerraformProperty: true;
          value: {
            source: string;
            version: string;
          };
        };
      };
    }
  }
}

export interface TerraformOutput extends TerraformItem {
  key: 'output';
  name: string;
  properties: {
    value: string;
  } & TerraformItem['properties'];
}
