import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { Person } from '../types/person';
import RNFS from 'react-native-fs';

export const useFaceRecognition = () => {
  const recognizePerson = async (imageBase64: string): Promise<Person | null> => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/recognize`, { image: imageBase64 });
      if (data.success && data.name && data.relation) {
        return { id: data.id, name: data.name, relation: data.relation };
      }
    } catch {
      // 실패 처리
    }
    return null;
  };

  const addPerson = async (photo: string, name: string, relation: string) => {
  try {
    console.log('이미지 URI:', photo);
    console.log('Name:', name);
    console.log('Relation:', relation);

    // Base64 데이터만 추출 (data:image/jpeg;base64, 부분 제거)
    const base64Data = photo.split(',')[1];

    const response = await fetch(`${API_BASE_URL}/add-person`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        relation: relation,
        image: base64Data,  // base64 문자열만 전송
      }),
    });

    const text = await response.text();
    console.log('서버 응답:', text);

    const result = JSON.parse(text);
    console.log('등록 성공:', result);
    return result;

  } catch (error) {
    console.error('addPerson 에러:', error);
    throw error;
  }
};
  return { recognizePerson, addPerson };
};