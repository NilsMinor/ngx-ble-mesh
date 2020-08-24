import { Packet } from '../packet';
import {
  MESH_ACCESS_TUNNEL_TYPE_REMOTE_MESH,
  MESSAGE_ENCRYPTION_VERSION,
  MESSAGE_SIZE_HANDSHAKE_START,
  MESSAGE_TYPE_ENCRYPT_CUSTOM_START,
  OFFSET_MESSAGE_BASE,
} from '../mesh-constants';

export class MeshHandshakeStart {
  packet: Packet;

  constructor(keyId: number) {
    this.packet = new Packet(MESSAGE_SIZE_HANDSHAKE_START, MESSAGE_TYPE_ENCRYPT_CUSTOM_START);
    this.packet.set8Bit(OFFSET_MESSAGE_BASE, MESSAGE_ENCRYPTION_VERSION);
    // u32 keyId
    this.packet.set32Bit(OFFSET_MESSAGE_BASE + 1, keyId);
    // u8 : 2  tunnelType
    this.packet.setTunnelType(OFFSET_MESSAGE_BASE + 5, MESH_ACCESS_TUNNEL_TYPE_REMOTE_MESH);
  }
  getPacket(): Uint8Array {
    return this.packet.getData();
  }
}
