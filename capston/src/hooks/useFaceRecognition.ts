import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { Person } from '../types/person';
import RNFS from 'react-native-fs';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export const useFaceRecognition = () => {
  const recognizePerson = async (imageBase64: string): Promise<Person | null> => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/recognize`, { image: imageBase64 });
      console.log('인식 결과:', data);
      
      if (data.success && data.faces && data.faces.length > 0) {
        const face = data.faces[0];
        // "모르는 사람"은 제외
        if (face.name !== "모르는 사람") {
          return { 
            id: 0,
            name: face.name, 
            relation: face.relation 
          };
        }
      }
    } catch (error) {
      console.error('인식 에러:', error);
    }
    return null;
  };

  const getPersons = async () => {
    try {
      console.log('사람 목록 불러오기 시작');
      
      const response = await fetch(`${API_BASE_URL}/persons`, {
        method: 'GET',
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (result.success) {
        return result.persons;
      }
      return [];
    } catch (error) {
      console.error('목록 불러오기 실패:', error);
      return [];
    }
  };

  const addPerson = async (photos: string | string[], name: string, relation: string) => {
    try {
      console.log('Name:', name);
      console.log('Relation:', relation);

      // Base64 데이터만 추출 (data:image/jpeg;base64, 부분 제거)
      const photoArray = Array.isArray(photos) ? photos : [photos];
      const firstPhoto = photoArray[0];
      const base64Data = firstPhoto.split(',')[1] || firstPhoto;

      const response = await fetch(`${API_BASE_URL}/add-person`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          relation: relation,
          image: base64Data,
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

  const deletePerson = async (personId: number) => {
    try {
      console.log('삭제 요청 시작:', personId);
      
      const response = await fetch(`${API_BASE_URL}/delete-person/${personId}`, {
        method: 'DELETE',
      });
      
      console.log('삭제 응답:', response.status);
      return response.ok;
    } catch (error) {
      console.error('삭제 실패:', error);
      return false;
    }
  };
  
  return { recognizePerson, addPerson, deletePerson, getPersons };
};