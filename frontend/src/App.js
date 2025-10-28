import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000';

function App() {
  const [mode, setMode] = useState('recognize'); // 'recognize' or 'register'
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [persons, setPersons] = useState([]);
  
  // 등록 모드용
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // 카메라용
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  
  // TTS 음성 설정
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // 말하는 속도
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };
  
  // 등록된 사람 목록 가져오기
  const fetchPersons = async () => {
    try {
      const response = await axios.get(`${API_URL}/persons`);
      if (response.data.success) {
        setPersons(response.data.persons);
      }
    } catch (error) {
      console.error('목록 가져오기 실패:', error);
    }
  };
  
  useEffect(() => {
    fetchPersons();
  }, []);
  
  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    } catch (error) {
      alert('카메라 접근 권한이 필요합니다.');
      console.error('카메라 오류:', error);
    }
  };
  
  // 카메라 정지
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraOn(false);
    }
  };
  
  // 사진 캡처 및 얼굴 인식
  const captureAndRecognize = async () => {
    if (!videoRef.current) return;
    
    setIsProcessing(true);
    setResult(null);
    
    // 캔버스에 현재 비디오 프레임 그리기
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // 이미지를 Base64로 변환
    const imageData = canvas.toDataURL('image/jpeg');
    
    try {
      // 서버로 전송
      const response = await axios.post(`${API_URL}/recognize`, {
        image: imageData
      });
      
      if (response.data.success) {
        const faces = response.data.faces;
        
        if (faces.length > 0) {
          const face = faces[0]; // 첫 번째 얼굴만 처리
          
          if (face.name === "모르는 사람") {
            setResult({ type: 'unknown', message: '모르는 사람입니다.' });
            speak('모르는 사람입니다.');
          } else {
            const message = `이 분은 ${face.name}님입니다. 당신의 ${face.relation}입니다.`;
            setResult({ 
              type: 'known', 
              message: message,
              confidence: face.confidence
            });
            speak(message);
          }
        }
      } else {
        setResult({ type: 'error', message: response.data.message });
      }
      
    } catch (error) {
      console.error('인식 실패:', error);
      setResult({ type: 'error', message: '서버 연결 실패' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 새 사람 등록
  const registerPerson = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !name || !relation) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('name', name);
    formData.append('relation', relation);
    
    try {
      const response = await axios.post(`${API_URL}/add-person`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        alert(response.data.message);
        setName('');
        setRelation('');
        setSelectedFile(null);
        fetchPersons(); // 목록 새로고침
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('등록 실패:', error);
      alert('등록 실패');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 사람 삭제
  const deletePerson = async (personId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await axios.delete(`${API_URL}/delete-person/${personId}`);
      if (response.data.success) {
        alert(response.data.message);
        fetchPersons();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 실패');
    }
  };
  
  return (
    <div className="App">
      <header className="header">
        <h1>👴 얼굴 인식 시스템</h1>
      </header>
      
      <div className="mode-switch">
        <button 
          className={mode === 'recognize' ? 'active' : ''}
          onClick={() => setMode('recognize')}
        >
          얼굴 인식
        </button>
        <button 
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
        >
          사람 등록
        </button>
      </div>
      
      {mode === 'recognize' ? (
        <div className="recognize-mode">
          <div className="camera-section">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="video-preview"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div className="camera-controls">
              {!isCameraOn ? (
                <button className="btn-primary" onClick={startCamera}>
                  📷 카메라 시작
                </button>
              ) : (
                <>
                  <button 
                    className="btn-primary" 
                    onClick={captureAndRecognize}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '처리 중...' : '🔍 얼굴 인식'}
                  </button>
                  <button className="btn-secondary" onClick={stopCamera}>
                    카메라 정지
                  </button>
                </>
              )}
            </div>
          </div>
          
          {result && (
            <div className={`result ${result.type}`}>
              <h2>{result.message}</h2>
              {result.confidence && (
                <p>신뢰도: {result.confidence}%</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="register-mode">
          <form onSubmit={registerPerson} className="register-form">
            <h2>새 사람 등록</h2>
            
            <div className="form-group">
              <label>이름:</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                required
              />
            </div>
            
            <div className="form-group">
              <label>관계:</label>
              <input 
                type="text" 
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="딸, 아들, 며느리 등"
                required
              />
            </div>
            
            <div className="form-group">
              <label>사진:</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isProcessing}
            >
              {isProcessing ? '등록 중...' : '등록하기'}
            </button>
          </form>
          
          <div className="persons-list">
            <h2>등록된 사람 ({persons.length}명)</h2>
            {persons.length === 0 ? (
              <p>등록된 사람이 없습니다.</p>
            ) : (
              <ul>
                {persons.map(person => (
                  <li key={person.id}>
                    <span>{person.name} ({person.relation})</span>
                    <button 
                      onClick={() => deletePerson(person.id)}
                      className="btn-delete"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;