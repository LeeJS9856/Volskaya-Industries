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
        self.known_face_images = []
        
        if not os.path.exists(known_faces_dir):
            os.makedirs(known_faces_dir)
        
        self.images_dir = os.path.join(known_faces_dir, 'images')
        if not os.path.exists(self.images_dir):
            os.makedirs(self.images_dir)
        
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
            print("저장된 얼굴 데이터가 없습니다.")
    
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
        try:
            # cv2로 이미지 읽기 (한글 경로 문제 해결)
            import cv2
            
            # 절대 경로로 변환
            abs_path = os.path.abspath(image_path)
            print(f"절대 경로: {abs_path}")
            print(f"파일 존재: {os.path.exists(abs_path)}")
            
            # cv2로 이미지 읽기
            img_array = cv2.imread(abs_path)
            
            if img_array is None:
                # 한글 경로 문제 해결 - imdecode 사용
                with open(abs_path, 'rb') as f:
                    image_bytes = f.read()
                img_array = cv2.imdecode(
                    np.frombuffer(image_bytes, np.uint8), 
                    cv2.IMREAD_COLOR
                )
            
            if img_array is None:
                return False, "이미지를 읽을 수 없습니다."
            
            print(f"이미지 크기: {img_array.shape}")
            
            # RGB로 변환 (OpenCV는 BGR)
            img_array = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
            
            # numpy array로 직접 전달
            embedding_objs = DeepFace.represent(
                img_path=img_array,  # 경로 대신 array 전달
                model_name='ArcFace',
                enforce_detection=False,
                detector_backend='retinaface'
            )
            
            if len(embedding_objs) == 0:
                return False, "사진에서 얼굴을 찾을 수 없습니다."
            
            face_embedding = embedding_objs[0]['embedding']
            
            print(f"임베딩 크기: {len(face_embedding)}")
            
            # 데이터 추가
            self.known_face_encodings.append(face_embedding)
            self.known_face_names.append(name)
            self.known_face_relations.append(relation)
            
            # 저장
            self.save_known_faces()
            print(f'✓ {name}님이 성공적으로 등록되었습니다.')
            return True, f"{name}님이 성공적으로 등록되었습니다."
            
        except Exception as e:
            print(f"등록 실패: {str(e)}")
            import traceback
            traceback.print_exc()
            return False, f"오류 발생: {str(e)}"
  
    def recognize_face(self, image_data):
        print("=== recognize_face 호출됨 ===")
        print(f"등록된 얼굴 수: {len(self.known_face_encodings)}")
        
        if len(self.known_face_encodings) == 0:
            print("등록된 얼굴 없음")
            return {
                'success': False,
                'message': '등록된 얼굴 데이터가 없습니다.'
            }
        
        try:
            print(f"인식 시작 - 이미지 shape: {image_data.shape}")
            
            embedding_objs = DeepFace.represent(
                img_path=image_data,
                model_name='ArcFace',
                enforce_detection=False,
                detector_backend='retinaface'
            )
            
            print(f"DeepFace 결과: {len(embedding_objs)}개의 얼굴 감지")
            
            if len(embedding_objs) == 0:
                print("얼굴 감지 실패")
                return {
                    'success': False,
                    'message': '얼굴을 찾을 수 없습니다.'
                }
            
            results = []
            
            for idx, embedding_obj in enumerate(embedding_objs):
                print(f"얼굴 {idx+1} 처리 중...")
                face_embedding = np.array(embedding_obj['embedding'])
                
                best_similarities = []  # 각 사람별 최고 유사도
                
                # ✅ 각 등록된 사람에 대해
                for i, person_embeddings in enumerate(self.known_face_encodings):
                    max_similarity = 0
                    
                    # 그 사람의 모든 임베딩과 비교해서 최고값 찾기
                    for known_encoding in person_embeddings:
                        known_encoding = np.array(known_encoding)
                        similarity = np.dot(face_embedding, known_encoding) / (
                            np.linalg.norm(face_embedding) * np.linalg.norm(known_encoding)
                        )
                        max_similarity = max(max_similarity, similarity)
                    
                    best_similarities.append(max_similarity)
                    print(f"  {self.known_face_names[i]}: 최고 {max_similarity:.4f}")
                
                # 가장 유사한 얼굴 찾기
                if len(best_similarities) > 0:
                    best_match_idx = np.argmax(best_similarities)
                    best_similarity = best_similarities[best_match_idx]
                    
                    print(f"최고 유사도: {best_similarity:.4f} ({self.known_face_names[best_match_idx]})")
                    
                    # ✅ 임계값 낮춤 (다양한 각도 커버)
                    if best_similarity > 0.6:  # 0.7 → 0.6
                        name = self.known_face_names[best_match_idx]
                        relation = self.known_face_relations[best_match_idx]
                        confidence = round(best_similarity * 100, 2)
                        print(f"✓ 인식 성공: {name} ({relation})")
                    else:
                        name = "unknown"
                        relation = ""
                        confidence = round(best_similarity * 100, 2)
                        print(f"✗ 유사도 낮음: {best_similarity:.4f}")
                    
                    results.append({
                        'name': name,
                        'relation': relation,
                        'confidence': confidence
                    })
            
            print(f"✓ 최종 결과: {results}")
            
            final_result = {
                'success': True,
                'faces': results
            }
            return final_result
            
        except Exception as e:
            print(f"!!! 인식 실패 !!!")
            print(f"에러: {str(e)}")
            import traceback
            traceback.print_exc()
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

def add_person_multiple(self, image_paths, name, relation):
    """여러 이미지를 모두 저장"""
    try:
        embeddings = []
        
        for idx, image_path in enumerate(image_paths):
            print(f"이미지 {idx+1}/{len(image_paths)} 처리 중...")
            
            img_array = cv2.imread(image_path)
            if img_array is None:
                with open(image_path, 'rb') as f:
                    image_bytes = f.read()
                img_array = cv2.imdecode(
                    np.frombuffer(image_bytes, np.uint8), 
                    cv2.IMREAD_COLOR
                )
            
            if img_array is None:
                continue
            
            img_array = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
            
            embedding_objs = DeepFace.represent(
                img_path=img_array,
                model_name='ArcFace',
                enforce_detection=False,
                detector_backend='retinaface'
            )
            
            if len(embedding_objs) > 0:
                embeddings.append(embedding_objs[0]['embedding'])
        
        if len(embeddings) == 0:
            return False, "모든 사진에서 얼굴을 찾을 수 없습니다."
        
        # ✅ 리스트로 저장
        self.known_face_encodings.append(embeddings)
        self.known_face_names.append(name)
        self.known_face_relations.append(relation)
        
        self.save_known_faces()
        print(f'✓ {name}님이 {len(embeddings)}장의 사진으로 등록되었습니다.')
        return True, f"{name}님이 성공적으로 등록되었습니다."
        
    except Exception as e:
        print(f"등록 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return False, f"오류 발생: {str(e)}"