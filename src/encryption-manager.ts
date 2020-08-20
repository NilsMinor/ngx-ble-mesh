import { MeshHandshakeAnounce } from '../meassages/mesh-handshake-anounce';
import { MESSAGE_ID_SENDER, MIC_LENGTH, NETWORK_KEY } from './mesh-constants';
import { copyUint8Array, getDataAsString, incrementUint, Packet, xorData } from './packet';
import * as CryptoJS from 'crypto-js';

export class EncryptionManager {
  private encryptionNounce: number[] = [];
  private decryptionNounce: number[] = [];
  private partnerId = 0;
  private sessionDecryptionKey: Uint8Array = new Uint8Array(4);
  private sessionEncryptionKey: Uint8Array = new Uint8Array(4);
  private networkKey: Uint8Array = new Uint8Array(16);

  constructor(message?: MeshHandshakeAnounce) {
    this.networkKey.fill(NETWORK_KEY);

    if (message) {
      this.partnerId = message.getSenderID();
      this.encryptionNounce = message.getAnonce();
      //  no random value is used in the android example
      // therefore it uses the encryptionNounce as decryptionNounce

      this.decryptionNounce = this.encryptionNounce;

      this.sessionEncryptionKey = this.generateSessionKey(this.encryptionNounce);
      this.sessionDecryptionKey = this.generateSessionKey(this.decryptionNounce);

      console.log(this.sessionEncryptionKey, this.sessionDecryptionKey);
    } else {
      // for testing purpose only
      const anonce = [0xe636c8d8, 0xf39be82c];
      const snonce = [0x8787750e, 0x0476f886];

      this.encryptionNounce = anonce;
      this.decryptionNounce = snonce;
      this.sessionEncryptionKey = this.generateSessionKey(this.encryptionNounce, 1);
      this.sessionDecryptionKey = this.generateSessionKey(this.decryptionNounce, 1);

      // console.log('testData ', getDataAsString('hex', testData));

      // const encryptedData = this.encryptMessage(testData);
      // console.log('encryptedData ', getDataAsString('hex', encryptedData));

      // const decryptedData = this.decryptMessage(encryptedData);
      // console.log('decryptedData ', getDataAsString('hex', decryptedData));
    }
  }

  public getDecryptionNounce(): number[] {
    return this.decryptionNounce;
  }

  public generateSessionKey(nounce: number[], nodeId?: number): Uint8Array {
    const packet = new Packet(16);
    if (nodeId) {
      packet.set16Bit(0, nodeId);
    } else {
      packet.set16Bit(0, MESSAGE_ID_SENDER);
    }

    packet.set32Bit(2, nounce[0]);
    packet.set32Bit(6, nounce[1]);

    return this.encrypt(this.networkKey, packet.getData());
  }

  public decryptMessage(data: Uint8Array): Uint8Array {
    const dataCopy = new Uint8Array(data.buffer.slice(0));

    // generate keyStream1
    const decryptionNounce = new Packet(16);
    decryptionNounce.set32Bit(0, this.decryptionNounce[0]);
    decryptionNounce.set32Bit(4, this.decryptionNounce[1]);
    const keyStream1 = this.encrypt(this.sessionDecryptionKey, decryptionNounce.getData());
    this.decryptionNounce[1] = incrementUint(this.decryptionNounce[1]);

    decryptionNounce.set32Bit(0, this.decryptionNounce[0]);
    decryptionNounce.set32Bit(4, this.decryptionNounce[1]);

    const keyStream2 = this.encrypt(this.sessionDecryptionKey, decryptionNounce.getData());
    this.decryptionNounce[1] = incrementUint(this.decryptionNounce[1]);

    const receivedMIC = data.slice(data.length - MIC_LENGTH, data.length);
    console.log('receivedMIC ', getDataAsString('hex', receivedMIC));
    console.log('keyStream1 ', getDataAsString('hex', keyStream1));
    console.log('keyStream1 ', getDataAsString('hex', keyStream1));
    console.log('keyStream2 ', getDataAsString('hex', keyStream2));

    xorData(keyStream1, data, data.length - MIC_LENGTH);
    const clearText1 = copyUint8Array(data, data.length - MIC_LENGTH);
    const clearText2 = copyUint8Array(clearText1);

    xorData(keyStream1, clearText1);
    //xorData(keyStream2, clearText2);

    // check mic
    return clearText1;
  }

