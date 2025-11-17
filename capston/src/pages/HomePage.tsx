import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { CameraView } from '../components/CameraView';
import { PersonInfoTTS } from '../components/PersonInfoTTS';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { Person } from '../types/person';

export const HomePage: React.FC = () => {
  const [detectedPerson, setDetectedPerson] = useState<Person | null>(null);
  const { recognizePerson } = useFaceRecognition();

  const handlePhotoTaken = async (base64: string) => {
    const person = await recognizePerson(base64);
    setDetectedPerson(person);
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView onPhotoTaken={handlePhotoTaken} />
      {detectedPerson && (
        <>
          <Text>{detectedPerson.relation} {detectedPerson.name}를 인식했습니다.</Text>
          <PersonInfoTTS name={detectedPerson.name} relation={detectedPerson.relation} />
        </>
      )}
    </View>
  );
};
