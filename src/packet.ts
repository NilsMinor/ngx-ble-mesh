import { MESSAGE_ID_SENDER, MESSAGE_ID_UNKOWN } from './mesh-constants';

export class Packet {
  data!: Uint8Array;

  constructor(size?: number, msgType?: number) {
    if (size && msgType) {
      this.init(size, msgType);
    } else if (size) {
      this.clear(size);
    }
  }

  public set8Bit(index: number, value: number): void {
    if (this.sizeOk(index)) {
      this.data[index] = value & 0xff;
    }
  }

  public get8Bit(index: number): number {
    if (this.sizeOk(index)) {
      return this.data[index] & 0xff;
    }
    return 0;
  }

  public set16Bit(index: number, value: number): void {
    if (this.sizeOk(index + 1)) {
      const n = new DataView(this.data.buffer);
      n.setUint16(index, value, true);
    }
  }

  public get16Bit(index: number): number {
    if (this.sizeOk(index + 1)) {
      const n = new DataView(this.data.buffer);
      return n.getUint16(index, true);
    }
    return 0;
  }

  public set32Bit(index: number, value: number): void {
    if (this.sizeOk(index + 3)) {
      const n = new DataView(this.data.buffer);
      n.setUint32(index, value, true);
    }
  }

  public get32Bit(index: number): number {
    if (this.sizeOk(index + 3)) {
      const n = new DataView(this.data.buffer);
      return n.getUint32(index, true);
    }
    return 0;
  }

  public setTunnelType(index: number, value: number) {
    this.data[index] = value & 0x3;
  }

  private init(size: number, msgType: number): void {
    this.clear(size);
    // u8 messageType
    this.set8Bit(0, msgType);
    // u16 senderId
    this.set16Bit(1, MESSAGE_ID_SENDER);
    // u16 receiverId
    this.set16Bit(3, MESSAGE_ID_UNKOWN);
  }

  public setData(data: Uint8Array): void {
    this.data = data;
  }

  public getData(): Uint8Array {
    return this.data;
  }

  public print(type?: string): void {
    console.log('data is : ', this.getData());
  }

  public clear(size: number): void {
    this.data = new Uint8Array(size);
  }

  private sizeOk(index: number): boolean {
    return index <= this.data.length;
  }

  public getDataAsString(format?: string): string {
    return getDataAsString(format, this.getData());
  }
}

export function getMessageType(bytes: Uint8Array): number {
  if (bytes && bytes.length > 1) {
    return bytes[0];
  }
  return 0;
}

export function getDataAsString(format?: string, data?: Uint8Array): string {
  if (format === 'hex') {
    let str = '';

    if (data) {
      data.forEach((d, index) => {
        str += d.toString(16).toLocaleUpperCase();
        if (index < data.length - 1) {
          str += ' ';
        }
      });
      return '(' + data.length + ') : ' + str;
    }
  }
  return 'error';
}

export function copyUint8Array(arr: Uint8Array, range?: number): Uint8Array {
  return range ? arr.slice(0, range) : arr.slice(0);
}

export function incrementUint(value: number): number {
  return value++ === 4294967296 ? 0 : value;
}

export function xorData(key: Uint8Array, data: Uint8Array, length?: number): void {
  if (length) {
    for (let index = 0; index !== length; index++) {
      data[index] = data[index] ^ key[index];
    }
  } else {
    data.forEach((d, index) => {
      data[index] = data[index] ^ key[index];
    });
  }
}
