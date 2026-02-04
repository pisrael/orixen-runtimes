
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
async function run(input: InputData, send: (payload: Outputs) => void) {
  console.log(JSON.stringify(BLOCK_PROPERTIES, null, 2));
  send({ data: `${input.payload.data} \n\n ${JSON.stringify(BLOCK_PROPERTIES)}`});
}

export default run;
