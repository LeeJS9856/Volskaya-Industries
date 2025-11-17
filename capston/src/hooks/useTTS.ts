import { useEffect } from 'react';
import Tts from 'react-native-tts';

export const useTTS = (text: string, enabled: boolean = true) => {
  useEffect(() => {
    if (enabled && text) Tts.speak(text);
  }, [text, enabled]);
};
