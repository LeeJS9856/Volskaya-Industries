import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { CameraView } from '../components/CameraView';
import { Camera } from 'react-native-vision-camera'

export const AddPersonPage: React.FC = () => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<Camera | null>(null);
  const { addPerson } = useFaceRecognition();

  const handlePhotoTaken = (base64: string) => {
    setPhotos([...photos, base64]);
    setShowCamera(false);
  };

  const handleCameraPress = () => {
    setShowCamera(true);
  };

  const handleSubmit = async () => {
    if (photos.length > 0 && name && relation) {
      const ok = await addPerson(photos, name, relation);
      if (ok) {
        Alert.alert('성공', '등록이 완료되었습니다.');
        setName('');
        setRelation('');
        setPhotos([]);
      } else {
        Alert.alert('실패', '등록에 실패했습니다.');
      }
    } else {
      Alert.alert('알림', '최소 1장 이상의 사진과 모든 정보를 입력해주세요.');
    }
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView 
          onPhotoTaken={handlePhotoTaken} 
          cameraRef={cameraRef}/>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowCamera(false)}
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        <View style={styles.photoButtonContainer}>
          <TouchableOpacity 
            style={styles.photoButton}
            onPress={handleCameraPress}
          >
            <View style={styles.iconWrapper}>
              <Image 
                source={require('../icons/camera-outline.png')} 
                style={styles.icon}
              />
            </View>
            <Text style={styles.buttonLabel}>사진 촬영</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.photoButton}
            onPress={() => Alert.alert('알림', '준비중입니다')}
          >
            <View style={styles.iconWrapper}>
              <Image 
                source={require('../icons/images-outline.png')} 
                style={styles.icon}
              />
            </View>
            <Text style={styles.buttonLabel}>이미지 업로드</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <View style={styles.photoStatus}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.photoStatusText}>
              사진 {photos.length}장 등록됨
            </Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>이름</Text>
          <TextInput
            style={styles.input}
            placeholder="이름을 입력해주세요"
            placeholderTextColor="#BDBDBD"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>관계</Text>
          <TextInput
            style={styles.input}
            placeholder="대상과의 관계 입력해주세요. e.g.) 손자, 며느리"
            placeholderTextColor="#BDBDBD"
            value={relation}
            onChangeText={setRelation}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (photos.length === 0 || !name || !relation) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={photos.length === 0 || !name || !relation}
        >
          <Text style={styles.submitButtonText}>등록하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  photoButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  photoButton: {
    alignItems: 'center',
    width: 120,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F5F8FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 40,
    height: 40,
  },
  buttonLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  photoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  photoStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    fontSize: 15,
    color: '#333',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    height: 52,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});