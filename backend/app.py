from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import io
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
    try:
        # 파일과 폼 데이터 받기
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': '이미지 파일이 없습니다.'
            }), 400
        
        file = request.files['image']
        name = request.form.get('name')
        relation = request.form.get('relation')
        
        if not name or not relation:
            return jsonify({
                'success': False,
                'message': '이름과 관계를 입력해주세요.'
            }), 400
        
        # 임시 파일로 저장
        temp_path = f'temp_{name}.jpg'
        file.save(temp_path)
        
        # 얼굴 등록
        success, message = face_system.add_person(temp_path, name, relation)
        
        # 임시 파일 삭제
        import os
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({
            'success': success,
            'message': message
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'서버 오류: {str(e)}'
        }), 500

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