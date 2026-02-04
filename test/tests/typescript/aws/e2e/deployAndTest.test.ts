import { execSync } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it
} from 'vitest';
import WebSocket from 'ws';

import {
  pinggy,
  TunnelInstance
} from '@pinggy/pinggy';

import { NodeFileSystem } from '../../../../../filesystem';
import {
  AwsTypeScriptGenerator,
  DeployParams
} from '../../../../../lib';

let apiGatewayUrl: string;
let wsWssUrl: string;
let tmpDir: string;
let deployPath: string;

describe('e2e deploy and test', () => {
  beforeAll(async () => {
    assertPrerequisites();

    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'orixen-e2e-'));
    deployPath = path.join(tmpDir, 'deploy', 'aws');

    await generateDeployArtifacts(tmpDir);
    terraformInit(deployPath);
    terraformApply(deployPath);

    const outputs = parseTerraformOutputs(deployPath);
    apiGatewayUrl = outputs.apiGatewayUrl;
    wsWssUrl = outputs.wsWssUrl;

    console.log('API Gateway URL:', apiGatewayUrl);
    console.log('WebSocket URL:', wsWssUrl);
    console.log('Temporary directory for deployment:', tmpDir);
  });

  afterAll(async () => {
    if (deployPath) {
      try {
        terraformDestroy(deployPath);
      } catch (error) {
        console.error('terraform destroy failed (best-effort):', error);
      }
    }

    if (tmpDir) {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }

    try {
      await pinggy.closeAllTunnels();
    } catch {
      // Tunnels may already be stopped by per-test cleanup
      console.warn('Some tunnels were already closed.');
    }
  });

  it('HTTP async triggers callback via SQS queue', async () => {
    let server: http.Server | undefined;
    let tunnel: TunnelInstance | undefined;

    try {
      const callbackInfra = await createCallbackInfra();
      server = callbackInfra.server;
      tunnel = callbackInfra.tunnel;

      const callbackUrl = callbackInfra.publicUrl;
      const url = `${apiGatewayUrl}/async?callback=${encodeURIComponent(callbackUrl)}`;
      console.log('Fetching:', url);

      const response = await fetch(url);
      console.log('API response status:', response.status);

      const callbackBody = await withTimeout(
        callbackInfra.waitForCallback(),
        20 * 60 * 1000,
        'Timed out waiting for HTTP async callback'
      );

      expect(callbackBody).toEqual({ status: 'done' });
    } finally {
      await shutdownCallbackInfra(server, tunnel);
    }
  });

  it('WebSocket triggers callback via queue', async () => {
    let server: http.Server | undefined;
    let tunnel: TunnelInstance | undefined;
    let ws: WebSocket | undefined;

    try {
      const callbackInfra = await createCallbackInfra();
      server = callbackInfra.server;
      tunnel = callbackInfra.tunnel;

      const callbackUrl = callbackInfra.publicUrl;
      console.log('Connecting to WebSocket:', wsWssUrl);

      const wsResult = await sendWebSocketMessageWithRetry(wsWssUrl, callbackUrl);
      ws = wsResult.ws;

      console.log('WebSocket response:', wsResult.response);
      expect(wsResult.response).toContain('your message will be processed and sent to');
      expect(wsResult.response).toContain(callbackUrl);

      const callbackBody = await withTimeout(
        callbackInfra.waitForCallback(),
        20 * 60 * 1000,
        'Timed out waiting for WebSocket callback'
      );

      expect(callbackBody).toEqual({ status: 'done' });
    } finally {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      await shutdownCallbackInfra(server, tunnel);
    }
  });
});

// --- Helper functions ---

function assertPrerequisites() {
  assertCommandExists('aws', 'AWS CLI is required. Install: https://aws.amazon.com/cli/');
  assertCommandExists('terraform', 'Terraform is required. Install: https://www.terraform.io/downloads');
}

function assertCommandExists(command: string, message: string) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
  } catch {
    throw new Error(message);
  }
}

async function generateDeployArtifacts(tmpDir: string) {
  const projectPath = path.resolve(__dirname, '../../../../test-project');
  const resourcesPath = path.resolve(__dirname, '../../../../../resources/typescript');

  const nodeFs = new NodeFileSystem(tmpDir);
  const generator = new AwsTypeScriptGenerator();
  generator.initialize({ fs: nodeFs, resourcesPath });

  const params = makeDeployParams(tmpDir, projectPath);

  await generator.generateProjectDeploy(params, (report) => {
    console.log(`[deploy-gen] ${report.progress}% - ${report.message}`);
  });
}

