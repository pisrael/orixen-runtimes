
import { getItemReference } from "../../../terraform/serializeTerraform/getItemReference";
import { 
  TerraformDataAmi, 
  TerraformDataAwsAvailabilityZones, 
  TerraformDataAwsCallerIdentity,
  TerraformResourceElasticIp, 
  TerraformResourceElasticIpAssociation, 
  TerraformResourceInstance, 
  TerraformResourceInternetGateway, 
  TerraformResourceRoute, 
  TerraformResourceRouteTable,
  TerraformResourceRouteTableAssociation, 
  TerraformResourceSecurityGroup, 
  TerraformResourceSubnet, 
  TerraformResourceVpc 
} from "./types";

export interface ProjectInfra {
  availabilityZones?: TerraformDataAwsAvailabilityZones;
  vpc?: TerraformResourceVpc;
  publicSubnet?: TerraformResourceSubnet;
  privateSubnetA?: TerraformResourceSubnet;
  privateSubnetB?: TerraformResourceSubnet;
  internetGateway?: TerraformResourceInternetGateway;
  publicRouteTable?: TerraformResourceRouteTable;
  publicRoute?: TerraformResourceRoute;
  publicRouteAssociation?: TerraformResourceRouteTableAssociation;
  privateRouteTable?: TerraformResourceRouteTable;
  privateRouteAssociationA?: TerraformResourceRouteTableAssociation;
  privateRouteAssociationB?: TerraformResourceRouteTableAssociation;
  natAmi?: TerraformDataAmi;
  natInstance?: TerraformResourceInstance;
  natElasticIp?: TerraformResourceElasticIp;
  natElasticIpAssociation?: TerraformResourceElasticIpAssociation;
  natSecurityGroup?: TerraformResourceSecurityGroup;
  natRoute?: TerraformResourceRoute;
  awsCallerIdentity?: TerraformDataAwsCallerIdentity
  lambdaSecurityGroup?: TerraformResourceSecurityGroup;
}


