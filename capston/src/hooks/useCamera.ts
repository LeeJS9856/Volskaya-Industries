import { Camera } from 'react-native-vision-camera';

const requestPermission = async () => {
  const permission = await Camera.requestCameraPermission();

  if (permission === 'granted') {
    // 권한 허용 상태
    console.log('Camera permission granted');
  } else {
    // 권한 거부 상태
    console.log('Camera permission denied');
  }
};
