import { DeviceInfo } from '@ionic-native/bluetooth-le/ngx';

export const FruityMeshServiceUUID = '00000001-ACCE-423C-93FD-0C07A0051858';

export enum FruityMeshGATTServiceDefinition {
  BASE_CONNECTION = '00000001-ACCE-423C-93FD-0C07A0051858',
  WRITE_CONNECTION = '00000002-ACCE-423C-93FD-0C07A0051858',
  READ_CONNECTION = '00000003-ACCE-423C-93FD-0C07A0051858',
}

export enum FruityMeshConnectionState {
  IS_CONNECTED,
  IS_CONNECTING,
  IS_DISCONNECTED,
}

export class MeshDevice {
  deviceInfo: DeviceInfo;
  connectionState: FruityMeshConnectionState;
  rssi: number;
}

export enum BleCharacteristicProperty {
  READ = 'Read',
  WRITE = 'Write',
  NOTIFY = 'Notify',
  WRITE_NO_RESPONSE = 'WriteWithoutResponse',
}

export const NODE_ID_APP_BASE = 32000;
export const TUNNEL_TYPE_REMOTE_MESH = 1;

export enum FruityMeshEncryptionMessageType {
  START = 25,
  ANONCE = 26,
  SNONCE = 27,
  DONE = 28,
}
