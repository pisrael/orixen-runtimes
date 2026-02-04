
import { FunctionError, STATUS_CODE } from './_lib/function-status';
import { InputData } from './_lib/io-types';

async function run(input: InputData, _) {
  const callback = input.payload?.callback;

  if (!callback || typeof callback !== 'string') {
    throw new FunctionError('Missing callback URL', STATUS_CODE.BAD_REQUEST);
  }

  await postCallback(callback);
}

async function postCallback(url: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'done' }),
  });

  if (!response.ok) {
    throw new FunctionError(
      `Callback failed with status ${response.status}`,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
    );
  }
}

export default run;
