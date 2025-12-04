import React, { useEffect } from 'react';
import Tts from 'react-native-tts';

type Props = {
  name: string;
  relation: string;
  enabled?: boolean;
};

export const PersonInfoTTS: React.FC<Props> = ({ name, relation, enabled = true }) => {
  useEffect(() => {
    const initTTS = async () => {
      try {
        // TTS 초기화
        await Tts.setDefaultLanguage('ko-KR');
        await Tts.setDefaultRate(0.5);
        
        if (enabled && name && relation) {
          console.log('TTS 실행:', `${relation}인 ${name}입니다.`);
          Tts.speak(`${relation}인 ${name}입니다.`);
        }
      } catch (error) {
        console.error('TTS 에러:', error);
      }
    };
    
    initTTS();
  }, [name, relation, enabled]);

  return null;
};