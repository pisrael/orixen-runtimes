export interface FunctionBlockLambdaProperties {
  lambdaRuntime: LambdaRuntime;
  lambdaMemory: number; // 128 MB to 10,240 MB
  lambdaTimeout: number; // 1 to 900 seconds (15 minutes)
  lambdaEphemeralStorage: number; // 512 MB to 10,240 MB (/tmp directory)
  lambdaArchitecture: 'x86_64' | 'arm64';
  lambdaReservedConcurrentExecutions?: number; // Limit concurrent executions
  lambdaProvisionedConcurrency: number;   
  lambdaBatchSize?: number;
  lambdaMaximumBatchingWindowInSeconds?: number;
  deployAsDockerImage?: boolean;
}

export type LambdaRuntime = 
  | 'nodejs20.x' 
  | 'nodejs22.x'
  | 'python3.9'
  | 'python3.10'
  | 'python3.11'
  | 'python3.12'
  | 'python3.13'
  | 'java8.al2'
  | 'java11'
  | 'java17'
  | 'java21'
  | 'dotnet6'
  | 'dotnet8'
  | 'go1.x'
  | 'ruby3.2'
  | 'ruby3.3'
  | 'ruby3.4'
  | 'provided.al2'
  | 'provided.al2023';
