import { FileSystem } from '../../../filesystem';
import {
  DeployParams,
  DeployProgressReportFunction,
  GeneratorContext,
  GeneratorInterface
} from '../../GeneratorInterface';
import { Block } from '../../types/blocks/Block';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import { Connection } from '../../types/connections/Connection';
import { getBlockCodeParams } from '../../utils/getBlockCodeParams';
import { isFunctionBlock } from '../../utils/isFunctionBlock';
import {
  generateBlockLibFiles,
  generateConnectorCode,
  generateDevelopmentLibFiles,
  generateIndexTs
} from './';
import { copyBlockBoilerplate } from './copyBoilerplate';
import { generatePackageJson } from './generatePackageJson';

export class TypeScriptGenerator implements GeneratorInterface {
  protected fs!: FileSystem;
  protected resourcesPath!: string;

  initialize(context: GeneratorContext): void {
    this.fs = context.fs;
    this.resourcesPath = context.resourcesPath;
  }

  async generateNewBlockCodeForDevelopment(block: FunctionBlock, targetRootFolder: string): Promise<void> {
    await this.generateIndexFile(block, targetRootFolder);
    await this.generateInputConnectors(block, targetRootFolder);
    await this.generateOutputConnectors(block, targetRootFolder);
    await this.copyBlockBoilerplate(block, targetRootFolder);
    await this.generateBlockLib(block as any, [block as any], [], targetRootFolder);
    await this.generateCliLib(targetRootFolder, block);
  }

  private async generateCliLib(targetRootFolder: string, block: FunctionBlock) {
    await generateDevelopmentLibFiles({
      fs: this.fs,
      resourcesPath: this.resourcesPath,
      projectPath: targetRootFolder,
      block: block as any
    });
  }

  private async generateIndexFile(block: FunctionBlock, targetRootFolder: string): Promise<void> {
    await generateIndexTs({
      fs: this.fs,
      resourcesPath: this.resourcesPath,
      projectPath: targetRootFolder,
      block,
    });
  }

  private async generateInputConnectors(block: FunctionBlock, targetRootFolder: string): Promise<void> {
    for (const input of block.inputs) {
      await generateConnectorCode({
        fs: this.fs,
        resourcesPath: this.resourcesPath,
        projectPath: targetRootFolder,
        block,
        connector: input,
        connectorType: 'inputs',
      });
    }
  }

  private async generateOutputConnectors(block: FunctionBlock, targetRootFolder: string): Promise<void> {
    for (const output of block.outputs) {
      await generateConnectorCode({
        fs: this.fs,
        resourcesPath: this.resourcesPath,
        projectPath: targetRootFolder,
        block,
        connector: output,
        connectorType: 'outputs',
      });
    }
  }

  private async copyBlockBoilerplate(block: FunctionBlock, targetRootFolder: string): Promise<void> {
    await copyBlockBoilerplate({
      fs: this.fs,
      resourcesPath: this.resourcesPath,
      projectPath: targetRootFolder,
      block,
    });

    await generatePackageJson({
      fs: this.fs,
      resourcesPath: this.resourcesPath,
      projectPath: targetRootFolder,
      block,
    });
  }


  async generateBlockLib(block: FunctionBlock, blocks: Block[], connections: Connection[], targetRootFolder: string): Promise<void> {
    const params = getBlockCodeParams(block, connections, blocks);
    await generateBlockLibFiles({
      fs: this.fs,
      resourcesPath: this.resourcesPath,
      projectPath: targetRootFolder,
      block: params.block,
      inputBlocks: params.inputBlocks,
      outputBlocks: params.outputBlocks,
      inputConnections: params.inputConnections,
      outputConnections: params.outputConnections,
    });
  }

  async generateAllBlocksLib(blocks: Block[], connections: Connection[], targetRootFolder: string): Promise<void> {
    for (const block of blocks) {
      if (isFunctionBlock(block) && block.status !== 'new') {
        await this.generateBlockLib(block, blocks, connections, targetRootFolder);
      }
    }
  }

  async generateProjectDeploy(params: DeployParams, progressReport?: DeployProgressReportFunction): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
