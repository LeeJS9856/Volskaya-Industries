from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import numpy as np
from PIL import Image
import io
import os
import uuid
from face_recognition_module import FaceRecognitionSystem

app = Flask(__name__)
CORS(app)  # React에서 접근 가능하도록

# 얼굴 인식 시스템 초기화
face_system = FaceRecognitionSystem()

@app.route('/')
def home():
    return jsonify({
        'message': '얼굴 인식 API 서버가 실행 중입니다.',
        'endpoints': {
            '/recognize': 'POST - 얼굴 인식',
            '/add-person': 'POST - 새 사람 등록',
            '/persons': 'GET - 등록된 사람 목록',
            '/delete-person/<id>': 'DELETE - 사람 삭제'
        }
    })

@app.route('/recognize', methods=['POST'])
def recognize():
    """카메라에서 받은 이미지로 얼굴 인식"""
    print("=== /recognize 요청 받음 ===")
    try:
        data = request.get_json()
        print(f"받은 데이터 키: {list(data.keys())}")
        
        if 'image' not in data:
            print("❌ 이미지 데이터 없음")
            return jsonify({
                'success': False,
                'message': '이미지 데이터가 없습니다.'
            }), 400
        
        print("Base64 디코딩 시작...")
        # Base64 이미지 디코딩
        image_data = data['image'].split(',')[1]  # data:image/jpeg;base64, 제거
        image_bytes = base64.b64decode(image_data)
        print(f"디코딩된 이미지 크기: {len(image_bytes)} bytes")
        
        # PIL Image로 변환
        image = Image.open(io.BytesIO(image_bytes))
        print(f"PIL 이미지 크기: {image.size}, 모드: {image.mode}")
        
        # numpy array로 변환
        image_array = np.array(image)
        print(f"NumPy array shape: {image_array.shape}")
        
        # 얼굴 인식
        print("얼굴 인식 시작...")
        result = face_system.recognize_face(image_array)
        print(f"인식 결과: {result}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"!!! /recognize 에러 !!!")
        print(f"에러: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'서버 오류: {str(e)}'
        }), 500
    """카메라에서 받은 이미지로 얼굴 인식"""
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({
                'success': False,
                'message': '이미지 데이터가 없습니다.'
            }), 400
        
        # Base64 이미지 디코딩
        image_data = data['image'].split(',')[1]  # data:image/jpeg;base64, 제거
        image_bytes = base64.b64decode(image_data)
        
        # PIL Image로 변환
        image = Image.open(io.BytesIO(image_bytes))
        
        # numpy array로 변환
        image_array = np.array(image)
        
        # 얼굴 인식
        result = face_system.recognize_face(image_array)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'서버 오류: {str(e)}'
        }), 500

@app.route('/add-person', methods=['POST'])
def add_person():  # self, image_path, name, relation 제거!
    """새로운 사람 등록"""
    print("=== /add-person 요청 받음 ===")
    try:
        data = request.get_json()
        name = data.get('name')
        relation = data.get('relation')
        image_base64 = data.get('image')
        
        if not name or not relation or not image_base64:
            return jsonify({'error': '필수 데이터가 누락되었습니다'}), 400
        
        print(f"받은 데이터 - 이름: {name}, 관계: {relation}")
        
        # Base64 디코딩
        print("Base64 디코딩 시작...")
        image_data = base64.b64decode(image_base64)
        print(f"디코딩된 이미지 크기: {len(image_data)} bytes")
        
        # 영문 파일명 사용
        temp_filename = f'temp_{uuid.uuid4().hex}.jpg'
        temp_path = os.path.join('temp_images', temp_filename)
        
        # temp_images 폴더 생성
        os.makedirs('temp_images', exist_ok=True)
        
        # 임시 파일 저장
        with open(temp_path, 'wb') as f:
            f.write(image_data)
        print(f"임시 파일 저장: {temp_path}")
        
        # 얼굴 등록
        print("얼굴 등록 시작...")
        success, message = face_system.add_person(temp_path, name, relation)
        print(f"등록 결과: {success}, {message}")
        
        # 임시 파일 삭제
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print("임시 파일 삭제 완료")
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        print(f"!!! 예상치 못한 에러 !!!\n에러: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    """
    새로운 사람 추가 (DeepFace 사용)
    """
    try:
        # cv2로 이미지 읽기 (한글 경로 문제 해결)
        import cv2
        img_array = cv2.imread(image_path)
        
        if img_array is None:
            return False, "이미지를 읽을 수 없습니다."
        
        print(f"이미지 크기: {img_array.shape}")
        
        # numpy array로 직접 전달
        embedding_objs = DeepFace.represent(
            img_path=img_array,  # 경로 대신 array 전달
            model_name='Facenet',
            enforce_detection=False,
            detector_backend='opencv'
        )
        
        if len(embedding_objs) == 0:
            return False, "사진에서 얼굴을 찾을 수 없습니다."
        
        face_embedding = embedding_objs[0]['embedding']
        
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
    
@app.route('/persons', methods=['GET'])
def get_persons():
    """등록된 모든 사람 목록"""
    try:
        persons = face_system.get_all_persons()
        return jsonify({
            'success': True,
            'persons': persons
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'서버 오류: {str(e)}'
        }), 500

@app.route('/delete-person/<int:person_id>', methods=['DELETE'])
def delete_person(person_id):
    """사람 삭제"""
    try:
        success, message = face_system.delete_person(person_id)
        return jsonify({
            'success': success,
            'message': message
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'서버 오류: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("=" * 50)
    print("얼굴 인식 서버 시작")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)