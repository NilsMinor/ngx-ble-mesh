import { Packet } from '../packet';
import {
  MESSAGE_ID_SENDER,
  MESSAGE_SIZE_HANDSHAKE_SNOUNCE,
  MESSAGE_TYPE_ENCRYPT_CUSTOM_SNOUNCE,
  OFFSET_MESSAGE_BASE,
} from '../mesh-constants';

export class MeshHandshakeSnounce {
  packet: Packet;

  constructor(receiverId: number, anonce: number[]) {
    this.packet = new Packet(MESSAGE_SIZE_HANDSHAKE_SNOUNCE, MESSAGE_TYPE_ENCRYPT_CUSTOM_SNOUNCE);
    this.packet.set16Bit(1, MESSAGE_ID_SENDER);
    this.packet.set16Bit(3, receiverId);
    this.packet.set32Bit(OFFSET_MESSAGE_BASE, anonce[0]);
    this.packet.set32Bit(OFFSET_MESSAGE_BASE + 4, anonce[1]);
  }

  getPacket(): Uint8Array {
    return this.packet.getData();
  }
}
