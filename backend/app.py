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
def add_person():
    """새로운 사람 등록"""
    print("=== /add-person 요청 받음 ===")
    try:
        data = request.get_json()
        name = data.get('name')
        relation = data.get('relation')
        images_base64 = data.get('images')  # ✅ 'image' → 'images' (배열)
        
        if not name or not relation or not images_base64:
            return jsonify({'error': '필수 데이터가 누락되었습니다'}), 400
        
        print(f"받은 데이터 - 이름: {name}, 관계: {relation}")
        print(f"받은 이미지 수: {len(images_base64)}장")
        
        # ✅ 여러 이미지를 임시 파일로 저장
        temp_paths = []
        os.makedirs('temp_images', exist_ok=True)
        
        for i, image_base64 in enumerate(images_base64):
            print(f"Base64 디코딩 시작... ({i+1}/{len(images_base64)})")
            image_data = base64.b64decode(image_base64)
            print(f"디코딩된 이미지 크기: {len(image_data)} bytes")
            
            temp_filename = f'temp_{uuid.uuid4().hex}_{i}.jpg'
            temp_path = os.path.join('temp_images', temp_filename)
            
            with open(temp_path, 'wb') as f:
                f.write(image_data)
            print(f"임시 파일 저장: {temp_path}")
            temp_paths.append(temp_path)
        
        # ✅ 여러 이미지로 등록
        print("얼굴 등록 시작...")
        success, message = face_system.add_person_multiple(temp_paths, name, relation)
        print(f"등록 결과: {success}, {message}")
        
        # 임시 파일들 삭제
        for path in temp_paths:
            if os.path.exists(path):
                os.remove(path)
        print("임시 파일들 삭제 완료")
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        print(f"!!! 에러: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
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