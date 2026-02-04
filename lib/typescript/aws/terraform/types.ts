import { LambdaRuntime } from '../../../types/blocks/FunctionBlockLambda';

export {
  TerraformItem,
  TerraformItemComplexProperty,
  TerraformItemComplexPropertyType,
  TerraformMain,
  TerraformOutput,
  TerraformProvisioner,
} from '../../../terraform/types';

import type { TerraformItem } from '../../../terraform/types';

export interface TerraformSetup {
  terraform: import('../../../terraform/types').TerraformMain;
  providers: TerraformProvider[];
}

export interface TerraformProvider extends TerraformItem {
  key: 'provider';
  type: 'aws';
  alias?: string; // If using multiple providers of the same type
  properties: {
    region: string;
    default_tags?: {
      tags: {
        flagTerraformProperty: true,
        type: 'attribution',
        value: {
          [key: string]: string
        }
      }
    }
  };
}


export interface TerraformData extends TerraformItem {
  key: 'data';
  type: TerraformDataTypes;
}


export type TerraformDataTypes =
  | 'archive_file'
  | 'aws_ami'
  | 'aws_availability_zones'
  | 'aws_caller_identity'
  | 'aws_iam_policy_document';

type TerraformResourceType =
  | 'aws_apigatewayv2_api'
  | 'aws_apigatewayv2_integration'
  | 'aws_apigatewayv2_route'
  | 'aws_apigatewayv2_stage'
  | 'aws_autoscaling_group'
  | 'aws_cloudwatch_event_rule'
  | 'aws_cloudwatch_event_target'
  | 'aws_cloudwatch_log_group'
  | 'aws_cloudwatch_log_stream'
  | 'aws_ecr_lifecycle_policy'
  | 'aws_ecr_repository'
  | 'aws_ecs_capacity_provider'
  | 'aws_ecs_cluster_capacity_providers'
  | 'aws_ecs_cluster'
  | 'aws_ecs_service'
  | 'aws_ecs_task_definition'
  | 'aws_ecs_task_set'
  | 'aws_eip'
  | 'aws_eip_association'
  | 'aws_iam_instance_profile'
  | 'aws_iam_policy'
  | 'aws_iam_role_policy_attachment'
  | 'aws_iam_role_policy_attachment'
  | 'aws_iam_role_policy'
  | 'aws_iam_role'
  | 'aws_instance'
  | 'aws_internet_gateway'
  | 'aws_lambda_event_source_mapping'
  | 'aws_lambda_function'
  | 'aws_lambda_permission'
  | 'aws_launch_template'
  | 'aws_lb_listener'
  | 'aws_lb_target_group'
  | 'aws_lb'
  | 'aws_pipes_pipe'
  | 'aws_route'
  | 'aws_route_table'
  | 'aws_route_table_association'
  | 'aws_security_group'
  | 'aws_sqs_queue'
  | 'aws_subnet'
  | 'aws_vpc'
  | 'null_resource';

export interface TerraformDataArchiveFile extends TerraformData {
  type: 'archive_file';
  properties: {
    type: 'zip';
    source_dir: string;
    output_path: string;
  } & TerraformItem['properties'];
}

export interface TerraformDataAmi extends TerraformData {
  type: 'aws_ami';
  properties: {
    owners: string[];
    most_recent: boolean;
  } | {
    [key: string]: {
      key: 'filter';
      flagTerraformProperty: true;
      value: {
        name: string;
        values: string[];
      };
      type: 'object';
    };
  };
}

export interface TerraformDataIamPolicyDocument extends TerraformData {
  type: 'aws_iam_policy_document';
  properties: {
    statement: {
        sid?: string;
        actions: string[];
        principals?: {
          type: string;
          identifiers: string[];
        }
        resources?: string[];
    }
  };
}

export interface TerraformDataAwsCallerIdentity extends TerraformData {
  type: 'aws_caller_identity';
  name: 'current';
  properties: {};
}

export interface TerraformDataAwsAvailabilityZones extends TerraformData {
  type: 'aws_availability_zones';
  name: 'available';
  properties: {
    state: 'available';
  };
}


export interface TerraformResource extends TerraformItem {
  key: 'resource';
  type: TerraformResourceType;
  tags?: { [key: string]: string };
}

export interface TerraformResourceApiGatewayV2Api extends TerraformResource {
  type: 'aws_apigatewayv2_api';
  properties: {
    name: string;
    protocol_type: 'HTTP' | 'WEBSOCKET';
    description?: string;
    route_selection_expression?: string;
    cors_configuration?: {
      // CORS settings
      allow_origins?: string[];
      allow_methods?: string[];
      allow_headers?: string[];
      expose_headers?: string[];
      max_age?: number;
      allow_credentials?: boolean;
    };
  } & TerraformItem['properties'];
}

