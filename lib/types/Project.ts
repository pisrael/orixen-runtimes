import { Block } from './blocks/Block';
import { Connection } from './connections/Connection';

export interface Project {
  blocks: Block[];
  connections: Connection[];
  project: {
    projectName: string;
    projectId: string;
    includeVpc: boolean;
    vpcId: string;
    includeFixedIp: boolean;
  },
  version: string;
}