function makeDeployParams(tmpDir: string, projectPath: string): DeployParams {
  const deployFolder = path.join(tmpDir, 'deploy', 'aws');
  return {
    projectFolder: projectPath,
    deployFolder,
    region: 'us-east-1',
    envs: {
      'VAR_1': 'value1',
      'VAR_2': 'value2',
    },
  };
}

function terraformInit(deployPath: string) {
  console.log('Running terraform init...');
  execSync('terraform init -backend=false', {
    cwd: deployPath,
    stdio: 'inherit',
  });
}

function terraformApply(deployPath: string) {
  console.log('Running terraform apply...');
  execSync('terraform apply -auto-approve', {
    cwd: deployPath,
    stdio: 'inherit',
    timeout: 10 * 60 * 1000,
  });
}

function terraformDestroy(deployPath: string) {
  console.log('Running terraform destroy...');
  execSync('terraform destroy -auto-approve', {
    cwd: deployPath,
    stdio: 'ignore',
    timeout: 10 * 60 * 1000,
  });
  console.log('Terraform destroy completed.');
}

function parseTerraformOutputs(deployPath: string): { apiGatewayUrl: string; wsWssUrl: string } {
  const outputJson = execSync('terraform output -json', {
    cwd: deployPath,
    encoding: 'utf-8',
  });

  const outputs = JSON.parse(outputJson);
  return {
    apiGatewayUrl: outputs.api_gateway_url.value,
    wsWssUrl: outputs.ws_wss_url.value,
  };
}

async function createCallbackInfra(): Promise<{
  server: http.Server;
  tunnel: TunnelInstance;
  publicUrl: string;
  waitForCallback: () => Promise<unknown>;
}> {
  const { server, port, waitForCallback } = createCallbackServer();
  const { tunnel, publicUrl } = await createTunnel(port);

  return { server, tunnel, publicUrl, waitForCallback };
}

function createCallbackServer(): {
  server: http.Server;
  port: number;
  waitForCallback: () => Promise<unknown>;
} {
  let resolveCallback: (body: unknown) => void;
  const callbackPromise = new Promise<unknown>((resolve) => {
    resolveCallback = resolve;
  });

  const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        console.log('Callback received:', body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
        resolveCallback(JSON.parse(body));
      });
    } else {
      res.writeHead(200);
      res.end('ok');
    }
  });

  server.listen(0);
  const port = (server.address() as { port: number }).port;
  console.log('Callback server listening on port:', port);

  return { server, port, waitForCallback: () => callbackPromise };
}

async function createTunnel(port: number): Promise<{
  tunnel: TunnelInstance;
  publicUrl: string;
}> {
  const tunnel = await pinggy.forward({
    forwarding: `localhost:${port}`,
  });

  const urls = await tunnel.urls();
  const publicUrl = urls[0];
  console.log('Tunnel public URL:', publicUrl);

  return { tunnel, publicUrl };
}

async function shutdownCallbackInfra(
  server: http.Server | undefined,
  tunnel: TunnelInstance | undefined
) {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  if (tunnel) {
    await tunnel.stop();
  }
}

async function sendWebSocketMessageWithRetry(
  wsUrl: string,
  message: string,
  maxRetries = 3
): Promise<{ ws: WebSocket; response: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendWebSocketMessage(wsUrl, message);
    } catch (error: any) {
      const is403 = error.message?.includes('403');
      if (attempt < maxRetries && is403) {
        const delay = attempt * 5000;
        console.log(`WS attempt ${attempt} failed with 403, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('WebSocket connection failed after max retries');
}

function sendWebSocketMessage(wsUrl: string, message: string): Promise<{
  ws: WebSocket;
  response: string;
}> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, { handshakeTimeout: 60_000 });

    ws.on('open', () => {
      console.log('WebSocket connected, sending message...');
      ws.send(message);
    });

    ws.on('message', (data: WebSocket.Data) => {
      const response = data.toString();
      resolve({ ws, response });
    });

    ws.on('unexpected-response', (_req, res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk; });
      res.on('end', () => {
        console.error('WS handshake failed:', res.statusCode, res.headers, body);
        reject(new Error(`WebSocket handshake failed: ${res.statusCode} - ${body}`));
      });
    });

    ws.on('error', (error) => {
      reject(new Error(`WebSocket error: ${error.message}`));
    });
  });
}

function convertToWsUrl(url: string): string {
  return url
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://');
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}
