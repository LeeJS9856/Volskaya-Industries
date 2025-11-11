import Config from 'react-native-config';

export const API_URL: string = Config.API_URL ?? '';
export const TTS_LANGUAGE: string = Config.TTS_LANGUAGE ?? 'ko';

// number 값을 문자열로 변환해 Speech.speak 옵션에 사용
export const TTS_RATE: string = (Config.TTS_RATE ?? '1.0').toString();
export const TTS_PITCH: string = (Config.TTS_PITCH ?? '1.0').toString();
export const TTS_VOLUME: string = (Config.TTS_VOLUME ?? '1.0').toString();

// TTS 설정
export const TTS_CONFIG = {
  language: TTS_LANGUAGE || 'ko-KR',
  rate: parseFloat(TTS_RATE) || 0.9,
  pitch: parseFloat(TTS_PITCH) || 1.0,
  volume: parseFloat(TTS_VOLUME) || 1.0,
};