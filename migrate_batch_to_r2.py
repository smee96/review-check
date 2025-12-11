#!/usr/bin/env python3
"""
Base64 이미지를 배치로 R2 마이그레이션 (5개씩)
"""
import json
import subprocess
import base64
import tempfile
import os
import sys

batch_size = 5
start_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1

print(f"🚀 Base64 → R2 배치 마이그레이션 (ID {start_id}부터 {batch_size}개)...\n")

# 1. DB에서 Base64 썸네일 조회 (LIMIT)
print(f"📊 Step 1: DB에서 Base64 썸네일 조회 중...")
result = subprocess.run([
    'npx', 'wrangler', 'd1', 'execute', 
    'review-spheres-v1-production', '--remote',
    '--command', 
    f'SELECT id, title, thumbnail_image FROM campaigns WHERE id >= {start_id} AND thumbnail_image IS NOT NULL AND thumbnail_image LIKE "data:image%" ORDER BY id LIMIT {batch_size}'
], capture_output=True, text=True, cwd='/home/user/webapp', timeout=60)

if result.returncode != 0:
    print(f"❌ 오류: {result.stderr}")
    exit(1)

# JSON 파싱
try:
    output_lines = result.stdout.split('\n')
    json_start = False
    json_str = ''
    for line in output_lines:
        if line.strip().startswith('['):
            json_start = True
        if json_start:
            json_str += line
    
    data = json.loads(json_str)
    campaigns = data[0]['results']
    print(f"✅ {len(campaigns)}개 발견\n")
except Exception as e:
    print(f"❌ JSON 파싱 오류: {e}")
    exit(1)

if len(campaigns) == 0:
    print("✅ 마이그레이션 완료!")
    exit(0)

# 2. R2 업로드
success_count = 0
for campaign in campaigns:
    campaign_id = campaign['id']
    title = campaign['title']
    thumbnail_base64 = campaign['thumbnail_image']
    
    print(f"📤 ID {campaign_id}: 업로드 중...")
    
    try:
        base64_data = thumbnail_base64.split(',')[1]
        image_data = base64.b64decode(base64_data)
        
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            tmp_file.write(image_data)
            tmp_path = tmp_file.name
        
        upload_result = subprocess.run([
            'npx', 'wrangler', 'r2', 'object', 'put',
            f'reviewsphere-images/{campaign_id}.jpg',
            '--file', tmp_path,
            '--content-type', 'image/jpeg',
            '--remote'
        ], capture_output=True, text=True, cwd='/home/user/webapp', timeout=30)
        
        os.unlink(tmp_path)
        
        if upload_result.returncode == 0:
            # DB 업데이트
            db_result = subprocess.run([
                'npx', 'wrangler', 'd1', 'execute',
                'review-spheres-v1-production', '--remote',
                '--command',
                f"UPDATE campaigns SET thumbnail_image = '/api/images/{campaign_id}.jpg' WHERE id = {campaign_id}"
            ], capture_output=True, text=True, cwd='/home/user/webapp', timeout=30)
            
            if db_result.returncode == 0:
                print(f"   ✅ 완료")
                success_count += 1
            else:
                print(f"   ⚠️  DB 업데이트 실패")
        else:
            print(f"   ❌ 업로드 실패")
    
    except Exception as e:
        print(f"   ❌ 오류: {e}")

print(f"\n✅ 배치 완료: {success_count}/{len(campaigns)}개")

# 다음 배치가 있으면 ID 출력
if len(campaigns) == batch_size:
    next_id = campaigns[-1]['id'] + 1
    print(f"\n다음 실행: python3 migrate_batch_to_r2.py {next_id}")