  public encryptMessage(data: Uint8Array): Uint8Array {
    // Generate keyStream1 with nonce
    const clearText = new Uint8Array(data.buffer.slice(0));
    const ciphertext = new Uint8Array(data.buffer.slice(0));
    const encryptionNounce = new Packet(16);
    encryptionNounce.set32Bit(0, this.encryptionNounce[0]);
    encryptionNounce.set32Bit(4, this.encryptionNounce[1]);

    console.log('using nonce ', this.encryptionNounce[1]);
    const keyStream1 = this.encrypt(this.sessionEncryptionKey, encryptionNounce.getData());
    console.log('keystream1', getDataAsString('hex', keyStream1));
    xorData(keyStream1, ciphertext);

    this.encryptionNounce[1] = incrementUint(this.encryptionNounce[1]);

    encryptionNounce.set32Bit(0, this.encryptionNounce[0]);
    encryptionNounce.set32Bit(4, this.encryptionNounce[1]);

    console.log('using nonce ', this.encryptionNounce[1]);
    const keyStream2 = this.encrypt(this.sessionEncryptionKey, encryptionNounce.getData());

    this.encryptionNounce[1] = incrementUint(this.encryptionNounce[1]);

    console.log('keystream2', getDataAsString('hex', keyStream2));

    // xor data with keystream

    xorData(keyStream2, clearText);

    const mic = new Uint8Array(4);
    mic.set(this.encrypt(this.sessionEncryptionKey, clearText).slice(0, 4));

    console.log('calculated mic : ', getDataAsString('hex', mic));

    const encryptedData = new Uint8Array(ciphertext.length + mic.length);
    encryptedData.set(ciphertext);
    encryptedData.set(mic, ciphertext.length);

    return encryptedData;
  }
  /**
   * Convert a WordArray to Uint8Array.
   * @param data - WordArray eq. encrypted.ciphertext
   * @param formatEndian - if set the data array will interpreted with reversed bytes
   */
  private wordArrayToUint8Array(data: any, formatEndian: boolean = true): Uint8Array {
    const encryptedArray32 = Uint32Array.from(data.words);
    const dataArray = new Uint8Array(encryptedArray32.buffer);

    const formatedArray: Uint8Array = new Uint8Array(dataArray.length);

    if (formatEndian) {
      let counter = 3;
      let index2 = 0;
      dataArray.forEach((a, index) => {
        const l = counter - index2++;
        formatedArray[index] = dataArray[l];

        if ((index + 1) % 4 === 0) {
          counter += 4;
          index2 = 0;
        }
      });
    } else {
      formatedArray.set(dataArray);
    }
    return formatedArray;
  }

  /**
   * Encode a Uint8Array to an encoded string
   * @param data - Uint8Array data (Hex)
   */
  private encodeUint8Array(data: Uint8Array): WordArray {
    const arrayToString = (arr) => arr.reduce((str, code) => str + String.fromCharCode(code), '');
    return CryptoJS.enc.Latin1.parse(arrayToString(data));
  }

  /** DOES NOT WORK !!!!
   * Encrypt a data packet using ECB/NoPadding using networkKey
   * @param key - encryption key
   * @param encrypted - encrypted data packet
   */
  public decrypt(key: Uint8Array, encrypted: Uint8Array): Uint8Array {
    const decKey = this.encodeUint8Array(key);
    const encEncrypted = this.encodeUint8Array(encrypted);

    const decrypted = CryptoJS.AES.decrypt(
      CryptoJS.enc.Latin1.stringify(encEncrypted),
      CryptoJS.enc.Latin1.stringify(decKey),
      {
        iv: CryptoJS.enc.Latin1.parse('00000000000000000000000000000000'),
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding,
      },
    );

    return this.wordArrayToUint8Array(decrypted);
    const decryptedArray32 = Uint32Array.from(decrypted.words);
    return new Uint8Array(decryptedArray32.buffer);
  }
}
