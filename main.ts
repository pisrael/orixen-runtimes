import * as path from 'path';

import { NodeFileSystem } from './filesystem';
import {
  AwsTypeScriptGenerator,
  GeneratorContext,
  GeneratorInterface,
  loadProjectEnv,
  Project
} from './lib';

type Runtime = 'local' | 'aws';
type Command = 'generate-lib' | 'generate-block' | 'deploy';

function createGenerator(runtime: Runtime): GeneratorInterface {
  switch (runtime) {
    case 'aws':
      return new AwsTypeScriptGenerator();
    default:
      throw new Error(`Unknown runtime: ${runtime}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const projectPathArg = args[0] || process.cwd();
  const runtime = (args[1] as Runtime) || 'local';
  const command = (args[2] as Command) || 'generate-lib';

  const projectPath = path.resolve(projectPathArg);
  const resourcesPath = path.resolve(__dirname, 'resources');

  console.log(`Project path: ${projectPath}`);
  console.log(`Runtime: ${runtime}`);
  console.log(`Command: ${command}`);

  const fs = new NodeFileSystem(projectPath);

  const context: GeneratorContext = {
    fs,
    resourcesPath,
  };

  const generator = createGenerator(runtime);
  generator.initialize(context);

  const projectJsonContent = await fs.readFile('project.json');
  const project: Project = JSON.parse(projectJsonContent);

  console.log(`Project: ${project.project.projectName}`);
  console.log(`Blocks: ${project.blocks.length}`);
  console.log(`Connections: ${project.connections.length}`);

  switch (command) {
    case 'generate-lib':
      console.log('Generating lib code for all blocks...');
      await generator.generateAllBlocksLib(project.blocks, project.connections, '');
      console.log('Done!');
      break;

    case 'deploy':
      if (generator.generateProjectDeploy) {
        console.log('Generating deploy code...');
        await generator.generateProjectDeploy({
          projectFolder: '',
          projectName: project.project.projectName,
          projectId: project.project.projectId,
          blocks: project.blocks,
          connections: project.connections,
          includeVpc: project.project.includeVpc,
          includeFixedIp: project.project.includeFixedIp,
          region: process.env.AWS_REGION || 'us-east-1',
          deployFolder: path.join(projectPath, 'deploy', runtime),
          envs: await loadProjectEnv(fs, project.project.projectId)
        }, (message) => {
          console.log(`[${(message.progress * 100).toFixed(2)}%] ${message.message}`);
        });
        console.log('Done!');
      } else {
        console.error('This runtime does not support deploy generation');
      }
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
