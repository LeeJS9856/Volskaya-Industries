import axios from 'axios';
import { API_BASE_URL } from '../constants/api.ts';
import { Person } from '../types/person';

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

const addPerson = async (imageUri: string, name: string, relation: string): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });
    formData.append('name', name);
    formData.append('relation', relation);
    const { data } = await axios.post(`${API_BASE_URL}/add-person`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.success;
  } catch {
    return false;
  }
};

  return { recognizePerson, addPerson };
};
