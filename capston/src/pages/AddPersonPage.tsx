import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { CameraView } from '../components/CameraView';

export const AddPersonPage: React.FC = () => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const { addPerson } = useFaceRecognition();
  const [result, setResult] = useState('');

  const handlePhotoTaken = (base64: string) => setPhoto(base64);

  const handleSubmit = async () => {
    if (photo && name && relation) {
      const ok = await addPerson(photo, name, relation);
       //실패시 photo name relation 값 표시
      setResult(ok ? '등록 성공' : '등록 실패');
      console.log('Photo:', photo);
      console.log('Name:', name);
      console.log('Relation:', relation);
    } else {
      setResult('모든 정보를 입력해주세요.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView onPhotoTaken={handlePhotoTaken} />
      <TextInput placeholder="이름" value={name} onChangeText={setName} />
      <TextInput placeholder="관계" value={relation} onChangeText={setRelation} />
      <Button title="등록" onPress={handleSubmit} />
      {!!result && <Text>{result}</Text>}
    </View>
  );
};
