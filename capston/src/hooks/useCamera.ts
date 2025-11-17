import { useEffect, useState } from 'react';
import { Camera } from 'react-native-vision-camera';

export const useCamera = () => {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  useEffect(() => {
    const checkAndRequest = async () => {
      const status = await Camera.requestCameraPermission();
      setPermission(status);
    };
    checkAndRequest();
  }, []);

  return permission;
};
