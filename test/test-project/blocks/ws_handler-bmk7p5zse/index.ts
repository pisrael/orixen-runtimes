
import BLOCK_PROPERTIES from './_lib/block-properties';
import { Inputs } from './_lib/inputs';
import {
  InputData,
  SendOptions
} from './_lib/io-types';
import { Outputs } from './_lib/outputs';

/**
 * For input definitions check types of {@link Inputs}.
 * For output definitions check types of {@link Outputs}.
 */
async function run(input: InputData, send: (payload: Outputs, options: SendOptions) => void) {
  if (input.ctx.webSocket.routeKey === '$connect') {
    console.log('New connection established with id:', input.ctx.webSocket.connectionId);
    return;
  } else if (input.ctx.webSocket.routeKey === '$disconnect') {
    console.log('Connection disconnected with id:', input.ctx.webSocket.connectionId);
    return;
  } else {
    send(`your message will be processed and sent to ${input.payload}`, {to: 'Response'});
    send({ callback: input.payload }, {to: 'Queue'});
  }
}

export default run;
