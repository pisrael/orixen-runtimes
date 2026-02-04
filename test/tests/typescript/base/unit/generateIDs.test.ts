import {
  describe,
  expect,
  it
} from 'vitest';

import {
  buildInputConnectionsMap,
  buildInputSynchronousRecord,
  buildOutputNameToIdRecord,
  buildOutputResponseRecord,
  buildOutputTypesRecord,
  generateIDs
} from '../../../../../lib/typescript/common/generateIDs';
import {
  createApiBlock,
  createConnector,
  createFunctionBlock,
  createQueueBlock,
  createResponseBlock,
  createScheduleBlock
} from '../../../fixtures/blocks';
import {
  createConnection,
  createQueueConnection
} from '../../../fixtures/connections';

describe('generateIDs', () => {
  describe('buildOutputTypesRecord', () => {
    it('maps outputs to function or queue based on connection type', () => {
      const targetFn = createFunctionBlock({ id: 'fn-2' });
      const targetQueue = createQueueBlock({ id: 'queue-1' });

      const connFn = createConnection({
        fromBlockId: 'fn-1',
        toBlockId: 'fn-2',
        fromConnectorId: 'out-fn',
        toConnectorId: 'input-1',
      });
      const connQueue = createQueueConnection({
        fromBlockId: 'fn-1',
        toBlockId: 'queue-1',
        fromConnectorId: 'out-queue',
        toConnectorId: 'queue-in-1',
      });

      const outputsTypes = buildOutputTypesRecord(
        [connFn, connQueue],
        [targetFn as any, targetQueue as any]
      );

      expect(outputsTypes['out-fn']).toBe('function');
      expect(outputsTypes['out-queue']).toBe('queue');
    });
  });

  describe('buildOutputNameToIdRecord', () => {
    it('maps using PascalCase names', () => {
      const fnBlock = createFunctionBlock({
        id: 'fn-1',
        outputs: [
          createConnector({ id: 'out-1', name: 'sync output' }),
          createConnector({ id: 'out-2', name: 'async output' }),
        ],
      });

      const outputNameToId = buildOutputNameToIdRecord(fnBlock as any);

      expect(outputNameToId['SyncOutput']).toBe('out-1');
      expect(outputNameToId['AsyncOutput']).toBe('out-2');
      expect(outputNameToId['default']).toBe('out-1');
    });
  });

  describe('buildInputConnectionsMap', () => {
    it('maps API trigger paths', () => {
      const apiBlock = createApiBlock({
        id: 'api-1',
        properties: { isSynchronous: false, path: '/users', method: 'GET' },
      });

      const conn = createConnection({
        fromBlockId: 'api-1',
        toBlockId: 'fn-1',
        fromConnectorId: 'api-out-1',
        toConnectorId: 'input-1',
      });

      const inputConnections = buildInputConnectionsMap([conn], [apiBlock as any]);

      expect(inputConnections['/users']).toBe('input-1');
    });

    it('maps schedule triggers using title', () => {
      const scheduleBlock = createScheduleBlock({
        id: 'sched-1',
        title: 'DailyJob',
      });

      const conn = createConnection({
        fromBlockId: 'sched-1',
        toBlockId: 'fn-1',
        fromConnectorId: 'schedule-out-1',
        toConnectorId: 'input-1',
      });

      const inputConnections = buildInputConnectionsMap([conn], [scheduleBlock as any]);

      expect(inputConnections['DailyJob']).toBe('input-1');
    });
  });

  describe('buildInputSynchronousRecord', () => {
    it('sets true for synchronous API triggers', () => {
      const apiBlock = createApiBlock({
        id: 'api-1',
        properties: { isSynchronous: true, path: '/sync', method: 'POST' },
      });

      const conn = createConnection({
        fromBlockId: 'api-1',
        toBlockId: 'fn-1',
        fromConnectorId: 'api-out-1',
        toConnectorId: 'input-1',
      });

      const inputSynchronous = buildInputSynchronousRecord([conn], [apiBlock as any]);

      expect(inputSynchronous['input-1']).toBe(true);
    });
  });

  describe('buildOutputResponseRecord', () => {
    it('sets true for response block outputs', () => {
      const responseBlock = createResponseBlock({ id: 'resp-1' });

      const conn = createConnection({
        fromBlockId: 'fn-1',
        toBlockId: 'resp-1',
        fromConnectorId: 'out-1',
        toConnectorId: 'response-in-1',
      });

      const outputResponse = buildOutputResponseRecord([conn], [responseBlock as any]);

      expect(outputResponse['out-1']).toBe(true);
    });
  });
});
