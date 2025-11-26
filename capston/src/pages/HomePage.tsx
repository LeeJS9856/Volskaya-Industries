import React, { useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView } from '../components/CameraView';
import { PersonInfoTTS } from '../components/PersonInfoTTS';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { Person } from '../types/person';
import { RootStackParamList } from '../../App';

export const HomePage: React.FC = () => {
  const [detectedPerson, setDetectedPerson] = useState<Person | null>(null);
  const { recognizePerson } = useFaceRecognition();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handlePhotoTaken = async (base64: string) => {
    const person = await recognizePerson(base64);
    console.log('Recognized Person:', person);
    setDetectedPerson(person);
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView onPhotoTaken={handlePhotoTaken} />
      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => navigation.navigate('AddPersonPage')}
      >
        <Text>얼굴 등록하기</Text>
      </TouchableOpacity>
      {detectedPerson && (
        <>
          <Text>{detectedPerson.relation} {detectedPerson.name}를 인식했습니다.</Text>
          <PersonInfoTTS name={detectedPerson.name} relation={detectedPerson.relation} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  registerButton: {
    margin: 20,
    backgroundColor: '#90caf9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
