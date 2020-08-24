import { AUTH_TYPE_NETWORKKEY } from './../mesh-constants';
import { MeshHandshakeSnounce } from './../meassages/mesh-handshake-snounce';
import { MeshHandshakeStart } from './../meassages/mesh-handshake-start';
import { Packet, getDataAsString } from './../packet';

// describe('packet test', () => {
//   const p = new Packet(8);
//   p.set8Bit(0, 0x12);
//   p.set8Bit(1, 0x34);
//   p.set16Bit(2, 0x5678);
//   p.set32Bit(4, 0x9abcdef0);

//   test('create packet test string', () => {
//     const data: string = getDataAsString('hex', p.getData());

//     expect(data).toBe('(8) : 12 34 78 56 F0 DE BC 9A');
//   });

//   test('get packet data', () => {
//     expect(p.get8Bit(0)).toBe(0x12);
//     expect(p.get8Bit(1)).toBe(0x34);
//     expect(p.get16Bit(2)).toBe(0x5678);
//     expect(p.get32Bit(4)).toBe(0x9abcdef0);
//   });
// });

describe('message test', () => {
  const messageStart = new MeshHandshakeStart(AUTH_TYPE_NETWORKKEY);

  test('test MeshHandshakeStart', () => {
    const data: string = getDataAsString('hex', messageStart.getPacket());
    expect(data).toBe('(11) : 19 0 7D 0 0 1 2 0 0 0 1');
  });

  // const receiverId = 1;
  // const anonce = [0xe636c8d8, 0xf39be82c];
  // const messageHandshake = new MeshHandshakeSnounce(receiverId, anonce);

  // test('test MeshHandshakeSnounce', () => {
  //   const data: string = getDataAsString('hex', messageHandshake.getPacket());
  //   expect(data).toBe('(13) : 1B 0 7D 1 0 D8 C8 36 E6 2C E8 9B F3');
  // });
});
