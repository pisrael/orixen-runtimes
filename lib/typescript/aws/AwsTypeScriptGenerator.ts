import {
  DeployParams,
  DeployProgressReportFunction
} from '../../GeneratorInterface';
import { Project } from '../../types';
import { Block } from '../../types/blocks/Block';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import { TypeScriptGenerator } from '../common/TypeScriptGenerator';
import { generateBlockDeployCode } from './generateBlockDeployCode';
import { genAwsTerraformDeployData } from './terraform';
import { serializeTerraform } from '../../terraform/serializeTerraform';
import { TerraformItem } from '../../terraform/types';

export class AwsTypeScriptGenerator extends TypeScriptGenerator {

  async generateProjectDeploy(params: DeployParams, progressReport?: DeployProgressReportFunction): Promise<void> {

    progressReport && progressReport({
      progress: 25,
      message: 'Generating deploy code...'
    });

    const project: Project = JSON.parse(await this.fs.readFile(
      this.fs.join(params.projectFolder, 'project.json')
    ));

    const functionBlocks = this.filterBlocks(project.blocks);

    for (let i = 0; i < functionBlocks.length; i++) {
      const blockFunction = functionBlocks[i];
      await this.generateBlockCode(blockFunction, params, project);

      // Calculate progress between 25% and 75%
      const blockProgress = 25 + Math.floor((i + 1) / functionBlocks.length * 50);
      progressReport && progressReport({
        progress: blockProgress,
        message: 'Generating deploy code...'
      });
    }

    const terraformData = await genAwsTerraformDeployData(params, project);
    progressReport && progressReport({
      progress: 75,
      message: 'Generating deploy code...'
    });

    await this.writeTerraformFile(params.deployFolder, terraformData);
    progressReport && progressReport({
      progress: 100,
      message: 'Deploy code generated successfully'
    });
  }

  private async generateBlockCode(blockFunction: FunctionBlock, params: DeployParams, project: Project) {
    await this.generateBlockLib(blockFunction, project.blocks, project.connections, params.deployFolder);
    await generateBlockDeployCode({
      fs: this.fs,
      resourcesPath: this.resourcesPath,
      projectPath: params.projectFolder,
      deployPath: params.deployFolder,
      block: blockFunction,
      project
    });
  }

  private filterBlocks(blocks: Block[]): FunctionBlock[] {
    return blocks.filter(
      block => block.type === 'function'
        && (block as FunctionBlock).status !== 'new'
        && block.inputs.length > 0
        && !(block as FunctionBlock).properties.skipDeploy
    ) as FunctionBlock[];
  }

  private async writeTerraformFile(deployFolder: string, terraformItems: TerraformItem[]) {
    const terraformContent = serializeTerraform(terraformItems);
    const filePath = `${deployFolder}/terraform.tf`;
    await this.fs.writeFile(filePath, terraformContent);
  }
}
