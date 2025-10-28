from deepface import DeepFace
import numpy as np
import os
import pickle
import cv2

class FaceRecognitionSystem:
    def __init__(self, known_faces_dir='known_faces'):
        self.known_faces_dir = known_faces_dir
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_face_relations = []
        self.known_face_images = []  # 원본 이미지 경로 저장
        
        # known_faces 폴더가 없으면 생성
        if not os.path.exists(known_faces_dir):
            os.makedirs(known_faces_dir)
        
        # 이미지 저장 폴더
        self.images_dir = os.path.join(known_faces_dir, 'images')
        if not os.path.exists(self.images_dir):
            os.makedirs(self.images_dir)
        
        # 저장된 데이터 로드
        self.load_known_faces()
    
    def load_known_faces(self):
        """저장된 얼굴 데이터 로드"""
        encoding_file = os.path.join(self.known_faces_dir, 'encodings.pkl')
        
        if os.path.exists(encoding_file):
            with open(encoding_file, 'rb') as f:
                data = pickle.load(f)
                self.known_face_encodings = data['encodings']
                self.known_face_names = data['names']
                self.known_face_relations = data['relations']
            print(f"✓ {len(self.known_face_names)}명의 얼굴 데이터 로드 완료")
        else:
            print("저장된 얼굴 데이터가 없습니다. 새로 학습이 필요합니다.")
    
    def save_known_faces(self):
        """얼굴 데이터 저장"""
        encoding_file = os.path.join(self.known_faces_dir, 'encodings.pkl')
        
        data = {
            'encodings': self.known_face_encodings,
            'names': self.known_face_names,
            'relations': self.known_face_relations
        }
        
        with open(encoding_file, 'wb') as f:
            pickle.dump(data, f)
        print(f"✓ {len(self.known_face_names)}명의 얼굴 데이터 저장 완료")
    
    def add_person(self, image_path, name, relation):
        """
        새로운 사람 추가
        image_path: 사진 파일 경로
        name: 이름
        relation: 관계 (예: "딸", "아들", "며느리")
        """
        try:
            # 이미지 로드
            image = face_recognition.load_image_file(image_path)
            
            # 얼굴 인코딩
            face_encodings = face_recognition.face_encodings(image)
            
            if len(face_encodings) == 0:
                return False, "사진에서 얼굴을 찾을 수 없습니다."
            
            if len(face_encodings) > 1:
                return False, "사진에 여러 명의 얼굴이 있습니다. 한 명만 있는 사진을 사용해주세요."
            
            # 데이터 추가
            self.known_face_encodings.append(face_encodings[0])
            self.known_face_names.append(name)
            self.known_face_relations.append(relation)
            
            # 저장
            self.save_known_faces()
            
            return True, f"{name}님이 성공적으로 등록되었습니다."
            
        except Exception as e:
            return False, f"오류 발생: {str(e)}"
    
    def recognize_face(self, image_data):
        """
        이미지에서 얼굴 인식
        image_data: numpy array 형태의 이미지
        """
        if len(self.known_face_encodings) == 0:
            return {
                'success': False,
                'message': '등록된 얼굴 데이터가 없습니다.'
            }
        
        try:
            # 얼굴 위치 찾기
            face_locations = face_recognition.face_locations(image_data)
            
            if len(face_locations) == 0:
                return {
                    'success': False,
                    'message': '얼굴을 찾을 수 없습니다.'
                }
            
            # 얼굴 인코딩
            face_encodings = face_recognition.face_encodings(image_data, face_locations)
            
            results = []
            
            for face_encoding, face_location in zip(face_encodings, face_locations):
                # 알려진 얼굴과 비교
                matches = face_recognition.compare_faces(
                    self.known_face_encodings, 
                    face_encoding,
                    tolerance=0.6  # 0.6이 기본값, 낮을수록 엄격
                )
                
                name = "모르는 사람"
                relation = ""
                confidence = 0
                
                # 거리 계산 (낮을수록 유사)
                face_distances = face_recognition.face_distance(
                    self.known_face_encodings, 
                    face_encoding
                )
                
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    
                    if matches[best_match_index]:
                        name = self.known_face_names[best_match_index]
                        relation = self.known_face_relations[best_match_index]
                        # 신뢰도를 퍼센트로 변환 (거리가 0이면 100%)
                        confidence = round((1 - face_distances[best_match_index]) * 100, 2)
                
                results.append({
                    'name': name,
                    'relation': relation,
                    'confidence': confidence,
                    'location': face_location
                })
            
            return {
                'success': True,
                'faces': results
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'오류 발생: {str(e)}'
            }
    
    def get_all_persons(self):
        """등록된 모든 사람 목록 반환"""
        persons = []
        for i in range(len(self.known_face_names)):
            persons.append({
                'id': i,
                'name': self.known_face_names[i],
                'relation': self.known_face_relations[i]
            })
        return persons
    
    def delete_person(self, person_id):
        """등록된 사람 삭제"""
        try:
            if 0 <= person_id < len(self.known_face_names):
                name = self.known_face_names[person_id]
                
                del self.known_face_encodings[person_id]
                del self.known_face_names[person_id]
                del self.known_face_relations[person_id]
                
                self.save_known_faces()
                return True, f"{name}님이 삭제되었습니다."
            else:
                return False, "잘못된 ID입니다."
        except Exception as e:
            return False, f"오류 발생: {str(e)}"