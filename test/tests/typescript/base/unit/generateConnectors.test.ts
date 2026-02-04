import {
  describe,
  expect,
  it
} from 'vitest';

import { generateConnectorsInterfacesAndType } from '../../../../../lib/typescript/common/generateConnectorsInterfacesAndType';
import { createConnector } from '../../../fixtures/blocks';

describe('generateConnectorsInterfacesAndType', () => {
  it('generates a single interface declaration', () => {
    const connectors = [createConnector({ id: 'c1', name: 'default in' })];
    const result = generateConnectorsInterfacesAndType(connectors, 'Input');

    expect(result.interfaces).toEqual(['DefaultIn']);
    expect(result.interfacesDeclarations).toHaveLength(1);
    expect(result.interfacesDeclarations[0]).toContain('export interface DefaultIn');
  });

  it('generates union type for multiple connectors', () => {
    const connectors = [
      createConnector({ id: 'c1', name: 'first' }),
      createConnector({ id: 'c2', name: 'second' }),
    ];
    const result = generateConnectorsInterfacesAndType(connectors, 'Output');

    expect(result.interfaces).toEqual(['First', 'Second']);
    expect(result.interfaceTypesDeclaration).toContain('First | Second');
    expect(result.namesDeclaration).toContain("'First' | 'Second'");
  });

  it('returns empty results for no connectors', () => {
    const result = generateConnectorsInterfacesAndType([], 'Input');

    expect(result.interfaces).toEqual([]);
    expect(result.interfacesDeclarations).toEqual([]);
    expect(result.names).toEqual([]);
  });

  it('uses PascalCase for interface names', () => {
    const connectors = [createConnector({ id: 'c1', name: 'my custom input' })];
    const result = generateConnectorsInterfacesAndType(connectors, 'Input');

    expect(result.interfaces[0]).toBe('MyCustomInput');
    expect(result.names[0]).toBe('MyCustomInput');
  });

  it('sets correct type and names type labels', () => {
    const connectors = [createConnector({ id: 'c1', name: 'test' })];
    const result = generateConnectorsInterfacesAndType(connectors, 'Output');

    expect(result.namesType).toBe('OutputNames');
    expect(result.interfacesType).toBe('Outputs');
  });
});
