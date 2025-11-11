import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import RecognizeScreen from '../components/RecognizeScreen';
import RegisterScreen from '../components/RegisterScreen';

type Mode = 'recognize' | 'register';

export default function Index() {
  const [mode, setMode] = useState<Mode>('recognize');

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👴 얼굴 인식 시스템</Text>
        <Text style={styles.headerSubtitle}>치매 노인 돌봄 앱</Text>
      </View>

      {/* 모드 전환 버튼 */}
      <View style={styles.modeSwitch}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'recognize' && styles.modeButtonActive]}
          onPress={() => setMode('recognize')}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === 'recognize' && styles.modeButtonTextActive,
            ]}
          >
            🔍 얼굴 인식
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
          onPress={() => setMode('register')}
        >
          <Text
            style={[styles.modeButtonText, mode === 'register' && styles.modeButtonTextActive]}
          >
            ➕ 사람 등록
          </Text>
        </TouchableOpacity>
      </View>

      {/* 화면 전환 */}
      {mode === 'recognize' ? <RecognizeScreen /> : <RegisterScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#667eea',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  modeSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#fff',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modeButtonTextActive: {
    color: '#667eea',
  },
});