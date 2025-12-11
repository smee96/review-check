#!/usr/bin/env python3
"""
실제 상품 썸네일 Base64 추출 및 R2 업로드
"""
import json
import subprocess
import sys
import base64
import os

print("=" * 60)
print("실제 상품 이미지 복구 작업")
print("=" * 60)

# 1. DB에서 Base64 썸네일 추출
print("\n[1/3] DB에서 Base64 썸네일 추출 중...")
result = subprocess.run(
    ['npx', 'wrangler', 'd1', 'execute', 'review-spheres-v1-production', 
     '--remote', '--command=SELECT id, title, thumbnail_image FROM campaigns ORDER BY id'],
    capture_output=True,
    text=True,
    timeout=60
)

if result.returncode != 0:
    print(f"❌ 오류: {result.stderr}")
    sys.exit(1)

# 결과 파싱
lines = result.stdout.strip().split('\n')
campaigns = []

# 테이블 형식 파싱
for line in lines:
    if '│' in line and 'id' not in line.lower() and '─' not in line:
        parts = [p.strip() for p in line.split('│') if p.strip()]
        if len(parts) >= 3:
            try:
                campaign_id = int(parts[0])
                title = parts[1]
                thumbnail = parts[2] if len(parts) > 2 else None
                
                if thumbnail and thumbnail.startswith('data:image'):
                    campaigns.append({
                        'id': campaign_id,
                        'title': title,
                        'thumbnail': thumbnail
                    })
                    print(f"  ✓ 캠페인 {campaign_id}: {title[:30]}... ({len(thumbnail)} bytes)")
            except:
                continue

print(f"\n✓ 총 {len(campaigns)}개 Base64 이미지 발견")

if len(campaigns) == 0:
    print("❌ Base64 이미지가 없습니다. Time Travel이 제대로 안 된 것 같습니다.")
    sys.exit(1)

# 2. Base64를 R2에 업로드
print(f"\n[2/3] R2에 실제 상품 이미지 업로드 중...")
success_count = 0
fail_count = 0

for campaign in campaigns:
    campaign_id = campaign['id']
    thumbnail = campaign['thumbnail']
    
    try:
        # Base64 디코딩
        if thumbnail.startswith('data:image'):
            base64_data = thumbnail.split(',')[1]
        else:
            base64_data = thumbnail
        
        image_data = base64.b64decode(base64_data)
        
        # 임시 파일 저장
        temp_file = f'/tmp/campaign_{campaign_id}.jpg'
        with open(temp_file, 'wb') as f:
            f.write(image_data)
        
        # R2 업로드
        r2_filename = f'{campaign_id}.jpg'
        upload_result = subprocess.run(
            ['npx', 'wrangler', 'r2', 'object', 'put', 
             f'reviewsphere-images/{r2_filename}',
             '--file', temp_file,
             '--content-type', 'image/jpeg'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if upload_result.returncode == 0:
            print(f"  ✓ 캠페인 {campaign_id}: {len(image_data)} bytes 업로드 완료")
            success_count += 1
        else:
            print(f"  ✗ 캠페인 {campaign_id}: 업로드 실패 - {upload_result.stderr[:50]}")
            fail_count += 1
        
        # 임시 파일 삭제
        os.remove(temp_file)
        
    except Exception as e:
        print(f"  ✗ 캠페인 {campaign_id}: 오류 - {str(e)[:50]}")
        fail_count += 1

print(f"\n[3/3] 업로드 완료:")
print(f"  ✓ 성공: {success_count}개")
print(f"  ✗ 실패: {fail_count}개")

if success_count > 0:
    print(f"\n✅ 실제 상품 이미지 복구 완료!")
    print(f"   - R2에 {success_count}개 이미지 업로드됨")
    print(f"   - DB는 이미 R2 URL로 설정되어 있음")
    print(f"   - 속도 개선 효과 유지됨")
else:
    print(f"\n❌ 복구 실패")
    sys.exit(1)
