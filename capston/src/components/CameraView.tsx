import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useCamera } from '../hooks/useCamera';
import RNFS from 'react-native-fs';

type Props = {
  onPhotoTaken: (photoPath: string) => void;
  cameraRef?: React.RefObject<Camera | null>;
  onButtonPressed?: () => void;
  buttonPressed?: boolean;  // HomePage에서 전달받음
};

export const CameraView: React.FC<Props> = ({ 
  onPhotoTaken, 
  cameraRef, 
  onButtonPressed,
  buttonPressed 
}) => {
  const permission = useCamera();
  const devices = useCameraDevices();
  const backCamera = devices.find(device => device.position === 'back');
  const [cameraReady, setCameraReady] = useState(false);

  // ESP32 버튼 눌림 이벤트 감지 (props로 받음)
  useEffect(() => {
    if (buttonPressed && onButtonPressed) {
      console.log('📱 CameraView: 버튼 이벤트 감지 → 자동 촬영 트리거');
      onButtonPressed();
    }
  }, [buttonPressed, onButtonPressed]);

  const takePhoto = async () => {
    console.log('1');
    if (!cameraRef?.current) return;
    console.log('2');
    try {
      const photo = await cameraRef.current.takePhoto();
      if (photo.path) {
        // 사진 경로를 base64로 읽기
        const base64String = await RNFS.readFile(photo.path, 'base64');
        // base64 문자열에 data Uri prefix 추가
        const base64Data = `data:image/jpeg;base64,${base64String}`;
        onPhotoTaken(base64Data);
      }
    } catch (e) {
      console.error('Could not take photo', e);
    }
  };

  if (permission === 'pending')
    return <Text>카메라 권한 확인중...</Text>;

  if (permission === 'denied')
    return <Text>카메라 권한이 필요합니다. 설정에서 권한을 허용하세요.</Text>;

  if (!backCamera)
    return <Text>Back camera not found</Text>;

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={backCamera}
        isActive={true}
        photo={true}
        onInitialized={() => {
          console.log('✅ 카메라 초기화 완료');
          setCameraReady(true);
        }}
      />
      <TouchableOpacity 
        style={styles.button} 
        onPress={takePhoto} 
        disabled={!cameraReady}
      >
        <Text style={styles.buttonText}>
          {cameraReady ? "사진 촬영" : "카메라 준비중..."}
        </Text>
      </TouchableOpacity>
      
      {/* BLE 연결 상태 표시 */}
      {buttonPressed && (
        <View style={styles.bleIndicator}>
          <Text style={styles.bleIndicatorText}>🔘 자동 촬영 중...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  button: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bleIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bleIndicatorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});