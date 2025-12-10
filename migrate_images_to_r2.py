#!/usr/bin/env python3
"""
Base64 썸네일 이미지를 R2로 마이그레이션
"""
import json
import subprocess
import base64
import tempfile
import os

print("🚀 R2 이미지 마이그레이션 시작...\n")

# 1. DB에서 Base64 썸네일이 있는 캠페인 조회
print("📊 Step 1: DB에서 썸네일 데이터 조회 중...")
result = subprocess.run([
    'npx', 'wrangler', 'd1', 'execute', 
    'review-spheres-v1-production', '--remote',
    '--command', 
    'SELECT id, title, thumbnail_image FROM campaigns WHERE thumbnail_image IS NOT NULL AND thumbnail_image != ""'
], capture_output=True, text=True, cwd='/home/user/webapp')

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
    print(f"✅ {len(campaigns)}개 캠페인 발견\n")
except Exception as e:
    print(f"❌ JSON 파싱 오류: {e}")
    exit(1)

# 2. 각 캠페인의 썸네일을 R2에 업로드
update_sql = []
success_count = 0
skip_count = 0

for campaign in campaigns:
    campaign_id = campaign['id']
    title = campaign['title']
    thumbnail_base64 = campaign['thumbnail_image']
    
    # Base64가 아닌 경우 (이미 R2 URL인 경우) 스킵
    if not thumbnail_base64.startswith('data:image'):
        print(f"⏭️  Campaign {campaign_id}: 이미 R2 URL - 스킵")
        skip_count += 1
        continue
    
    print(f"📤 Campaign {campaign_id} ({title[:30]}...): 업로드 중...")
    
    try:
        # Base64 디코딩
        base64_data = thumbnail_base64.split(',')[1]
        image_data = base64.b64decode(base64_data)
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            tmp_file.write(image_data)
            tmp_path = tmp_file.name
        
        # R2에 업로드
        r2_key = f'campaign-thumbnails/{campaign_id}.jpg'
        upload_result = subprocess.run([
            'npx', 'wrangler', 'r2', 'object', 'put',
            f'reviewsphere-images/{r2_key}',
            '--file', tmp_path,
            '--content-type', 'image/jpeg'
        ], capture_output=True, text=True, cwd='/home/user/webapp')
        
        # 임시 파일 삭제
        os.unlink(tmp_path)
        
        if upload_result.returncode == 0:
            # R2 URL 생성 (Cloudflare Workers 경로)
            r2_url = f'/api/images/{campaign_id}.jpg'
            
            # SQL 업데이트 쿼리 추가
            update_sql.append(f"UPDATE campaigns SET thumbnail_image = '{r2_url}' WHERE id = {campaign_id};")
            
            print(f"   ✅ 업로드 완료: {r2_url}")
            success_count += 1
        else:
            print(f"   ❌ 업로드 실패: {upload_result.stderr}")
    
    except Exception as e:
        print(f"   ❌ 오류: {e}")

print(f"\n📊 마이그레이션 결과:")
print(f"   ✅ 성공: {success_count}개")
print(f"   ⏭️  스킵: {skip_count}개")
print(f"   ❌ 실패: {len(campaigns) - success_count - skip_count}개")

# 3. SQL 파일 생성
if update_sql:
    with open('/home/user/webapp/update_r2_urls.sql', 'w') as f:
        f.write("-- R2 URL로 업데이트\n\n")
        f.write('\n'.join(update_sql))
    
    print(f"\n✅ SQL 파일 생성: update_r2_urls.sql")
    print(f"   총 {len(update_sql)}개 업데이트 쿼리")
else:
    print("\n⚠️  업데이트할 항목이 없습니다.")

print("\n🎉 마이그레이션 준비 완료!")
print("\n다음 단계:")
print("1. wrangler.jsonc에 R2 바인딩 추가")
print("2. 이미지 제공 API 엔드포인트 추가")
print("3. DB 업데이트 실행")
