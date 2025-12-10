#!/usr/bin/env python3
import requests
import base64
import json

# 캠페인 ID와 이미지 URL 매핑
campaign_images = {
    13: "https://www.genspark.ai/api/files/s/hzzoYWMg",  # 치킨 (워터마크)
    14: "https://www.genspark.ai/api/files/s/aarNn8x7",  # 크림 (워터마크)
    15: "https://www.genspark.ai/api/files/s/tBJxzquZ",  # 케이크 (워터마크)
    16: "https://www.genspark.ai/api/files/s/Q2JJD75J",  # 비타민 (워터마크)
    17: "https://www.genspark.ai/api/files/s/AvJqPaJP",  # 칩스 (워터마크)
    18: "https://www.genspark.ai/api/files/s/jm9i7H3j",  # 커피 (워터마크)
    19: "https://www.genspark.ai/api/files/s/pVQOqAmV",  # 가방 (워터마크)
    20: "https://www.genspark.ai/api/files/s/Ho2d1CUg",  # 화병 (워터마크)
    21: "https://www.genspark.ai/api/files/s/GEExIRzw",  # 강아지 (워터마크)
    22: "https://www.genspark.ai/api/files/s/CkgOi7C1",  # 주스 (워터마크)
}

# 각 이미지 다운로드 및 base64 변환
for campaign_id, image_url in campaign_images.items():
    try:
        print(f"Downloading image for campaign {campaign_id}...")
        response = requests.get(image_url, timeout=30, allow_redirects=True)
        
        if response.status_code == 200 and len(response.content) > 1000:
            # base64 인코딩
            base64_image = base64.b64encode(response.content).decode('utf-8')
            data_uri = f"data:image/jpeg;base64,{base64_image}"
            
            # 파일로 저장
            with open(f'campaign_{campaign_id}_base64.txt', 'w') as f:
                f.write(data_uri)
            
            print(f"✅ Campaign {campaign_id}: {len(response.content)} bytes -> {len(base64_image)} chars")
        else:
            print(f"❌ Campaign {campaign_id}: Failed (size: {len(response.content)} bytes)")
    except Exception as e:
        print(f"❌ Campaign {campaign_id}: Error - {str(e)}")

print("\n✅ All images downloaded and converted!")
