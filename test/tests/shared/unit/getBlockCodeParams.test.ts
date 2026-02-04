import {
  describe,
  expect,
  it
} from 'vitest';

import { getBlockCodeParams } from '../../../../lib/utils/getBlockCodeParams';
import {
  createApiBlock,
  createFunctionBlock,
  createQueueBlock
} from '../../fixtures/blocks';
import { createConnection } from '../../fixtures/connections';

describe('getBlockCodeParams', () => {
  it('separates input and output connections for a block', () => {
    const fnBlock = createFunctionBlock({ id: 'fn-1' });
    const apiBlock = createApiBlock({ id: 'api-1' });
    const queueBlock = createQueueBlock({ id: 'queue-1' });

    const inConn = createConnection({
      id: 'c1',
      fromBlockId: 'api-1',
      toBlockId: 'fn-1',
      fromConnectorId: 'api-out-1',
      toConnectorId: 'input-1',
    });
    const outConn = createConnection({
      id: 'c2',
      fromBlockId: 'fn-1',
      toBlockId: 'queue-1',
      fromConnectorId: 'output-1',
      toConnectorId: 'queue-in-1',
    });

    const result = getBlockCodeParams(
      fnBlock as any,
      [inConn, outConn],
      [fnBlock as any, apiBlock as any, queueBlock as any]
    );

    expect(result.inputConnections).toHaveLength(1);
    expect(result.inputConnections[0].id).toBe('c1');
    expect(result.outputConnections).toHaveLength(1);
    expect(result.outputConnections[0].id).toBe('c2');
  });

  it('identifies input blocks and output blocks', () => {
    const fnBlock = createFunctionBlock({ id: 'fn-1' });
    const apiBlock = createApiBlock({ id: 'api-1' });
    const queueBlock = createQueueBlock({ id: 'queue-1' });

    const inConn = createConnection({
      fromBlockId: 'api-1',
      toBlockId: 'fn-1',
    });
    const outConn = createConnection({
      fromBlockId: 'fn-1',
      toBlockId: 'queue-1',
    });

    const result = getBlockCodeParams(
      fnBlock as any,
      [inConn, outConn],
      [fnBlock as any, apiBlock as any, queueBlock as any]
    );

    expect(result.inputBlocks).toHaveLength(1);
    expect(result.inputBlocks[0].id).toBe('api-1');
    expect(result.outputBlocks).toHaveLength(1);
    expect(result.outputBlocks[0].id).toBe('queue-1');
  });

  it('handles block with no connections', () => {
    const fnBlock = createFunctionBlock({ id: 'fn-1' });

    const result = getBlockCodeParams(fnBlock as any, [], [fnBlock as any]);

    expect(result.inputConnections).toHaveLength(0);
    expect(result.outputConnections).toHaveLength(0);
    expect(result.inputBlocks).toHaveLength(0);
    expect(result.outputBlocks).toHaveLength(0);
  });

  it('returns the block and its language', () => {
    const fnBlock = createFunctionBlock({ id: 'fn-1' });
    const result = getBlockCodeParams(fnBlock as any, [], []);
    expect(result.block.id).toBe('fn-1');
    expect(result.codeLanguage).toBe('typescript');
  });
});
