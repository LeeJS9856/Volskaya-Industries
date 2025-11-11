import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import axios from 'axios';
import { API_URL } from '../constants/config';

interface Person {
  id: number;
  name: string;
  relation: string;
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [persons, setPersons] = useState<Person[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    try {
      const response = await axios.get(`${API_URL}/persons`);
      if (response.data.success) {
        setPersons(response.data.persons);
      }
    } catch (error) {
      console.error('목록 가져오기 실패:', error);
      Alert.alert('오류', '서버 연결 실패');
    }
  };

  const pickImageAndRegister = async () => {
    if (!name.trim() || !relation.trim()) {
      Alert.alert('입력 필요', '이름과 관계를 모두 입력해주세요.');
      return;
    }

    try {
      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 1,
      };

      const result = await launchImageLibrary(options);

      if (result.assets && result.assets.length > 0) {
        setIsProcessing(true);

        const formData = new FormData();
        const imageUri = result.assets[0].uri;
        if (!imageUri) {
          Alert.alert('오류', '이미지 URI를 찾을 수 없습니다.');
          setIsProcessing(false);
          return;
        }
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
        formData.append('name', name.trim());
        formData.append('relation', relation.trim());

        const response = await axios.post(`${API_URL}/add-person`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000,
        });

        if (response.data.success) {
          Alert.alert('성공', response.data.message);
          setName('');
          setRelation('');
          fetchPersons();
        } else {
          Alert.alert('실패', response.data.message);
        }
      }
    } catch (error) {
      console.error('등록 실패:', error);
      Alert.alert('오류', '등록에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const deletePerson = async (personId: number, personName: string) => {
    Alert.alert('삭제 확인', `${personName}님을 정말 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await axios.delete(`${API_URL}/delete-person/${personId}`);
            if (response.data.success) {
              Alert.alert('완료', response.data.message);
              fetchPersons();
            }
          } catch (error) {
            Alert.alert('오류', '삭제 실패');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* 등록 폼 */}
      <View style={styles.registerForm}>
        <Text style={styles.formTitle}>👤 새 사람 등록</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 홍길동"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>관계</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 딸, 아들, 며느리"
            value={relation}
            onChangeText={setRelation}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[styles.registerButton, isProcessing && styles.registerButtonDisabled]}
          onPress={pickImageAndRegister}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>📷 사진 선택 및 등록</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 등록된 사람 목록 */}
      <View style={styles.personsList}>
        <Text style={styles.personsTitle}>등록된 사람 목록 ({persons.length}명)</Text>

        {persons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>아직 등록된 사람이 없습니다</Text>
            <Text style={styles.emptyStateSubtext}>위에서 가족을 등록해보세요</Text>
          </View>
        ) : (
          persons.map((person: Person) => (
            <View key={person.id} style={styles.personItem}>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{person.name}</Text>
                <Text style={styles.personRelation}>({person.relation})</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePerson(person.id, person.name)}
              >
                <Text style={styles.deleteButtonText}>🗑️ 삭제</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  registerForm: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#764ba2',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  personsList: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
  },
  personsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  personItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  personRelation: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
