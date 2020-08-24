import { Injectable } from '@angular/core';
import { MeshHandshakeStart } from './meassages/mesh-handshake-start';
import { WriteCharacteristicParams } from 'ionic-plugin-bluetoothle/src/@ionic-native/plugins/bluetooth-le/index';
import { MeshHandshakeSnounce } from './meassages/mesh-handshake-snounce';
import { MeshHandshakeAnounce } from './meassages/mesh-handshake-anounce';
import { FruityMeshConnectionState, FruityMeshGATTServiceDefinition, FruityMeshServiceUUID } from './fruity-mesh';
import {
  MIN_RSSI_THRESHOLD,
  MESSAGE_TYPE_ENCRYPT_CUSTOM_ANOUNCE,
  MESSAGE_TYPE_ENCRYPT_CUSTOM_SNOUNCE,
  MESSAGE_TYPE_ENCRYPT_CUSTOM_DONE,
  MAX_DATA_LENGTH_ENCRYPTED,
  MAX_DATA_LENGTH,
  AUTH_TYPE_NETWORKKEY,
  MESH_ADV_SERVICE_ID,
} from './mesh-constants';
import { BehaviorSubject, Observable } from 'rxjs';
import { MeshDevice } from './mesh-device';
import { EncryptionManager } from './encryption-manager';
import { BluetoothLE, DescriptorParams, OperationResult, ScanStatus } from '@ionic-native/bluetooth-le/ngx';
import { getMessageType, getDataAsString } from './packet';

@Injectable({
  providedIn: 'root',
})
export class MeshService {
  isScanning = false;
  scanList: BehaviorSubject<MeshDevice[]> = new BehaviorSubject<MeshDevice[]>([]);
  encryptionManager: EncryptionManager;

  constructor(public ble: BluetoothLE) {
    this.ble.initialize().subscribe((b: { status: any }) => {
      console.log('ble', b.status); // logs 'enabled'
    });
  }

  public subscribeScanList(): Observable<MeshDevice[]> {
    return this.scanList.asObservable();
  }

  public scan(timeout: number, autoConnect?: boolean): void {
    this.scanList.next([]);
    this.isScanning = true;
    this.ble.startScan({}).subscribe((scanStatus: any) => {
      this.addToScanList(scanStatus, MIN_RSSI_THRESHOLD);
    });
    setTimeout(() => {
      this.ble.stopScan().then((s: any) => {
        this.isScanning = false;

        if (autoConnect && this.scanList.getValue().length > 0) {
          this.connect(this.scanList.getValue()[0]);
        }
      });
    }, timeout);
  }

  public connect(device: MeshDevice): void {
    this.updateConnectionState(device, FruityMeshConnectionState.IS_CONNECTING);

    const params: DescriptorParams = {
      address: device.deviceInfo.address,
      characteristic: FruityMeshGATTServiceDefinition.READ_CONNECTION,
      service: FruityMeshServiceUUID,
    };

    this.ble.connect({ address: device.deviceInfo.address }).subscribe(
      (deviceInfo: any) => {
        console.log('connect response', deviceInfo);
        this.ble
          .discover({ address: device.deviceInfo.address })
          .then((value: any) => {
            console.log('discover response', value);
            this.ble.subscribe(params).subscribe(
              (operationResult: { value: any }) => {
                console.log('subscribe response  ', operationResult);
                if (!operationResult.value) {
                  this.startHandShake(device);
                } else {
                  this.handleNotificationMessage(device, operationResult);
                }
              },
              (error: any) => {
                console.log('subscribe error', error);
                this.updateConnectionState(device, FruityMeshConnectionState.IS_DISCONNECTED);
              },
            );
          })
          .catch((reason: any) => {
            console.log('discover error', reason);
            this.updateConnectionState(device, FruityMeshConnectionState.IS_DISCONNECTED);
          });
      },
      (error: any) => {
        console.log('connect error', error);
      },
    );
  }

  private handleNotificationMessage(device: MeshDevice, operationResult: OperationResult): void {
    if (operationResult && operationResult.value) {
      const data = this.ble.encodedStringToBytes(operationResult.value);
      console.log('received notification message', data);
      if (data) {
        switch (getMessageType(data)) {
          case MESSAGE_TYPE_ENCRYPT_CUSTOM_ANOUNCE:
            console.log('message type is ANOUNCE');
            const msgAnounce = new MeshHandshakeAnounce(data);
            this.encryptionManager = new EncryptionManager(msgAnounce);
            const msgSnounce = new MeshHandshakeSnounce(
              msgAnounce.getReceiverID(),
              this.encryptionManager.getDecryptionNounce(),
            );
            this.sendBleMessage(device, msgSnounce.getPacket(), true);
            break;
          case MESSAGE_TYPE_ENCRYPT_CUSTOM_SNOUNCE:
            console.log('message type is SNOUNCE');
            break;
          case MESSAGE_TYPE_ENCRYPT_CUSTOM_DONE:
            console.log('message type is DONE');
            break;
          default:
            // dead data packet
            console.log('wrong data', getDataAsString('hex', data));
            break;
        }
      }
    }
  }

