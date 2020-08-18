import { Packet, getDataAsString } from './../packet';

describe('packet test', () => {
  const p = new Packet(8);
  p.set8Bit(0, 0x12);
  p.set8Bit(1, 0x34);
  p.set16Bit(2, 0x5678);
  p.set32Bit(4, 0x9abcdef0);

  test('create packet test string', () => {
    const data: string = getDataAsString('hex', p.getData());

    expect(data).toBe('(8) : 12 34 78 56 F0 DE BC 9A');
  });

  test('get packet data', () => {
    expect(p.get8Bit(0)).toBe(0x12);
    expect(p.get8Bit(1)).toBe(0x34);
    expect(p.get16Bit(2)).toBe(0x5678);
    expect(p.get32Bit(4)).toBe(0x9abcdef0);
  });
});
