import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import Base64 from 'react-native-base64';

// BLE UUID (아두이노 코드와 동일하게)
const SERVICE_UUID = "f6c2a2a7-2ac6-4b93-a34a-1eac0e7d9f77";
const UUID_RX =  "a0b1c4f9-6f26-4da3-8f79-a0c352b92604"; // 앱 → ESP32 (Write)
const UUID_TX = "3b9dbf27-0cd4-41b2-b2f8-7c781ffdd09e"; // ESP32 → 앱 (Notify)

let bleManager: BleManager | null = null;

export const useBLE = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [buttonPressed, setButtonPressed] = useState(false);

  useEffect(() => {
    if (!bleManager) {
      bleManager = new BleManager();
    }

    // 권한 요청 (Android)
    if (Platform.OS === 'android') {
      requestPermissions();
    }

    return () => {
      bleManager?.destroy();
      bleManager = null;
    };
  }, []);

  // 권한 요청
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      } else {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      }
    }
  };

  // BLE 스캔 시작
  const startScan = () => {
    if (!bleManager) return;

    setIsScanning(true);
    console.log('🔍 BLE 스캔 시작...');

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('❌ 스캔 에러:', error);
        setIsScanning(false);
        return;
      }

      // "Capstone-ESP32" 찾기
      if (device?.name === 'Capstone-ESP32') {
        console.log('✅ ESP32 발견:', device.name);
        bleManager?.stopDeviceScan();
        setIsScanning(false);
        connectToDevice(device);
      }
    });

    // 10초 후 자동 중지
    setTimeout(() => {
      if (isScanning) {
        bleManager?.stopDeviceScan();
        setIsScanning(false);
        console.log('⏱️ 스캔 타임아웃');
      }
    }, 10000);
  };

  // 디바이스 연결
  const connectToDevice = async (device: Device) => {
    try {
      console.log('🔗 연결 시도:', device.id);

      const connected = await device.connect();
      console.log('✅ 연결 성공');

      await connected.discoverAllServicesAndCharacteristics();
      console.log('🔍 서비스 탐색 완료');

      setConnectedDevice(connected);

      // TX (ESP32 → 앱 Notify) 구독
      await subscribeToNotifications(connected);

      console.log('🎉 ESP32 연결 완료!');
    } catch (error) {
      console.error('❌ 연결 실패:', error);
    }
  };

  // ESP32에서 오는 Notify 수신 (버튼 이벤트)
  const subscribeToNotifications = async (device: Device) => {
    try {
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        UUID_TX,
        (error, characteristic) => {
          if (error) {
            console.error('❌ Notify 에러:', error);
            return;
          }

          if (characteristic?.value) {
            // Base64 디코딩
            const decoded = Base64.decode(characteristic.value);
            console.log('📩 ESP32에서 수신:', decoded);

            if (decoded === 'BUTTON_PRESSED') {
              console.log('🔘 버튼 눌림 이벤트 감지!');
              setButtonPressed(true);
              
              // 0.5초 후 리셋 (다음 이벤트를 위해)
              setTimeout(() => setButtonPressed(false), 500);
            }
          }
        }
      );
      console.log('✅ Notify 구독 완료');
    } catch (error) {
      console.error('❌ Notify 구독 실패:', error);
    }
  };

  // 앱 → ESP32 데이터 전송 (RX Write)
  const sendData = async (jsonString: string) => {
    if (!connectedDevice) {
      console.error('❌ 연결된 디바이스 없음');
      return;
    }

    try {
      // JSON을 Base64로 인코딩
      const base64Data = Base64.encode(jsonString);
      
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        UUID_RX,
        base64Data
      );

      console.log('✅ ESP32로 전송 완료:', jsonString);
    } catch (error) {
      console.error('❌ 전송 실패:', error);
    }
  };

  // 연결 해제
  const disconnect = async () => {
    if (connectedDevice) {
      try {
        await connectedDevice.cancelConnection();
        setConnectedDevice(null);
        console.log('🔌 연결 해제됨');
      } catch (error) {
        console.error('❌ 연결 해제 실패:', error);
      }
    }
  };

  return {
    isScanning,
    connectedDevice,
    buttonPressed,
    startScan,
    disconnect,
    sendData,
  };
};