  private sendBleMessage(device: MeshDevice, data: Uint8Array, isEncrypted: boolean): void {
    if (data !== null && data.length > 0) {
      const maxLength = isEncrypted ? MAX_DATA_LENGTH_ENCRYPTED : MAX_DATA_LENGTH;
      if (data.length <= maxLength) {
        this.writeCharacteristic(device, isEncrypted ? this.encryptionManager.encryptMessage(data) : data);
      } else {
        console.log('data length is ' + data.length + ' message splitting not implemented');
      }
    }
  }

  private writeCharacteristic(device: MeshDevice, data: Uint8Array): void {
    const encodedString = this.ble.bytesToEncodedString(data);

    const params: WriteCharacteristicParams = {
      value: encodedString,
      service: FruityMeshServiceUUID,
      type: 'noResponse',
      address: device.deviceInfo.address,
      characteristic: FruityMeshGATTServiceDefinition.WRITE_CONNECTION,
    };

    this.ble
      .write(params)
      .then((dataRead: any) => {
        console.log('write characteristic', getDataAsString('hex', data), dataRead);
      })
      .catch((error: any) => console.log('error write characteristic', error));
  }

  private startHandShake(device: MeshDevice): void {
    console.log('start handshake');

    const meshHandShakeStart = new MeshHandshakeStart(AUTH_TYPE_NETWORKKEY);
    // const bytes = this.ble.stringToBytes(s);
    const encodedString = this.ble.bytesToEncodedString(meshHandShakeStart.packet.getData());

    const writeParams: WriteCharacteristicParams = {
      service: FruityMeshServiceUUID,
      address: device.deviceInfo.address,
      characteristic: FruityMeshGATTServiceDefinition.WRITE_CONNECTION,
      value: encodedString,
    };
    this.ble
      .write(writeParams)
      .then((writeResponse: any) => {
        console.log('writeResponse response', writeResponse);
      })
      .catch((reason: any) => {
        console.log('writeResponse error', reason);
      });
  }

  /**
   * Update device in scan list
   * @param device - device to update
   */
  private updateDeviceInList(device: MeshDevice): void {
    const list = this.scanList.getValue();
    const index = list.findIndex(
      (d: { deviceInfo: { address: any } }) => d.deviceInfo.address === device.deviceInfo.address,
    );
    if (index >= 0) {
      list[index] = device;
      this.scanList.next(list);
    }
  }

  /**
   * Update the connection state of a device in the scan list
   * @param device - device to update
   * @param state - connection state
   */
  private updateConnectionState(device: MeshDevice, state: FruityMeshConnectionState): void {
    device.connectionState = state;
    this.updateDeviceInList(device);
  }

  /** This function checks whether a connection was established before
   * and needs to be closed in order to connect again
   *
   * @param addr - device address
   */
  private checkIfConnectionShouldBeClosed(addr: string): void {
    this.ble
      .wasConnected({ address: addr })
      .then((prevConnection: { wasConnected: any; name: any }) => {
        if (prevConnection.wasConnected) {
          console.log('device was connected before', prevConnection.name);
          this.ble
            .close({ address: addr })
            .then((value: any) => {
              console.log('close', value);
            })
            .catch((reason: any) => {
              console.log('close error', reason);
            });
        }
      })
      .catch((reason: any) => {
        // device was not connected, no need to close the connection
      });
  }

  /**
   * Add a scanned device to the scan list
   * @param info - scan info
   * @param minRssi - min rssi threshold
   */
  private addToScanList(info: ScanStatus, minRssi: number): void {
    // check if device was connected before
    this.checkIfConnectionShouldBeClosed(info.address);

    const list = this.scanList.getValue();

    if (!list.find((d: { deviceInfo: { address: any } }) => d.deviceInfo.address === info.address)) {
      // check for duplicates
      // console.log('add device ', info);

      const d = new MeshDevice();
      d.deviceInfo = info;
      d.rssi = info.rssi;
      d.connectionState = FruityMeshConnectionState.IS_DISCONNECTED;
      if (d.rssi > minRssi) {
        if (info.advertisement) {
          const serviceUUIDs = info.advertisement['serviceUuids'] as string[];
          if (serviceUUIDs && serviceUUIDs.length > 0) {
            if (serviceUUIDs[0].includes(MESH_ADV_SERVICE_ID)) {
              list.push(d);
            }
          }
        }
      }
    } else {
      // device exists
    }

    this.scanList.next(list);
  }
}
