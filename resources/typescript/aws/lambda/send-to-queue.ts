import { SendMessageBatchResult } from 'aws-sdk/clients/sqs';
import { SQS } from 'aws-sdk';
import { OutputData } from './io-types';

export async function sendToQueue(data: OutputData[], queueUrl: string) {
  const messageArray = data.map((item) => JSON.stringify(item));
  const chunks = splitIntoChunks(messageArray, 1048576);
  const promises: Promise<SendMessageBatchResult>[] = [];
  const sqs = new SQS();
  for (const chunk of chunks) {
    promises.push(
      sqs.sendMessageBatch({ QueueUrl: queueUrl, Entries: chunk }).promise(),
    );
  }
  return Promise.all(promises);
}

interface QueueMessage {
  Id: string;
  MessageBody: string;
}

function splitIntoChunks(
  messageArray: string[],
  maxSize: number,
): QueueMessage[][] {
  const chunks: QueueMessage[][] = [];
  let chunk: QueueMessage[] = [];
  let currentSize = 0;
  for (let i = 0; i < messageArray.length; i++) {
    const item = {
      Id: i.toString(),
      MessageBody: messageArray[i],
    };
    const itemSize = Buffer.byteLength(JSON.stringify(item));
    if (currentSize + itemSize > maxSize && chunk.length > 0) {
      chunks.push(chunk);
      chunk = [];
      currentSize = 0;
    }
    chunk.push(item);
    currentSize += itemSize;
  }
  if (chunk.length > 0) {
    chunks.push(chunk);
  }
  return chunks;
}
