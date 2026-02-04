import { Connection } from '../../../lib';

export function createConnection(overrides?: Partial<Connection>): Connection {
  return {
    id: 'conn-1',
    fromBlockId: 'block-1',
    toBlockId: 'block-2',
    fromConnectorId: 'from-conn-1',
    toConnectorId: 'to-conn-1',
    isTemporary: false,
    connectionType: 'regular',
    ...overrides,
  };
}

export function createQueueConnection(overrides?: Partial<Connection>): Connection {
  return {
    id: 'queue-conn-1',
    fromBlockId: 'block-1',
    toBlockId: 'block-2',
    fromConnectorId: 'from-conn-1',
    toConnectorId: 'to-conn-1',
    isTemporary: false,
    connectionType: 'queue',
    ...overrides,
  };
}
