export interface Connection {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  fromConnectorId: string;
  toConnectorId: string;
  isTemporary: boolean;
  connectionType: ConnectionType;
}

export interface PendingConnection extends Partial<Connection> {
  fromBlockId: string;
  fromConnectorId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isTemporary: true;
  connectionType: 'regular' | 'queue';
}

export type ConnectionType = 'regular' | 'queue';