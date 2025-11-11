import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import Tts from 'react-native-tts';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import axios from 'axios';
import { API_URL, TTS_LANGUAGE, TTS_PITCH, TTS_RATE, TTS_VOLUME } from '../constants/config';

interface RecognitionResult {
  type: 'known' | 'unknown' | 'error';
  message: string;
  confidence?: number;
}

export default function RecognizeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const cameraRef = useRef<RNCamera>(null);

  useEffect(() => {
    requestCameraPermission();
    // TTS 초기화 옵션 설정 가능
  }, []);

  async function requestCameraPermission() {
    try {
      const permissionType =
        Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      const status = await check(permissionType);
      if (status === RESULTS.GRANTED) {
        setHasPermission(true);
      } else {
        const reqStatus = await request(permissionType);
        setHasPermission(reqStatus === RESULTS.GRANTED);
        if (reqStatus !== RESULTS.GRANTED) {
          Alert.alert('카메라 권한이 필요합니다.');
        }
      }
    } catch (error) {
      console.error('카메라 권한 오류:', error);
      Alert.alert('카메라 권한을 확인할 수 없습니다.');
    }
  }

  const speak = (text: string) => {
    Tts.setDefaultLanguage(TTS_LANGUAGE);
    Tts.setDefaultRate(parseFloat(TTS_RATE));
    Tts.setDefaultPitch(parseFloat(TTS_PITCH));
    Tts.speak(text);
  };

  const captureAndRecognize = async () => {
    if (!cameraRef.current) {
      Alert.alert('오류', '카메라가 준비되지 않았습니다.');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      const response = await axios.post(
        `${API_URL}/recognize`,
        { image: `data:image/jpeg;base64,${photo.base64}` },
        { timeout: 10000 }
      );

      if (response.data.success && response.data.faces.length > 0) {
        const face = response.data.faces[0];

        if (face.name === '모르는 사람') {
          setResult({ type: 'unknown', message: '모르는 사람입니다.', confidence: 0 });
          speak('모르는 사람입니다.');
        } else {
          const message = `이 분은 ${face.name}님입니다. 당신의 ${face.relation}입니다.`;
          setResult({ type: 'known', message, confidence: face.confidence });
          speak(message);
        }
      } else {
        setResult({ type: 'error', message: response.data.message || '얼굴을 찾을 수 없습니다.' });
        speak('얼굴을 인식할 수 없습니다.');
      }
    } catch (error: any) {
      console.error('인식 실패:', error);
      const errorMessage = error.code === 'ECONNABORTED' ? '서버 응답 시간 초과' : '서버 연결 실패';
      setResult({ type: 'error', message: errorMessage });
      Alert.alert('오류', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>📷 카메라 권한이 필요합니다</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>권한 요청하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <RNCamera
          style={styles.camera}
          ref={cameraRef}
          type={RNCamera.Constants.Type.back}
          captureAudio={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
        onPress={captureAndRecognize}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Text style={styles.captureButtonText}>📸 사진 찍고 인식하기</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View
          style={[
            styles.result,
            result.type === 'known' && styles.resultKnown,
            result.type === 'unknown' && styles.resultUnknown,
            result.type === 'error' && styles.resultError,
          ]}
        >
          <Text style={styles.resultMessage}>{result.message}</Text>
          {result.confidence! > 0 && (
            <Text style={styles.confidenceText}>신뢰도: {result.confidence!.toFixed(1)}%</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionText: { fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  permissionButton: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  permissionButtonText: { color: '#667eea', fontSize: 16, fontWeight: 'bold' },
  cameraContainer: { width: '100%', aspectRatio: 3 / 4, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  captureButton: {
    marginTop: 25,
    backgroundColor: '#764ba2',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  captureButtonDisabled: { opacity: 0.6 },
  captureButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  result: { marginTop: 20, padding: 20, borderRadius: 15, width: '100%', borderWidth: 3 },
  resultKnown: { backgroundColor: '#d4edda', borderColor: '#28a745' },
  resultUnknown: { backgroundColor: '#fff3cd', borderColor: '#ffc107' },
  resultError: { backgroundColor: '#f8d7da', borderColor: '#dc3545' },
  resultMessage: { fontSize: 18, fontWeight: '600', textAlign: 'center', color: '#333' },
  confidenceText: { fontSize: 14, marginTop: 8, textAlign: 'center', color: '#666' },
});
