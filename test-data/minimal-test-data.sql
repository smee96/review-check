-- 최소한의 테스트 캠페인 데이터
-- advertiser_id는 기존 광고주(3)를 사용

INSERT INTO campaigns (
  advertiser_id, title, description, product_name, budget, slots,
  status, channel_type, mission, keywords, created_at
) VALUES (
  3,
  '[신제품] 프리미엄 수분 크림 리뷰어 모집',
  '새로 출시된 고보습 페이스 크림의 솔직한 사용 후기를 공유해주실 뷰티 인플루언서를 모집합니다.',
  '글로우 하이드레이션 크림 50ml',
  650000,
  5,
  'approved',
  'instagram',
  '제품 사진 3장 이상 포함, 피부타입별 사용감 상세 리뷰, 해시태그 필수: #글로우크림 #보습크림추천',
  '수분크림,페이스크림,보습',
  datetime('now', '-5 days')
);

INSERT INTO campaigns (
  advertiser_id, title, description, product_name, budget, slots,
  status, channel_type, mission, keywords, created_at
) VALUES (
  3,
  '강남 신규 브런치 카페 방문 리뷰어 모집',
  '강남역 10번 출구 앞 새로 오픈한 브런치 카페의 분위기와 메뉴를 소개해주실 푸드 인플루언서를 찾습니다.',
  '브런치 세트 + 음료 2잔',
  500000,
  10,
  'approved',
  'instagram',
  '카페 외관 및 내부 인테리어 사진, 음식 사진 (플레이팅 중점), 맛 평가 및 분위기 설명',
  '브런치카페,강남맛집,카페투어',
  datetime('now', '-3 days')
);

INSERT INTO campaigns (
  advertiser_id, title, description, product_name, budget, slots,
  status, channel_type, mission, keywords, created_at
) VALUES (
  3,
  '겨울 니트 신상 협찬 인플루언서 모집',
  '따뜻하고 세련된 디자인의 겨울 니트를 착용하고 스타일링을 공유해주실 패션 인플루언서를 모집합니다.',
  '프리미엄 울 니트 (색상 선택 가능)',
  950000,
  8,
  'approved',
  'instagram',
  '니트 착용 전신샷 2장 이상, 다양한 각도에서 촬영, 스타일링 팁 공유',
  '니트,겨울패션,데일리룩',
  datetime('now', '-1 day')
);

INSERT INTO campaigns (
  advertiser_id, title, description, product_name, budget, slots,
  status, channel_type, mission, keywords, created_at
) VALUES (
  3,
  '프리미엄 무선 이어폰 체험단 모집',
  '최신 노이즈캔슬링 기술이 적용된 무선 이어폰의 음질과 성능을 테스트하고 리뷰해주실 테크 리뷰어를 찾습니다.',
  '노이즈캔슬링 무선 이어폰',
  770000,
  5,
  'approved',
  'youtube',
  '언박싱 영상 또는 사진, 음질 테스트 및 평가, 사용 후 장단점 정리',
  '무선이어폰,블루투스이어폰,노이즈캔슬링',
  datetime('now', '-2 days')
);

INSERT INTO campaigns (
  advertiser_id, title, description, product_name, budget, slots,
  status, channel_type, mission, keywords, created_at
) VALUES (
  3,
  '프리미엄 한우 BBQ 레스토랑 방문 리뷰',
  '최상급 한우를 사용하는 프리미엄 레스토랑의 방문 리뷰어를 모집합니다.',
  '한우 코스 세트 (2인)',
  1380000,
  6,
  'approved',
  'blog',
  '레스토랑 분위기 및 인테리어, 음식 비주얼 사진 (최소 5장), 맛 평가 상세 작성',
  '한우맛집,프리미엄레스토랑,고깃집추천',
  datetime('now', '-4 days')
);

SELECT 'Test campaigns inserted!' as result;
SELECT COUNT(*) as total FROM campaigns;
