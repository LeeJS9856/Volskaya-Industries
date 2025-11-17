import React, { useEffect } from 'react';
import Tts from 'react-native-tts';

type Props = {
  name: string;
  relation: string;
  enabled?: boolean;
};

export const PersonInfoTTS: React.FC<Props> = ({ name, relation, enabled = true }) => {
  useEffect(() => {
    if (enabled) {
      Tts.speak(`${relation} ${name} 입니다.`);
    }
  }, [name, relation, enabled]);

  return null;
};
