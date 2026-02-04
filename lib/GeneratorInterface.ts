import { FileSystem } from '../filesystem';
import { Block } from './types/blocks/Block';
import {
  FunctionBlock,
  FunctionLanguage
} from './types/blocks/FunctionBlock';
import { Connection } from './types/connections/Connection';

export interface GeneratorInterface {
  initialize(context: GeneratorContext): void;

  generateNewBlockCodeForDevelopment(block: FunctionBlock, targetRootFolder: string): Promise<void>;

  generateBlockLib(block: FunctionBlock, blocks: Block[], connections: Connection[], targetRootFolder: string): Promise<void>;

  generateAllBlocksLib(blocks: Block[], connections: Connection[], targetRootFolder: string): Promise<void>;

  generateProjectDeploy(params: DeployParams, progressReport?: DeployProgressReportFunction): Promise<void>;
}

export type DeployProgressReportFunction = (message: DeployProgressMessage) => void;
export interface DeployProgressMessage {
  progress: number;
  message: string;
}

export interface GeneratorContext {
  fs: FileSystem;
  resourcesPath: string;
}

export interface DeployParams {
  projectFolder: string;
  deployFolder: string;
  region: string;
  envs: Record<string, string>;
}