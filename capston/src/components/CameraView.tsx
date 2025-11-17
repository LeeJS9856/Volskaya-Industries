import React, { useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Camera, useCameraDevices, CameraDevice } from 'react-native-vision-camera';

type Props = {
  onPhotoTaken: (photoPath: string) => void;
};

export const CameraView: React.FC<Props> = ({ onPhotoTaken }) => {
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const backCamera = devices.find(device => device.position === 'back');

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

  if (!backCamera) return <Text>Back camera not found</Text>;

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={backCamera}
        isActive={true}
        photo={true}
      />
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text>Take Photo</Text>
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