export function createProjectInfra(prefix: string, includeVpc: boolean = false, includeFixedIp: boolean = false): ProjectInfra {
  
  if (includeFixedIp && !includeVpc) {
    throw new Error('Fixed IP requires VPC to be enabled');
  }

  const awsCallerIdentity: TerraformDataAwsCallerIdentity = {
    key: 'data',
    type: 'aws_caller_identity',
    name: 'current',
    properties: {},
  };

  // Base infrastructure that's always created
  const baseInfra: ProjectInfra = {
    awsCallerIdentity,
  };

  // Only create VPC infrastructure if requested
  if (!includeVpc) {
    return baseInfra;
  }

  const availabilityZones: TerraformDataAwsAvailabilityZones = {
    key: 'data',
    type: 'aws_availability_zones',
    name: 'available',
    properties: {
      state: 'available',
    },
  };

    // NAT AMI data source
    const natAmi: TerraformDataAmi = {
      key: 'data',
      type: 'aws_ami',
      name: 'al2_arm',
      properties: {
        owners: ['amazon'],
        most_recent: true,
        filter1: {
          key: 'filter',
          flagTerraformProperty: true,
          value: {
            name: 'name',
            values: ['amzn2-ami-kernel-5.10-hvm-*-arm64-gp2'],
          },
          type: 'object',
        },
        filter2: {
          key: 'filter',
          flagTerraformProperty: true,
          value: {
            name: 'architecture',
            values: ['arm64'],
          },
          type: 'object',
        },
        filter3: {
          key: 'filter',
          flagTerraformProperty: true,
          value: {
            name: 'virtualization-type',
            values: ['hvm'],
          },
          type: 'object',
        },
        filter4: {
          key: 'filter',
          flagTerraformProperty: true,
          value: {
            name: 'root-device-type',
            values: ['ebs'],
          },
          type: 'object',
        },
      },
    };

  const vpc: TerraformResourceVpc = {
    key: 'resource',
    type: 'aws_vpc',
    name: 'vpc',
    properties: {
      cidr_block: '10.0.0.0/16',
      enable_dns_support: true,
      enable_dns_hostnames: true,
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { Name: `${prefix}-vpc` }
      }
    }
  };

  const publicSubnet: TerraformResourceSubnet = {
    key: 'resource',
    type: 'aws_subnet',
    name: 'public_a',
    properties: {
      vpc_id: getItemReference(vpc, 'id'),
      cidr_block: '10.0.0.0/24',
      availability_zone: '&data.aws_availability_zones.available.names[0]',
      map_public_ip_on_launch: true,
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { 
          Name: `${prefix}-public-a`,
          Type: 'Public'
        }
      }
    }
  };

  const privateSubnetA: TerraformResourceSubnet = {
    key: 'resource',
    type: 'aws_subnet',
    name: 'private_a',
    properties: {
      vpc_id: getItemReference(vpc, 'id'),
      cidr_block: '10.0.1.0/24',
      availability_zone: '&data.aws_availability_zones.available.names[0]',
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { 
          Name: `${prefix}-private-a`,
          Type: 'Private'
        }
      }
    }
  };

  const privateSubnetB: TerraformResourceSubnet = {
    key: 'resource',
    type: 'aws_subnet',
    name: 'private_b',
    properties: {
      vpc_id: getItemReference(vpc, 'id'),
      cidr_block: '10.0.2.0/24',
      availability_zone: '&data.aws_availability_zones.available.names[1]',
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { 
          Name: `${prefix}-private-b`,
          Type: 'Private'
        }
      }
    }
  };

  const internetGateway: TerraformResourceInternetGateway = {
    key: 'resource',
    type: 'aws_internet_gateway',
    name: 'igw',
    properties: {
      vpc_id: getItemReference(vpc, 'id'),
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { Name: `${prefix}-igw` }
      }
    }
  };

  const natElasticIp: TerraformResourceElasticIp = {
    key: 'resource',
    type: 'aws_eip',
    name: 'nat_eip',
    properties: {
      domain: 'vpc',
      depends_on: [getItemReference(internetGateway)],
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { Name: `${prefix}-nat-eip` }
      }
    },
  };

  const natSecurityGroup: TerraformResourceSecurityGroup = {
    key: 'resource',
    type: 'aws_security_group',
    name: 'nat_sg',
    properties: {
      name: `${prefix}-nat-sg`,
      description: 'Allow private subnets to egress via NAT; allow internet out',
      vpc_id: getItemReference(vpc, 'id'),
      ingress: {
        description: "Allow all traffic from private subnets",
        from_port: 0,
        to_port: 0,
        protocol: '-1',
        cidr_blocks: [privateSubnetA.properties.cidr_block, privateSubnetB.properties.cidr_block],
      },
      egress: {
        description: "Allow all outbound traffic",
        from_port: 0,
        to_port: 0,
        protocol: '-1',
        cidr_blocks: ['0.0.0.0/0'],
      },
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { Name: `${prefix}-nat-sg` }
      }
    },
  };


  // NAT user data
  const natUserData =
  `&<<-EOT
    #!/bin/bash
    # Enable IP forwarding
    echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
    sysctl -p
    
    # NAT on the public interface
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    # Allow forwarding
    iptables -A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT
    iptables -A FORWARD -j ACCEPT
    
    # Make iptables rules persistent
    yum install -y iptables-services
    service iptables save
    chkconfig iptables on
    
    # Log configuration completion
    echo "NAT instance configuration completed at $(date)" >> /var/log/nat-setup.log
  EOT`;

  const natInstance: TerraformResourceInstance = {
    key: 'resource',
    type: 'aws_instance',
    name: 'nat',
    properties: {
      ami: getItemReference(natAmi, 'id'),
      instance_type: 't4g.nano',
      subnet_id: getItemReference(publicSubnet, 'id'),
      vpc_security_group_ids: [getItemReference(natSecurityGroup, 'id')],
      associate_public_ip_address: true,
      source_dest_check: false,
      user_data: natUserData,
      credit_specification: {
        cpu_credits: 'unlimited',
      },
      lifecycle: {
        // Ignore changes to the AMI to prevent the NAT instance from being recreated when the AMI updates
        ignore_changes: ['&ami'],
      },
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { 
          Name: `${prefix}-nat`,
          Type: 'NAT'
        }
      }
    },
  };

  const natElasticIpAssociation: TerraformResourceElasticIpAssociation = {
    key: 'resource',
    type: 'aws_eip_association',
    name: 'nat_assoc',
    properties: {
      instance_id: getItemReference(natInstance, 'id'),
      allocation_id: getItemReference(natElasticIp, 'id'),
    },
  };

  const publicRouteTable: TerraformResourceRouteTable = {
    key: 'resource',
    type: 'aws_route_table',
    name: 'public',
    properties: {
      vpc_id: getItemReference(vpc, 'id'),
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { Name: `${prefix}-public-rt` }
      }
    }
  };

  const privateRouteTable: TerraformResourceRouteTable = {
    key: 'resource',
    type: 'aws_route_table',
    name: 'private',
    properties: {
      vpc_id: getItemReference(vpc, 'id'),
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { Name: `${prefix}-private-rt` }
      }
    }
  };

  const natRoute: TerraformResourceRoute = {
    key: 'resource',
    type: 'aws_route',
    name: 'private_nat_route',
    properties: {
      route_table_id: getItemReference(privateRouteTable, 'id'),
      destination_cidr_block: '0.0.0.0/0',
      network_interface_id: getItemReference(natInstance, 'primary_network_interface_id'),
    },
  };

  const publicRoute: TerraformResourceRoute = {
    key: 'resource',
    type: 'aws_route',
    name: 'public_internet',
    properties: {
      route_table_id: getItemReference(publicRouteTable, 'id'),
      destination_cidr_block: '0.0.0.0/0',
      gateway_id: getItemReference(internetGateway, 'id'),
    },
  };

  const publicRouteAssociation: TerraformResourceRouteTableAssociation = {
    key: 'resource',
    type: 'aws_route_table_association',
    name: 'public_assoc_a',
    properties: {
      subnet_id: getItemReference(publicSubnet, 'id'),
      route_table_id: getItemReference(publicRouteTable, 'id'),
    },
  };

  const privateRouteAssociationA: TerraformResourceRouteTableAssociation = {
    key: 'resource',
    type: 'aws_route_table_association',
    name: 'private_a_assoc',
    properties: {
      subnet_id: getItemReference(privateSubnetA, 'id'),
      route_table_id: getItemReference(privateRouteTable, 'id'),
    },
  };

  const privateRouteAssociationB: TerraformResourceRouteTableAssociation = {
    key: 'resource',
    type: 'aws_route_table_association',
    name: 'private_b_assoc',
    properties: {
      subnet_id: getItemReference(privateSubnetB, 'id'),
      route_table_id: getItemReference(privateRouteTable, 'id'),
    },
  };

  const lambdaSecurityGroup: TerraformResourceSecurityGroup = {
    key: 'resource',
    type: 'aws_security_group',
    name: 'lambda_sg',
    properties: {
      name: `${prefix}-lambda-sg`,
      description: 'Lambda VPC SG',
      vpc_id: getItemReference(vpc, 'id'),
      egress: {
        description: "Allow all outbound traffic",
        from_port: 0,
        to_port: 0,
        protocol: '-1',
        cidr_blocks: ['0.0.0.0/0'],
      },
      tags: { 
        flagTerraformProperty: true,
        type: 'attribution',
        value: { Name: `${prefix}-lambda-sg` }
      }
    }
  };

  const vpcInfra: ProjectInfra = {
    ...baseInfra,
    availabilityZones,
    vpc,
    publicSubnet,
    privateSubnetA,
    privateSubnetB,
    internetGateway,
    publicRouteTable,
    publicRoute,
    publicRouteAssociation,
    privateRouteTable,
    privateRouteAssociationA,
    privateRouteAssociationB,
    lambdaSecurityGroup,
    natAmi,
    natInstance,
    natSecurityGroup,
    natRoute,
  };

  if (includeFixedIp) {
    return {
      ...vpcInfra,
      natElasticIp,
      natElasticIpAssociation,
    };
  }

  return vpcInfra;
}