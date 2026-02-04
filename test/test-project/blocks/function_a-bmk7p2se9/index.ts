
import BLOCK_PROPERTIES from './_lib/block-properties';
import { Inputs } from './_lib/inputs';
import {
  InputData,
  SendOptions
} from './_lib/io-types';
import { Outputs } from './_lib/outputs';
import { Asynch } from './inputs/asynch';

/**
 * For input definitions check types of {@link Inputs}.
 * For output definitions check types of {@link Outputs}.
 */
async function run(input: InputData, send: (payload: Outputs, options: SendOptions) => void) {
  console.log(JSON.stringify(input, null, 2));
  if (input.ctx.synchronous) {
    send({ data: `Synch data ${process.env.WS_SOCKET_TEST} from ${input.from}`}, {to: 'Sync'});
  } else {
    const callback = (input.payload as Asynch)?.callback;
    send({ data: `Processing async data from ${input.from} with callback ${callback}`}, {to: 'Sync'});
    send({ callback}, {to: 'Async'});
  }
}

export default run;
