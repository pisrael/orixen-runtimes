#!/usr/bin/env node
import './env';

import * as fs from 'fs';
import * as path from 'path';

import run from '../index';
import { OUTPUT_NAME_TO_ID } from './ids';
import { SendOptions } from './io-types';

let inputPayload = {};
let inputId = '';
let requestHeaders = {};

try {
  if (process.argv.length >= 4) {
    const inputFile = process.argv[2];
    inputId = process.argv[3];
    if (inputFile && inputFile.length) {
      const inputFilePath = path.resolve(inputFile);
      if (inputFilePath.endsWith('.json') && fs.existsSync(inputFilePath)) {
        inputPayload = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));
      }
    }

    if (process.argv.length >= 5) {
      const requestHeadersFile = process.argv[4];
      if (requestHeadersFile && requestHeadersFile.length) {
        const requestHeadersFilePath = path.resolve(requestHeadersFile);
        if (requestHeadersFilePath.endsWith('.json') && fs.existsSync(requestHeadersFilePath)) {
          requestHeaders = JSON.parse(fs.readFileSync(requestHeadersFilePath, 'utf8'));
        }
      }
    }
  }

  const sendCalls: any[] = [];
  const send = (payload: any, options?: SendOptions) => {
    let outputId: string | undefined;
    if (!options?.to && Object.keys(OUTPUT_NAME_TO_ID).length > 0) {
      outputId = Object.values(OUTPUT_NAME_TO_ID)[0] as string;
    } else if (options?.to) {
      outputId = OUTPUT_NAME_TO_ID[options.to];
    }

    const output = { payload, to: outputId };
    const to = options?.to || 'default';
    console.log(
      `<$SEND '${to}' {{${outputId}}}$>\n${JSON.stringify(output, null, 2)}\n<$/SEND$>`,
    );
    sendCalls.push(output);
  };

  run({ payload: (inputPayload as any), from: (inputId as any), ctx: { headers: requestHeaders } }, send)
} catch (error: any) {
  console.error(JSON.stringify({
    statusCode: error!.statusCode || 501,
    body: error!.message || 'Unknown error',
  }, null, 2));
  process.exit(1);
}
