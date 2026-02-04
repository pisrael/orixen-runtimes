import { APIGatewayProxyEvent, ScheduledEvent, SQSEvent } from 'aws-lambda';
import { INPUT_CONNECTIONS, INPUT_SYNCHRONOUS } from './ids';
import { InputData, OutputData } from './io-types';
import { InputNames } from './inputs';
export type Send<T> = (payload: T, outputName?: string) => void;

export type Event = APIGatewayProxyEvent | SQSEvent | ScheduledEvent;

export function getHandlerInputData(event: Event): InputData[] {
  console.log(event);
  if ('requestContext' in event) {
    // APIGatewayProxyEvent
    const apiEvent = event as APIGatewayProxyEvent;
    const path = getPath(apiEvent);
    const from = INPUT_CONNECTIONS[path as keyof typeof INPUT_CONNECTIONS] as InputNames;
    const synchronous = !!(INPUT_SYNCHRONOUS[from]);
    const body = getApiGatewayPayload(apiEvent);
    const query = apiEvent.queryStringParameters ? apiEvent.queryStringParameters : {};
    return [
      {
        from,
        payload: body,
        ctx: {
          headers: apiEvent.headers,
          query: query,
          rawBody: apiEvent.body,
          synchronous: synchronous,
          webSocket: apiEvent.requestContext.connectionId ? {
            connectionId: apiEvent.requestContext.connectionId,
            domainName: apiEvent.requestContext.domainName,
            stage: apiEvent.requestContext.stage,
            routeKey: apiEvent.requestContext.routeKey
          } : undefined
        }
      },
    ];
  }
  if ('Records' in event) {
    // SQSEvent
    const sqsEvent = event as SQSEvent;
    return sqsEvent.Records.map((record: any) => {
      const outputData = JSON.parse(record.body) as OutputData;
      return {
        from: INPUT_CONNECTIONS[ outputData.to as keyof typeof INPUT_CONNECTIONS] as InputNames,
        payload: outputData.payload,
        ctx: {
          synchronous: false
        }
      };
    });
  }
  if ('detail-type' in event) {
    // ScheduledEvent
    const scheduleEvent = event as ScheduledEvent;
    const key = scheduleEvent.resources[0].split('/')[1] as keyof typeof INPUT_CONNECTIONS;
    return [
      {
        from: INPUT_CONNECTIONS[key] as InputNames,
        payload: undefined,
        ctx: {
          synchronous: false
        }
      },
    ];
  }
  const functionEvent = event as OutputData;
  return [
    {
      from: INPUT_CONNECTIONS[functionEvent.to as keyof typeof INPUT_CONNECTIONS] as InputNames,
      payload: functionEvent.payload,
      ctx: {
        synchronous: functionEvent.synchronous,
        webSocket: functionEvent.fromWebSocket
      }
    },
  ];
}

function getPath(apiEvent: APIGatewayProxyEvent) {
  if (apiEvent.requestContext.routeKey) {
    return apiEvent.requestContext.routeKey.replace('GET ', '').replace('POST ', '').replace('PUT ', '').replace('DELETE ', '').replace('PATCH ', '').replace('OPTIONS ', '').replace('HEAD ', '');
  } else if (apiEvent.path) {
    return apiEvent.path.replace(/\/dev/, '').replace(/\/prod/, '');
  }
  return;
}

function getApiGatewayPayload(event: APIGatewayProxyEvent) {
  const contentType = event.headers ? (event.headers['content-type'] || event.headers['Content-Type']) : undefined;
  let payload: any = {};
  if (event.body) {
    if (contentType && contentType.includes('application/json')) {
      payload = JSON.parse(event.body);
    } else {
      payload = event.body;
    }
  }
  if (event.queryStringParameters && typeof event.queryStringParameters === 'object') {
    payload = {...payload, ...event.queryStringParameters}
  }
  return payload;
}
