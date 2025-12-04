import React, { useState, useRef, useEffect } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import Icon from 'react-native-vector-icons/Ionicons';
import { Camera } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { CameraView } from '../components/CameraView';
import { PersonInfoTTS } from '../components/PersonInfoTTS';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { useBLE } from '../hooks/useBLE';
import { Person } from '../types/person';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

export const HomePage: React.FC = () => {
  const [detectedPerson, setDetectedPerson] = useState<Person | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnimation = useState(new Animated.Value(-MENU_WIDTH))[0];
  const cameraRef = useRef<Camera | null>(null);

  const { recognizePerson } = useFaceRecognition();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // BLE 훅 사용
  const { 
    isScanning, 
    connectedDevice,
    buttonPressed,  // 여기서 가져옴
    startScan, 
    disconnect,
    sendData 
  } = useBLE();

  // ESP32 버튼 이벤트 수신 시 자동 사진 촬영
  const handleButtonPressed = async () => {
    console.log('🔘 ESP32 버튼 눌림 → 자동 사진 촬영 시작');
    
    if (!cameraRef.current) {
      console.error('❌ 카메라 ref 없음');
      return;
    }

    try {
      // 자동으로 사진 촬영
      const photo = await cameraRef.current.takePhoto();
      
      if (photo.path) {
        console.log('📸 사진 촬영 완료:', photo.path);
        
        // Base64 변환
        const base64String = await RNFS.readFile(photo.path, 'base64');
        const base64Data = `data:image/jpeg;base64,${base64String}`;
        
        // 얼굴 인식
        const person = await recognizePerson(base64Data);
        console.log('👤 인식 결과:', person);
        
        if (person) {
          setDetectedPerson(person);
          
          // ESP32로 JSON 전송
          const resultJson = JSON.stringify({
            name: person.name,
            relation: person.relation
          });
          
          console.log('📤 ESP32로 전송:', resultJson);
          await sendData(resultJson);
          
        } else {
          console.log('❌ 인식 실패 또는 모르는 사람');
          // 모르는 사람인 경우에도 전송
          const unknownJson = JSON.stringify({
            name: "unknown",
            relation: "unknown"
          });
          await sendData(unknownJson);
        }
      }
    } catch (error) {
      console.error('❌ 자동 촬영 실패:', error);
    }
  };

  // 수동 촬영 (기존 기능 유지)
  const handlePhotoTaken = async (base64: string) => {
    const person = await recognizePerson(base64);
    console.log('Recognized Person:', person);
    setDetectedPerson(person);
  };

  const toggleMenu = () => {
    const toValue = menuVisible ? -MENU_WIDTH : 0;

    Animated.timing(menuAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: -MENU_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setMenuVisible(false);
  };

  const goToAddPerson = () => {
    closeMenu();
    setCameraActive(false);
    navigation.navigate('AddPersonPage');
  };

  const goToPersonList = () => {
    closeMenu();
    setCameraActive(false);
    navigation.navigate('PersonListPage');
  };

  // BLE 연결 버튼 핸들러
  const handleBLEConnection = () => {
    if (connectedDevice) {
      Alert.alert(
        'BLE 연결 해제',
        'ESP32 연결을 해제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '해제', 
            onPress: disconnect,
            style: 'destructive'
          }
        ]
      );
    } else {
      startScan();
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setCameraActive(true);
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>

      {/* 헤더 */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            <Icon name="menu" size={32} color="#000000ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>얼굴 인식</Text>
          
          {/* BLE 연결 버튼 */}
          <TouchableOpacity 
            onPress={handleBLEConnection} 
            style={styles.bleButton}
          >
            <Icon 
              name="bluetooth" 
              size={28} 
              color={connectedDevice ? "#4CAF50" : "#999"} 
            />
            {isScanning && (
              <View style={styles.scanningIndicator} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* 카메라 뷰 (ref와 buttonPressed 전달) */}
      {cameraActive && (
        <CameraView 
          onPhotoTaken={handlePhotoTaken} 
          cameraRef={cameraRef}
          onButtonPressed={handleButtonPressed}
          buttonPressed={buttonPressed}  // props로 전달
        />
      )}

      {/* 오버레이 */}
      {menuVisible && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* 슬라이드 메뉴 */}
      <Animated.View
        style={[
          styles.menu,
          {
            transform: [{ translateX: menuAnimation }]
          }
        ]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>메뉴</Text>
          <TouchableOpacity onPress={closeMenu}>
            <Icon name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={goToAddPerson}
        >
          <Icon name="person-add" size={24} color="#4A90E2" />
          <Text style={styles.menuItemText}>얼굴 등록하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={goToPersonList}
        >
          <Icon name="list" size={24} color="#66BB6A" />
          <Text style={styles.menuItemText}>등록된 사람 보기</Text>
        </TouchableOpacity>

        {/* BLE 상태 표시 */}
        <View style={styles.bleStatus}>
          <Icon 
            name="bluetooth" 
            size={20} 
            color={connectedDevice ? "#4CAF50" : "#999"} 
          />
          <Text style={styles.bleStatusText}>
            {connectedDevice 
              ? `연결됨: ${connectedDevice.name}` 
              : '연결 안 됨'}
          </Text>
        </View>
      </Animated.View>

      {/* 인식 정보 */}
      {detectedPerson && (
        <View style={styles.detectionInfo}>
          <Text style={styles.detectionText}>
            {detectedPerson.relation} {detectedPerson.name}를 인식했습니다.
          </Text>
          <PersonInfoTTS 
            name={detectedPerson.name} 
            relation={detectedPerson.relation} 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSafeArea: {
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  bleButton: {
    padding: 4,
    position: 'relative',
  },
  scanningIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFA500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#ffffff',
    zIndex: 999,
    paddingTop: 60,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  bleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bleStatusText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  detectionInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
});