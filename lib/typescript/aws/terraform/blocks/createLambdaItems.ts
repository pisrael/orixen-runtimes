import { FunctionBlock } from '../../../../types/blocks/FunctionBlock';
import {
  getBlockFolderName,
  getBlockPath
} from '../../../../utils';
import { ProjectInfra } from '../createProjectInfra';
import { getItemReference } from '../../../../terraform/serializeTerraform/getItemReference';
import {
  TerraformDataArchiveFile,
  TerraformDataAwsCallerIdentity,
  TerraformDataIamPolicyDocument,
  TerraformItem,
  TerraformResourceEcrRepository,
  TerraformResourceIamRole,
  TerraformResourceIamRolePolicyAttachment,
  TerraformResourceLambdaFunction,
  TerraformResourceNull
} from '../types';
import { generateTerraformFunctionBlockName } from './generateTerraformId';

export interface CreateLambdaItemsParams {
  block: FunctionBlock;
  terraformPrefix: string;
  lambdaBasicRoleDocument: TerraformDataIamPolicyDocument;
  projectInfra: ProjectInfra;
  blockEnvs: Record<string, string>;
  region: string;
}

export async function createLambdaItems({
  block,
  terraformPrefix,
  lambdaBasicRoleDocument,
  projectInfra,
  blockEnvs,
  region
}: CreateLambdaItemsParams) {
  const lambdaPrefix = `${terraformPrefix}-${generateTerraformFunctionBlockName(block)}`;
  const items: TerraformItem[] = [];

  const role: TerraformResourceIamRole = {
    key: 'resource',
    name: `${lambdaPrefix}-role`,
    type: 'aws_iam_role',
    properties: {
      name: `${lambdaPrefix}-role`,
      assume_role_policy: getItemReference(lambdaBasicRoleDocument, 'json'),
    },
  };
  items.push(role);

  const roleExecAttachment: TerraformResourceIamRolePolicyAttachment = {
    key: 'resource',
    name: `${lambdaPrefix}-exec-attachment`,
    type: 'aws_iam_role_policy_attachment',
    properties: {
      role: getItemReference(role, 'name'),
      policy_arn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    },
  }
  items.push(roleExecAttachment);

  const blockFolder = getBlockFolderName(block.title, block.id);
  const lambdaItems = createLambda(
    lambdaPrefix,
    block,
    blockFolder,
    role,
    terraformPrefix,
    blockEnvs,
    projectInfra,
    region,
  );

  if (lambdaItems.ecr) {
    items.push(lambdaItems.ecr);
  }
  if (lambdaItems.build) {
    items.push(lambdaItems.build);
  } 
  if (lambdaItems.archive) {
    items.push(lambdaItems.archive);
  }
  items.push(lambdaItems.lambda);


  let roleVpcAttachment: TerraformResourceIamRolePolicyAttachment | undefined;
  if (projectInfra.vpc && projectInfra.privateSubnetA && projectInfra.privateSubnetB && projectInfra.lambdaSecurityGroup) {
    lambdaItems.lambda.properties.vpc_config = {
      subnet_ids: [getItemReference(projectInfra.privateSubnetA, 'id'), getItemReference(projectInfra.privateSubnetB, 'id')],
      security_group_ids: [getItemReference(projectInfra.lambdaSecurityGroup, 'id')],
    };

    roleVpcAttachment = {
      key: 'resource',
      name: `${lambdaPrefix}-vpc-attachment`,
      type: 'aws_iam_role_policy_attachment',
      properties: {
        role: getItemReference(role, 'name'),
        policy_arn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
    }
    items.push(roleVpcAttachment);
  }

  return {
    items,
    lambda: lambdaItems.lambda,
    role
  };
}

function createLambda(
  lambdaPrefix: string,
  block: FunctionBlock,
  blockFolder: string,
  role: TerraformResourceIamRole,
  terraformPrefix: string,
  envVars: Record<string, string>,
  projectInfra: ProjectInfra,
  region: string,
): {lambda: TerraformResourceLambdaFunction, build: TerraformResourceNull, archive?: TerraformDataArchiveFile, ecr?: TerraformResourceEcrRepository} {
  if (block.properties.lambda?.deployAsDockerImage) {
    if (!projectInfra.awsCallerIdentity) {
      throw new Error('AWS Caller Identity is required for deploying Lambda as Docker Image');
    }
    return createLambdaDockerImage(
      lambdaPrefix,
      block,
      blockFolder,
      role,
      envVars,
      projectInfra.awsCallerIdentity,
      region,
    );
  } else {
    return createLambdaZip(
      lambdaPrefix,
      block,
      blockFolder,
      role,
      terraformPrefix,
      envVars,
    );
  }
}


function createLambdaZip(
  lambdaPrefix: string,
  block: FunctionBlock,
  blockFolder: string,
  role: TerraformResourceIamRole,
  terraformPrefix: string,
  envVars: Record<string, string>,
): {lambda: TerraformResourceLambdaFunction, build: TerraformResourceNull, archive: TerraformDataArchiveFile} {
  const build: TerraformResourceNull = {
    key: 'resource',
    name: `${lambdaPrefix}-build`,
    type: 'null_resource',
    properties: {
      triggers: {
        flagTerraformProperty: true,
        type: 'attribution',
        value: { 
          always_run: '&timestamp()'
        }
      },
      provisioner: {
        keyType: 'local-exec',
        type: 'object',
        flagTerraformProperty: true,
        value: {
          command: `npm i && npm run build`,
          working_dir: `\${path.module}/blocks/${blockFolder}`
        }
      }
    },
  };

  const archive: TerraformDataArchiveFile = {
    key: 'data',
    name: `${lambdaPrefix}-archive`,
    type: 'archive_file',
    properties: {
      type: 'zip',
      source_dir: `\${path.module}/blocks/${blockFolder}/dist`,
      output_path: `\${path.module}/${terraformPrefix}_${block.id.replace(/-/g, '_')}.zip`,
      depends_on: [getItemReference(build)],
    },
  };

  const lambda: TerraformResourceLambdaFunction = {
    key: 'resource',
    name: lambdaPrefix,
    type: 'aws_lambda_function',
    properties: {
      function_name: lambdaPrefix,
      handler: '_lib/handler.handlerFunction',
      runtime: block.properties.lambda?.lambdaRuntime || 'nodejs22.x',
      timeout: block.properties.lambda?.lambdaTimeout || 60,
      role: getItemReference(role, 'arn'),
      memory_size: block.properties.lambda?.lambdaMemory || 1024,
      filename: archive.properties.output_path,
      source_code_hash: getItemReference(archive, 'output_base64sha256'),
      environment: {
        variables: {
          flagTerraformProperty: true,
          type: 'attribution',
          value: envVars,
        },
      },
      depends_on: [getItemReference(archive)],
    },
  };

  return {lambda, build, archive};
}

function createLambdaDockerImage(
  lambdaPrefix: string,
  block: FunctionBlock,
  blockFolder: string,
  role: TerraformResourceIamRole,
  envVars: Record<string, string>,
  awsCallerIdentity: TerraformDataAwsCallerIdentity,
  region: string,
): {lambda: TerraformResourceLambdaFunction, build: TerraformResourceNull, ecr: TerraformResourceEcrRepository} {

  const ecr: TerraformResourceEcrRepository = {
    key: 'resource',
    name: `${lambdaPrefix}-ecr`,
    type: 'aws_ecr_repository',
    properties: {
      name: `${lambdaPrefix}-ecr`,
      image_tag_mutability: 'MUTABLE',
      force_delete: true,
    },
  };


  const build: TerraformResourceNull = {
    key: 'resource',
    name: `${lambdaPrefix}-build`,
    type: 'null_resource',
    properties: {
      triggers: {
        flagTerraformProperty: true,
        type: 'attribution',
        value: { 
          always_run: '&timestamp()'
        }
      },
      provisioner: {
        keyType: 'local-exec',
        type: 'object',
        flagTerraformProperty: true,
        value: {
          command: `&<<-EOT
      npm i && npm run build
      docker build --platform linux/amd64 --no-cache --provenance=false -t \${${getItemReference(ecr, 'repository_url', true)}}:latest .
      aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin \${${getItemReference(awsCallerIdentity, 'account_id', true)}}.dkr.ecr.${region}.amazonaws.com
      docker push \${${getItemReference(ecr, 'repository_url', true)}}:latest
      EOT`,
          working_dir: `\${path.module}/blocks/${blockFolder}`
        }
      },
      depends_on: [getItemReference(ecr)],
    },
  };

  const lambda: TerraformResourceLambdaFunction = {
    key: 'resource',
    name: lambdaPrefix,
    type: 'aws_lambda_function',
    properties: {
      function_name: lambdaPrefix,
      package_type: 'Image',
      image_uri: `\${${getItemReference(ecr, 'repository_url', true)}}:latest`,
      image_config: {
        command: {
          flagTerraformProperty: true,
          type: 'attribution',
          value:['_lib/handler.handlerFunction']
        }
      },
      timeout: block.properties.lambda?.lambdaTimeout || 60,
      role: getItemReference(role, 'arn'),
      memory_size: block.properties.lambda?.lambdaMemory || 1024,
      environment: {
        variables: {
          flagTerraformProperty: true,
          type: 'attribution',
          value: envVars,
        },
      },
      depends_on: [getItemReference(build)],
    },
  };

  return {lambda, build, ecr};
}