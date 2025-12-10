#!/usr/bin/env python3
"""
로컬 Base64 파일들을 R2에 업로드
"""
import subprocess
import base64
import tempfile
import os
import glob

print("🚀 Base64 파일 → R2 업로드 시작...\n")

# Base64 파일 목록
base64_files = glob.glob('/home/user/webapp/campaign_*_base64.txt')
print(f"📁 발견된 파일: {len(base64_files)}개\n")

success_count = 0
fail_count = 0

for file_path in sorted(base64_files):
    # 파일명에서 campaign ID 추출
    filename = os.path.basename(file_path)
    campaign_id = filename.replace('campaign_', '').replace('_base64.txt', '').replace('_base64_updated.txt', '')
    
    print(f"📤 Campaign {campaign_id}: 업로드 중...")
    
    try:
        # Base64 데이터 읽기
        with open(file_path, 'r') as f:
            base64_data = f.read().strip()
        
        # Base64 디코딩
        if base64_data.startswith('data:image'):
            base64_data = base64_data.split(',')[1]
        
        image_data = base64.b64decode(base64_data)
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            tmp_file.write(image_data)
            tmp_path = tmp_file.name
        
        # R2에 업로드 (간단한 키: {id}.jpg)
        r2_key = f'{campaign_id}.jpg'
        upload_result = subprocess.run([
            'npx', 'wrangler', 'r2', 'object', 'put',
            f'reviewsphere-images/{r2_key}',
            '--file', tmp_path,
            '--content-type', 'image/jpeg',
            '--remote'
        ], capture_output=True, text=True, cwd='/home/user/webapp')
        
        # 임시 파일 삭제
        os.unlink(tmp_path)
        
        if upload_result.returncode == 0:
            print(f"   ✅ 업로드 완료: {r2_key} ({len(image_data)} bytes)")
            success_count += 1
        else:
            print(f"   ❌ 업로드 실패: {upload_result.stderr}")
            fail_count += 1
    
    except Exception as e:
        print(f"   ❌ 오류: {e}")
        fail_count += 1

print(f"\n📊 업로드 결과:")
print(f"   ✅ 성공: {success_count}개")
print(f"   ❌ 실패: {fail_count}개")
print("\n🎉 R2 업로드 완료!")