export interface TerraformResourceApiGatewayV2Integration extends TerraformResource {
  type: 'aws_apigatewayv2_integration';
  // Note: 'name' for integration is usually auto-generated or set for clarity
  properties: {
    api_id: string;
    integration_type: 'AWS_PROXY';
    integration_uri: string;
    integration_method?: 'POST'; // Required for AWS_PROXY
    payload_format_version?: '1.0' | '2.0'; // Default '1.0', '2.0' is recommended for HTTP APIs
    timeout_milliseconds?: number; // Max 29000 for Lambda Proxy
  } & TerraformItem['properties'];
}

export interface TerraformResourceApiGatewayV2Route extends TerraformResource {
  type: 'aws_apigatewayv2_route';
  // Note: 'name' for route is usually auto-generated or set for clarity
  properties: {
    api_id: string;
    route_key: string; // e.g., "GET /items", "POST /users/{id}", "$default"
    target?: string;
    authorization_type?: 'NONE' | 'JWT' | 'AWS_IAM' | 'CUSTOM';
    authorizer_id?: string; // If authorization_type is JWT or CUSTOM
    operation_name?: string; // For documentation/metadata
    route_response_selection_expression?: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceApiGatewayV2Stage extends TerraformResource {
  type: 'aws_apigatewayv2_stage';
  properties: {
    api_id: string;
    name: '$default' | 'dev' | 'prod';
    auto_deploy?: boolean; // Automatically deploy changes from the API definition
    description?: string;
    access_log_settings?: {
      destination_arn: string; // CloudWatch Log Group ARN
      format: string; // Log format string
    };
    default_route_settings?: {
      detailed_metrics_enabled?: boolean;
      throttling_burst_limit?: number;
      throttling_rate_limit?: number; // requests per second
    };
    stage_variables?: { [key: string]: string };
  } & TerraformItem['properties'];
}

export interface TerraformResourceCloudWatchEventRule extends TerraformResource {
  type: 'aws_cloudwatch_event_rule';
  properties: {
    name: string;
    schedule_expression: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceCloudWatchEventTarget extends TerraformResource {
  type: 'aws_cloudwatch_event_target';
  properties: {
    rule: string;
    arn: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceEcrRepository extends TerraformResource {
  type: 'aws_ecr_repository';
  properties: {
    name: string;
    image_tag_mutability?: 'MUTABLE' | 'IMMUTABLE';
    force_delete?: boolean;
  } & TerraformItem['properties'];
}

export interface TerraformResourceElasticIp extends TerraformResource {
  type: 'aws_eip';
  properties: {
    domain: 'vpc';
  } & TerraformItem['properties'];
}

export interface TerraformResourceElasticIpAssociation extends TerraformResource {
  type: 'aws_eip_association';
  properties: {
    instance_id: string;
    allocation_id: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceIamPolicy extends TerraformResource {
  type: 'aws_iam_policy';
  properties: {
    name: string;
    policy: object | string;
    description?: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceIamRole extends TerraformResource {
  type: 'aws_iam_role';
  properties: {
    name: string;
    assume_role_policy: object | string;
    description?: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceIamRolePolicyAttachment
  extends TerraformResource {
  type: 'aws_iam_role_policy_attachment';
  properties: {
    role: string;
    policy_arn: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceInstance extends TerraformResource {
  type: 'aws_instance';
  properties: {
    ami: string;
    instance_type: string;
    subnet_id: string;
    vpc_security_group_ids: string[];
    associate_public_ip_address?: boolean;
    source_dest_check?: boolean;
    user_data?: string;
    credit_specification?: {
      cpu_credits: 'unlimited' | 'standard';
    };
    lifecycle?: {
      ignore_changes?: string[];
    };
  } & TerraformItem['properties'];
}

export interface TerraformResourceInternetGateway extends TerraformResource {
  type: 'aws_internet_gateway';
  properties: {
    vpc_id: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceLambdaEventSourceMapping
  extends TerraformResource {
  type: 'aws_lambda_event_source_mapping';
  // Note: 'name' for mapping is usually auto-generated or set for clarity (it's the UUID)
  properties: {
    event_source_arn: string;
    function_name: string;
    batch_size?: number; // Max number of items to retrieve in a single batch
    enabled?: boolean; // Default is true
    maximum_batching_window_in_seconds?: number; // Max time to gather records before invoking
    filter_criteria?: {
      // For filtering events (e.g., SQS message attributes)
      filters: {
        pattern: object;
      }[];
    };
  } & TerraformItem['properties'];
}

export interface TerraformResourceLambdaFunction extends TerraformResource {
  type: 'aws_lambda_function';
  properties: {
    function_name: string;
    handler?: string;
    runtime?: LambdaRuntime;
    role: string;
    reserved_concurrent_executions?: number;
    filename?: string;
    s3_bucket?: string;
    s3_key?: string;
    source_code_hash?: string;
    timeout?: number; // in seconds
    memory_size?: number; // in MB
    image_uri?: string;
    package_type?: 'Zip' | 'Image';

    image_config?: {
      command?: {
        flagTerraformProperty: true;
        type: 'attribution';
        value: string[];
      };
    };

    vpc_config?: {
      subnet_ids: string[];
      security_group_ids: string[];
    };

    environment?: {
      variables: {
        flagTerraformProperty: true;
        type: 'attribution';
        value: {
        [key: string]:
          | string
          | TerraformResourceLambdaFunction
          | TerraformResourceSqsQueue
          | TerraformResourceApiGatewayV2Api
        };
      };
    };
    layers?: string[];
  } & TerraformItem['properties'];
}


export interface TerraformResourceLambdaPermission extends TerraformResource {
  type: 'aws_lambda_permission';
  properties: {
    statement_id: string; // Unique identifier (e.g., "AllowAPIGatewayInvoke")
    action: 'lambda:InvokeFunction';
    function_name: string;
    principal: string; // e.g., 'apigateway.amazonaws.com', 's3.amazonaws.com', 'sqs.amazonaws.com'
    source_arn?: string
    source_account?: string; // Source account ID if principal is an AWS service from another account
  } & TerraformItem['properties'];
}

export interface TerraformResourceNull extends TerraformResource {
  type: 'null_resource';
  properties?: {
    triggers?: {
      value: { [key: string]: string };
      flagTerraformProperty: true;
      type: 'attribution';
    };
    provisioner?: {
      keyType: 'local-exec';
      type: 'object';
      flagTerraformProperty: true;
      value: {
        command: string;
        working_dir?: string;
      };
    };
  } & TerraformItem['properties']
}

export interface TerraformResourceRoute extends TerraformResource {
  type: 'aws_route';
  properties: {
    route_table_id: string;
    destination_cidr_block: string;
    gateway_id?: string;
    instance_id?: string;
    network_interface_id?: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceRouteTable extends TerraformResource {
  type: 'aws_route_table';
  properties: {
    vpc_id: string;
    route?: {
      cidr_block: string;
      gateway_id?: string;
      instance_id?: string;
      network_interface_id?: string;
    }
  } & TerraformItem['properties'];
}

export interface TerraformResourceRouteTableAssociation extends TerraformResource {
  type: 'aws_route_table_association';
  properties: {
    subnet_id: string;
    route_table_id: string;
  } & TerraformItem['properties'];
}

export interface TerraformResourceSecurityGroup extends TerraformResource {
  type: 'aws_security_group';
  properties: {
    name: string;
    description?: string;
    vpc_id: string;
    ingress?: {
      description: string;
      from_port: number;
      to_port: number;
      protocol: string;
      cidr_blocks: (TerraformResourceSubnet | string)[];
    };
    egress?: {
      description: string;
      from_port: number;
      to_port: number;
      protocol: string;
      cidr_blocks: (TerraformResourceSubnet | string)[];
    }
  } & TerraformItem['properties']
}

export interface TerraformResourceSqsQueue extends TerraformResource {
  type: 'aws_sqs_queue';
  properties: {
    name?: string; // Either name or name_prefix is required
    name_prefix?: string;
    fifo_queue?: boolean; // Default false
    content_based_deduplication?: boolean; // Only for FIFO queues
    delay_seconds?: number;
    max_message_size?: number;
    message_retention_seconds?: number;
    receive_wait_time_seconds?: number; // Long polling
    visibility_timeout_seconds?: number;
    redrive_policy?: object;
    redrive_allow_policy?: object;
    sqs_managed_sse_enabled?: boolean; // Server-side encryption
  } & TerraformItem['properties'];
}

export interface TerraformResourceSubnet extends TerraformResource {
  type: 'aws_subnet';
  properties: {
    vpc_id: string;
    cidr_block: string;
    availability_zone?: string;
    map_public_ip_on_launch?: boolean;
  } & TerraformItem['properties'];
}

export interface TerraformResourceVpc extends TerraformResource {
  type: 'aws_vpc';
  properties: {
    cidr_block: string;
    enable_dns_support: boolean;
    enable_dns_hostnames: boolean;
  } & TerraformItem['properties'];
}
