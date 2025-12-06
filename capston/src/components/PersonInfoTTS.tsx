// PersonInfoTTS.tsx
import React, { useEffect } from 'react';
import Tts from 'react-native-tts';

type Props = {
  name: string;
  relation: string;
  enabled?: boolean;
  onComplete?: () => void; // ✅ 완료 콜백 추가
};

export const PersonInfoTTS: React.FC<Props> = ({ 
  name, 
  relation, 
  enabled = true,
  onComplete 
}) => {
  useEffect(() => {
    const initTTS = async () => {
      try {
        await Tts.setDefaultLanguage('ko-KR');
        await Tts.setDefaultRate(0.5);
        
        // ✅ enabled가 true일 때만 실행
        if (enabled && name && relation) {
          console.log('🔊 TTS 실행:', `${relation}인 ${name}입니다.`);
          Tts.speak(`${relation}인 ${name}입니다.`);
          
          // ✅ TTS 완료 후 콜백 실행
          if (onComplete) {
            setTimeout(() => onComplete(), 100);
          }
        }
      } catch (error) {
        console.error('TTS 에러:', error);
      }
    };
    
    // ✅ enabled가 true일 때만 실행
    if (enabled) {
      initTTS();
    }
  }, [enabled]); // ✅ enabled만 의존성 배열에 추가

  return null;
};