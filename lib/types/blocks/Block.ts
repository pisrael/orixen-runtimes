export interface Block {
  id: string;
  deployId: string;
  isPrimitive: boolean;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  title: string;
  description?: string;
  icon: string;
  svgContent?: string;
  category: 'trigger' | 'process' | 'end' | 'documentation';
  inputs: BlockConnector[];
  outputs: BlockConnector[];
  properties: BlockProperties;
  customProperties?: BlockProperties;
  appVersion: string;
}

export type BlockProperties = Record<string, any>;

export interface BlockConnector {
  id: string;
  name: string;
  type?: BlockConnectorType;
  x: number;
  y: number;
}

export interface BlockConnectorType {
  [key: string]: {
    isMandatory?: boolean;
    type:
      | 'string'
      | 'number'
      | 'boolean'
      | BlockConnectorType
      | BlockConnectorType[];
  };
}

export interface BlockSchema {
  type: string;
  title: string;
  description?: string;
  icon: string;
  category: 'trigger' | 'process' | 'end' | 'documentation';
  width: number;
  height: number;
  zIndex: number;
  minInputs: number;
  maxInputs: number;
  minOutputs: number;
  maxOutputs: number;
  inputs: BlockConnector[];
  outputs: BlockConnector[];
  properties: BlockPropertyCollection;
}

export interface BlockPropertySchema {
  id: string;
  group: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'code' | 'slider';
  description?: string;
  default?: any;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface BlockPropertyCollection {
  default: BlockPropertySchema[];
  [key: string]: BlockPropertySchema[];
}