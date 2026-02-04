import { QueueProperties } from "../blocks/QueueBlock";
import { Connection, PendingConnection } from "./Connection";

export interface QueuedConnection extends Connection {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  fromConnectorId: string;
  toConnectorId: string;
  isTemporary: boolean;
  connectionType: 'queue';
  properties?: QueueProperties;
}

export interface PendingQueuedConnection extends PendingConnection {
  connectionType: 'queue';
  properties?: QueueProperties;
}