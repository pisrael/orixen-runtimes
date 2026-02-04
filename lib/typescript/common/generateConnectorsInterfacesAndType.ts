import { BlockConnector } from '../../types/blocks/Block';
import { toPascalCase } from '../../utils';
import { ParsedConnectors } from './types';

export function generateConnectorsInterfacesAndType(
  connectors: BlockConnector[],
  type: 'Input' | 'Output'
): ParsedConnectors {
  const interfacesDeclarations: string[] = [];
  const namesType = `${type}Names`;
  const interfacesType = `${type}s`;
  let namesDeclaration = `export type ${namesType} = `;
  let interfaceTypesDeclaration = `export type ${interfacesType} = `;
  const names: string[] = [];
  const interfaces: string[] = [];

  for (let i = 0; i < connectors.length; i++) {
    const connector = connectors[i];
    const connectorNamePascalCase = toPascalCase(connector.name);

    const interfaceName = connectorNamePascalCase;
    interfacesDeclarations.push(`export interface ${interfaceName} {\n  data: any;\n}`);
    namesDeclaration += `'${connectorNamePascalCase}'`;
    interfaceTypesDeclaration += interfaceName;
    names.push(connectorNamePascalCase);
    interfaces.push(interfaceName);

    if (i < connectors.length - 1) {
      namesDeclaration += ' | ';
      interfaceTypesDeclaration += ' | ';
    }
  }

  return {
    interfacesDeclarations,
    namesDeclaration,
    interfaceTypesDeclaration,
    interfaces,
    names,
    namesType,
    interfacesType,
  };
}
