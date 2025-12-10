#!/usr/bin/env python3
"""
누락된 캠페인의 기본 썸네일 생성 및 R2 업로드
"""
from PIL import Image, ImageDraw
import subprocess
import tempfile
import os

# 누락된 캠페인 ID 목록
missing_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 23]

# 기본 색상 팔레트 (보라색 계열)
colors = [
    ('#9333EA', '#EC4899'),  # 보라-핑크
    ('#7C3AED', '#A855F7'),  # 진보라-연보라
    ('#8B5CF6', '#C084FC'),  # 보라
    ('#6366F1', '#818CF8'),  # 인디고
    ('#EC4899', '#F472B6'),  # 핑크
]

print("🚀 누락된 캠페인 썸네일 생성 시작...\n")

success_count = 0
fail_count = 0

for idx, campaign_id in enumerate(missing_ids):
    color_pair = colors[idx % len(colors)]
    
    print(f"📤 Campaign {campaign_id}: 생성 및 업로드 중...")
    
    try:
        # 그라디언트 이미지 생성
        width, height = 400, 300
        image = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(image)
        
        # 수평 그라디언트
        for y in range(height):
            ratio = y / height
            r1, g1, b1 = int(color_pair[0][1:3], 16), int(color_pair[0][3:5], 16), int(color_pair[0][5:7], 16)
            r2, g2, b2 = int(color_pair[1][1:3], 16), int(color_pair[1][3:5], 16), int(color_pair[1][5:7], 16)
            
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)
            
            draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            image.save(tmp_file.name, 'JPEG', quality=85)
            tmp_path = tmp_file.name
        
        # R2에 업로드
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
            print(f"   ✅ 업로드 완료: {r2_key}")
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
print("\n🎉 썸네일 생성 완료!")
