import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Camera, useCameraDevices, CameraDevice } from 'react-native-vision-camera';
import { useCamera } from '../hooks/useCamera';

type Props = {
  onPhotoTaken: (photoPath: string) => void;
};

export const CameraView: React.FC<Props> = ({ onPhotoTaken }) => {
  const permission = useCamera();
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const backCamera = devices.find(device => device.position === 'back');
  const [cameraReady, setCameraReady] = useState(false);

  const takePhoto = async () => {
    if (!camera.current) return;
    try {
      const photo = await camera.current.takePhoto();
      if (photo.path) {
        onPhotoTaken(photo.path);
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
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={backCamera}
        isActive={true}
        photo={true}
        onInitialized={() => setCameraReady(true)}
      />
      <TouchableOpacity style={styles.button} onPress={takePhoto} disabled={!cameraReady}>
        <Text>{cameraReady ? "사진 촬영" : "카메라 준비중..."}</Text>
      </TouchableOpacity>
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
});
