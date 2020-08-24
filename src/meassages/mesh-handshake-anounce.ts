import { Packet } from '../packet';
import { OFFSET_MESSAGE_BASE } from '../mesh-constants';

export class MeshHandshakeAnounce {
  packet: Packet;
  senderID: number;
  receiverID: number;
  anonce: number[] = [];

  constructor(data: Uint8Array) {
    this.packet = new Packet();
    this.packet.setData(data);

    this.senderID = this.packet.get16Bit(1);
    this.receiverID = this.packet.get16Bit(3);
    this.anonce[0] = this.packet.get32Bit(OFFSET_MESSAGE_BASE);
    this.anonce[1] = this.packet.get32Bit(OFFSET_MESSAGE_BASE + 4);

    console.log(this.senderID, this.receiverID, this.anonce);
  }

  getSenderID(): number {
    return this.senderID;
  }

  getReceiverID(): number {
    return this.receiverID;
  }

  getAnonce(): number[] {
    return this.anonce;
  }
}
