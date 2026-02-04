import { Lambda } from 'aws-sdk';
import { OutputData } from './io-types';

export async function sendToFunction(
  data: OutputData,
  functionName: string
): Promise<Lambda.InvocationResponse> {
  const lambda = new Lambda();
  const promise = lambda.invoke({
      FunctionName: functionName,
      InvocationType: data.synchronous ? 'RequestResponse' : 'Event',
      Payload: JSON.stringify(data)
    }).promise();
  return promise;
}
