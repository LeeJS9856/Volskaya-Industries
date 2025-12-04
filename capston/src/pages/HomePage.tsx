import React, { useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CameraView } from '../components/CameraView';
import { PersonInfoTTS } from '../components/PersonInfoTTS';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { Person } from '../types/person';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

export const HomePage: React.FC = () => {
  const [detectedPerson, setDetectedPerson] = useState<Person | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnimation = useState(new Animated.Value(-MENU_WIDTH))[0];

  const { recognizePerson } = useFaceRecognition();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setCameraActive(true);
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      {cameraActive && <CameraView onPhotoTaken={handlePhotoTaken} />}

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Icon name="menu" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>얼굴 인식</Text>
      </View>

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
      </Animated.View>

      {/* 인식 정보 */}
      {detectedPerson && (
        <View style={styles.detectionInfo}>
          <Text style={styles.detectionText}>
            {detectedPerson.relation} {detectedPerson.name}를 인식했습니다.
          </Text>
          <PersonInfoTTS key={Date.now()} name={detectedPerson.name} relation={detectedPerson.relation} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 10,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 15,
  },
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#FFFFFF',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  detectionInfo: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    zIndex: 5,
  },
  detectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
});