import {
  Block,
  BlockSchema
} from './Block';
import { FunctionBlockLambdaProperties } from './FunctionBlockLambda';

export interface FunctionBlock extends Block {
  type: 'function';
  publicId: string;
  status: FunctionBlockStatus;
  properties: {
    language: FunctionLanguage;
    languageVersion: string;
    skipDeploy?: boolean;
    dependsOn?: string[];
    ec2?: any;
    fargate?: any;
    lambda?: FunctionBlockLambdaProperties;
  };
  publishData?: FunctionBlockPublishData;
}

export type FunctionBlockStatus = 'new' | 'unpublished' | 'published' | null;

export type FunctionLanguage = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'rust'
  | 'scala'
  | 'dart'
  | 'elixir'
  | 'haskell'
  | 'perl'
  | 'shell';

export interface FunctionBlockPublishData {
  codeUrl: string;
  versionMajor: string;
  versionMinor: string;
  versionPatch: string;
  publishedDescription: string;
  visibility: FunctionBlockPublishVisibility;
  author: {
    id: string;
    name: string;
    organizationId: string;
    organizationName: string;
    teamId: string;
    teamName: string;
  }
  aclEdit?: {
    entityType: 'user' | 'team' | 'organization' | 'project';
    entityId: string;
  }
}

export type FunctionBlockPublishVisibility = 
  | 'public'
  | 'project'
  | 'organization'
  | 'user'
  | 'team';

export interface FunctionBlockSchema extends BlockSchema {
  type: 'function';
  status: FunctionBlockStatus;
}