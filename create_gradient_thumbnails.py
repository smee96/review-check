#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import base64
from io import BytesIO

# 각 캠페인의 테마 색상
campaign_colors = {
    13: ("#FFD700", "#FFA500", "🍗"),  # 치킨 - 황금색
    14: ("#FFB6C1", "#FFC0CB", "✨"),  # 크림 - 핑크
    15: ("#FFB6C1", "#FF69B4", "🍰"),  # 케이크 - 핑크
    16: ("#98FB98", "#90EE90", "💊"),  # 비타민 - 그린
    17: ("#FFD700", "#FFA500", "🍯"),  # 칩스 - 황금색
    18: ("#8B4513", "#A0522D", "☕"),  # 커피 - 브라운
    19: ("#F5DEB3", "#D2B48C", "👜"),  # 가방 - 베이지
    20: ("#E6E6FA", "#D8BFD8", "🌿"),  # 화병 - 라벤더
    21: ("#FFA07A", "#FF7F50", "🐶"),  # 강아지 - 코랄
    22: ("#7CFC00", "#32CD32", "🥤"),  # 주스 - 라임그린
}

def create_gradient_thumbnail(color1, color2, emoji, size=(400, 400)):
    """그라디언트 배경에 이모지가 있는 썸네일 생성"""
    # 이미지 생성
    img = Image.new('RGB', size, color1)
    draw = ImageDraw.Draw(img)
    
    # 그라디언트 효과
    for i in range(size[1]):
        # RGB 값 계산
        r1, g1, b1 = tuple(int(color1[j:j+2], 16) for j in (1, 3, 5))
        r2, g2, b2 = tuple(int(color2[j:j+2], 16) for j in (1, 3, 5))
        
        ratio = i / size[1]
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        
        draw.line([(0, i), (size[0], i)], fill=(r, g, b))
    
    # 중앙에 큰 이모지 텍스트 추가 (폰트 없이)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 120)
    except:
        font = ImageFont.load_default()
    
    # 텍스트 위치 계산 (중앙)
    text = emoji
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
    
    # 그림자 효과
    shadow_offset = 3
    draw.text((position[0] + shadow_offset, position[1] + shadow_offset), 
              text, font=font, fill=(0, 0, 0, 128))
    draw.text(position, text, font=font, fill=(255, 255, 255))
    
    return img

# 각 캠페인 썸네일 생성
for campaign_id, (color1, color2, emoji) in campaign_colors.items():
    print(f"Creating thumbnail for campaign {campaign_id}...")
    
    img = create_gradient_thumbnail(color1, color2, emoji)
    
    # BytesIO를 사용하여 메모리에 저장
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    buffer.seek(0)
    
    # base64 인코딩
    base64_image = base64.b64encode(buffer.read()).decode('utf-8')
    data_uri = f"data:image/jpeg;base64,{base64_image}"
    
    # 파일로 저장
    with open(f'campaign_{campaign_id}_base64.txt', 'w') as f:
        f.write(data_uri)
    
    print(f"✅ Campaign {campaign_id}: {len(base64_image)} chars ({emoji})")

print("\n✅ All thumbnails created!")
