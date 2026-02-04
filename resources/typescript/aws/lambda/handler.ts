import {
  Event,
  getHandlerInputData,
} from './handler-io';
import { sendToFunction } from './send-to-function';
import { sendToQueue } from './send-to-queue';
import blockFunction from '../index';
import { INPUT_SYNCHRONOUS, OUTPUT_NAME_TO_ID, OUTPUT_RESPONSE, OUTPUTS_TYPES } from './ids';
import { FunctionError, StatusCode } from './function-status';
import HandlerResult from './handler-result';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { InvocationResponse } from 'aws-sdk/clients/lambda';
import { InputData, OutputData, SendOptions } from './io-types';

type SendFunction = (payload: any, to?: string, options?: SendOptions) => void;
type BlockFunction = (input: any, sendFunction?: SendFunction) => Promise<void>;

export async function handlerFunction(event: Event): Promise<HandlerResponse> {
  try {
    const inputsData = getHandlerInputData(event);
    const noResultPromises: Promise<any>[] = [];
    const functionPromises: Promise<InvocationResponse>[] = [];
    const queueData: Record<string, OutputData[]> = {};

    const results = new HandlerResult();
    for (const input of inputsData) {
      console.log('input', input);
      // @ts-ignore - for simplicity, no options will be declared at the run function if not needed
      await (blockFunction as BlockFunction)(input, (payload, options?: SendOptions) => {
        const outputData: OutputData = getOutputData(input, payload, options);
        console.log('outputData', outputData);

        postToOutputOrAccumulate(
          outputData,
          results,
          noResultPromises,
          functionPromises,
          queueData
        );
      });
    }

    await handleFunctionBlockResponses(functionPromises, noResultPromises, results);
    sendQueueData(queueData, noResultPromises);

    if (noResultPromises.length > 0) {
      await Promise.all(noResultPromises);
    }
    const response = getHandlerResponse(results);
    console.log('Response:', JSON.stringify(response, null, 2))
    return response;
  } catch (error: any) {
    console.error('Handler error:', error);

    if (error instanceof FunctionError) {
      return {
        statusCode: error.statusCode,
        body: typeof error.message === 'string' ? error.message : JSON.stringify(error.message)
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error?.message || 'Internal server error'
      })
    };
  }
}

function getOutputData(input: InputData, payload: any, options?: SendOptions) {
  const isWsRoute = ['$default', '$connect', '$disconnect'].includes(input.ctx?.webSocket?.routeKey);
  const outputData: OutputData = {
    payload,
    to: options?.to || 'default',
    statusCode: options?.statusCode,
    synchronous: optionOrDefault(options?.synchronous, input.ctx?.synchronous || INPUT_SYNCHRONOUS[input.from] || isWsRoute),
    fromWebSocket: isWsRoute ? {
      connectionId: optionOrDefault(options?.webSocket?.connectionId, input.ctx?.webSocket?.connectionId),
      domainName: input.ctx.webSocket?.domainName,
      stage: input.ctx?.webSocket?.stage,
      routeKey: input.ctx?.webSocket.routeKey
    }: undefined
  };
  return outputData;
}

function optionOrDefault(optionValue: any, defaultValue: any) {
  return optionValue === undefined ? defaultValue : optionValue;
}


function postToOutputOrAccumulate(
  outputData: OutputData,
  results: HandlerResult,
  wsPromises: Promise<void>[],
  functionPromises: Promise<InvocationResponse>[],
  queueData: Record<string, OutputData[]>
): void {
  const outputKey = outputData.to;
  const outputId = OUTPUT_NAME_TO_ID[outputKey];

  if (OUTPUT_RESPONSE[outputId]) {
    handleOutputResponse(outputData, wsPromises, results);
  } else {
    handleBlockOutput(outputId, outputData, functionPromises, queueData);
  }
}

function handleBlockOutput(
  outputId: string,
  outputData: OutputData,
  functionPromises: Promise<InvocationResponse>[],
  queueData: Record<string, OutputData[]>
) {
  const envVar = formatEnvVar(outputId);
  const outputUrl = process.env[envVar];
  if (outputUrl) {
    const outputType = OUTPUTS_TYPES[outputId];
    if (outputType === 'function') {
      const promise = sendToFunction(outputData, outputUrl);
      functionPromises.push(promise);
    } else if (outputType === 'queue') {
      if (!queueData[outputUrl]) {
        queueData[outputUrl] = [];
      }
      queueData[outputUrl].push(outputData);
    }
  }
}

function formatEnvVar(envVar: string) {
  return envVar.replace(/[^a-zA-Z0-9_]/g, '_');
}

function handleOutputResponse(outputData: OutputData, wsPromises: Promise<any>[], results: HandlerResult) {
  if (outputData.fromWebSocket) {
    const promise = postToWebsocket(
      outputData.fromWebSocket.domainName,
      outputData.fromWebSocket.stage,
      outputData.fromWebSocket.connectionId,
      outputData.payload
    );
    wsPromises.push(promise);
  } else {
    results.addResult(outputData.payload, outputData.statusCode);
  }
}

async function postToWebsocket(domain: string, stage: string, connectionId: string, payload: any) {
  let endpoint = `https://${domain}/${stage}`;
  console.log('WebSocket endpoint:', endpoint);

  const client = new ApiGatewayManagementApiClient({
    endpoint: endpoint
  });

  const params = {
    ConnectionId: connectionId,
    Data: typeof payload === 'string' ? payload : JSON.stringify(payload)
  };

  console.log('Posting to websocket', params);
  return client.send(new PostToConnectionCommand(params));
}

async function handleFunctionBlockResponses(functionPromises: Promise<InvocationResponse>[], noResultPromises: Promise<any>[], results: HandlerResult) {
  if (!functionPromises.length) {
    return;
  }

  const functionResponses = await Promise.all(functionPromises);
  functionResponses.forEach((response) => {
    if (response?.Payload) {
      const handlerResponse = JSON.parse(response?.Payload.toString()) as HandlerResponse;
      if (handlerResponse.body) {
        results.addResult(handlerResponse.body, handlerResponse?.statusCode);
      }
    }
  });
}

function sendQueueData(queueData: Record<string, OutputData[]>, noResultPromises: Promise<any>[]) {
  for (const outputUrl in queueData) {
    const outputData = queueData[outputUrl];
    const promise = sendToQueue(outputData, outputUrl);
    noResultPromises.push(promise);
  }
}

function getHandlerResponse(results: HandlerResult) {
  const response: HandlerResponse = {
    statusCode: results?.statusCode || 200
  };
  const result = results?.result;
  if (result) {
    if (typeof result === 'object') {
      response.body = JSON.stringify(result);
    } else {
      response.body = result;
    }
  };
  return response;
}

interface HandlerResponse {
  statusCode: StatusCode;
  headers?: Record<string, string>;
  body?: string;
}