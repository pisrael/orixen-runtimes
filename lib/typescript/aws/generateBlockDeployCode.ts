import * as Handlebars from 'handlebars';

import { FileSystem } from '../../../filesystem';
import { Project } from '../../types';
import { FunctionBlock } from '../../types/blocks/FunctionBlock';
import { getBlockPath } from '../../utils';

interface GenerateBlockDeployCodeParams {
  fs: FileSystem;
  projectPath: string;
  resourcesPath: string;
  deployPath: string;
  block: FunctionBlock;
  project: Project;
}

export async function generateBlockDeployCode({
  fs,
  projectPath,
  deployPath,
  project,
  resourcesPath,
  block,
}: GenerateBlockDeployCodeParams): Promise<void> {
  const blockSourcePath = getBlockPath(projectPath, block);
  const blockDeployPath = getBlockPath(deployPath, block);

  await copyBlockToDeployFolder(fs, blockSourcePath, blockDeployPath);
  await copyAwsRuntimeFiles(fs, resourcesPath, blockDeployPath);
  await updatePackageJson(fs, resourcesPath, blockSourcePath, blockDeployPath);

  if (block.properties.lambda?.deployAsDockerImage) {
    await generateDockerfile(fs, blockSourcePath, blockDeployPath, block);
  }
}

async function copyBlockToDeployFolder(
  fs: FileSystem,
  sourcePath: string,
  destPath: string
): Promise<void> {
  await fs.copy(sourcePath, destPath, {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cli.ts',
      '**/env.ts',
      '**/package-lock.json',
      '**/.orixen/**',
      '**/samples/**',
    ],
  });
}

async function copyAwsRuntimeFiles(
  fs: FileSystem,
  resourcesPath: string,
  blockDeployPath: string
): Promise<void> {
  const awsLambdaPath = fs.join(resourcesPath, 'aws', 'lambda');
  const libPath = fs.join(blockDeployPath, '_lib');

  const files = await fs.list(awsLambdaPath, { onlyFiles: true });

  for (const file of files) {
    if (file.name !== 'ts_package_changes.json') {
      const sourcePath = fs.join(awsLambdaPath, file.name);
      const destPath = fs.join(libPath, file.name);
      await fs.copy(sourcePath, destPath);
    }
  }
}

async function updatePackageJson(
  fs: FileSystem,
  resourcesPath: string,
  blockSourcePath: string,
  blockDeployPath: string
): Promise<void> {
  const devPackageJsonPath = fs.join(blockSourcePath, 'package.json');
  const devPackageJson = JSON.parse(await fs.readFile(devPackageJsonPath));

  const awsChangesPath = fs.join(resourcesPath, 'aws', 'lambda', 'ts_package_changes.json');
  const awsChanges = JSON.parse(await fs.readFile(awsChangesPath));

  devPackageJson.dependencies = { ...awsChanges.dependencies, ...devPackageJson.dependencies };
  devPackageJson.devDependencies = awsChanges.devDependencies;
  devPackageJson.scripts = awsChanges.scripts;

  const deployPackageJsonPath = fs.join(blockDeployPath, 'package.json');
  await fs.writeFile(deployPackageJsonPath, JSON.stringify(devPackageJson, null, 2));
}

async function generateDockerfile(
  fs: FileSystem,
  blockSourcePath: string,
  blockDeployPath: string,
  block: FunctionBlock
): Promise<void> {
  const templatePath = fs.join(blockSourcePath, 'Dockerfile.hbs');
  const templateContent = await fs.readFile(templatePath);

  const baseImage = getDockerBaseImage(block);
  const buildSteps = getDockerBuildSteps();

  const template = Handlebars.compile(templateContent);
  const dockerfileContent = template({ baseImage, buildSteps });

  await fs.writeFile(fs.join(blockDeployPath, 'Dockerfile'), dockerfileContent);
}

function getDockerBaseImage(block: FunctionBlock): string {
  const runtime = block.properties.lambda?.lambdaRuntime || 'nodejs22.x';
  const baseImages: Record<string, string> = {
    'nodejs22.x': 'public.ecr.aws/lambda/nodejs:22',
    'nodejs20.x': 'public.ecr.aws/lambda/nodejs:20',
    'nodejs18.x': 'public.ecr.aws/lambda/nodejs:18',
  };
  return baseImages[runtime] || baseImages['nodejs22.x'];
}

function getDockerBuildSteps(): string {
  return `
COPY dist/ ./
RUN rm -rf node_modules
COPY package*.json ./
RUN npm install --production
`;
}
