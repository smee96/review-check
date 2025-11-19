-- 간단한 테스트 캠페인만 추가

-- 테스트 캠페인 1: 뷰티/화장품
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, product_value, sphere_points,
  pricing_type, slots, start_date, end_date, content_deadline,
  platform, category, mission, keywords, notes, status, admin_note, created_at
) VALUES (
  1,
  '[신제품] 프리미엄 수분 크림 리뷰어 모집',
  '새로 출시된 고보습 페이스 크림의 솔직한 사용 후기를 공유해주실 뷰티 인플루언서를 모집합니다. 건조한 계절에 딱 맞는 제품으로, 48시간 지속 보습을 자랑합니다.',
  '글로우 하이드레이션 크림 50ml',
  45000,
  20000,
  'product_with_points',
  5,
  date('now', '+2 days'),
  date('now', '+30 days'),
  date('now', '+25 days'),
  'instagram',
  '뷰티/화장품',
  '제품 사진 3장 이상 포함
피부타입별 사용감 상세 리뷰
해시태그 필수: #글로우크림 #보습크림추천',
  '수분크림,페이스크림,보습,건성피부,겨울스킨케어',
  '제품은 택배로 일괄 발송됩니다. 사용 후 1주일 이내 리뷰 작성 부탁드립니다.',
  'approved',
  '승인완료 - 우수 캠페인',
  datetime('now', '-5 days')
);

-- 테스트 캠페인 2: 카페/음식점
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, product_value, sphere_points,
  pricing_type, slots, start_date, end_date, content_deadline,
  platform, category, mission, keywords, notes, status, admin_note, created_at
) VALUES (
  1,
  '강남 신규 브런치 카페 방문 리뷰어 모집',
  '강남역 10번 출구 앞 새로 오픈한 브런치 카페의 분위기와 메뉴를 소개해주실 푸드 인플루언서를 찾습니다. 인스타그래머블한 인테리어와 맛있는 브런치 메뉴가 준비되어 있습니다.',
  '브런치 세트 + 음료 2잔',
  35000,
  15000,
  'voucher_with_points',
  10,
  date('now', '+1 day'),
  date('now', '+20 days'),
  date('now', '+18 days'),
  'instagram',
  '맛집/음식점',
  '카페 외관 및 내부 인테리어 사진
음식 사진 (플레이팅 중점)
맛 평가 및 분위기 설명
해시태그: #강남브런치 #카페추천',
  '브런치카페,강남맛집,카페투어,브런치맛집',
  '예약은 개별적으로 진행해주세요. 방문 후 영수증 인증 필요합니다.',
  'approved',
  '승인완료',
  datetime('now', '-3 days')
);

-- 테스트 캠페인 3: 패션
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, product_value, sphere_points,
  pricing_type, slots, start_date, end_date, content_deadline,
  platform, category, mission, keywords, notes, status, admin_note, created_at
) VALUES (
  1,
  '겨울 니트 신상 협찬 인플루언서 모집',
  '따뜻하고 세련된 디자인의 겨울 니트를 착용하고 스타일링을 공유해주실 패션 인플루언서를 모집합니다. 다양한 컬러와 핏으로 준비되어 있습니다.',
  '프리미엄 울 니트 (색상 선택 가능)',
  89000,
  30000,
  'product_with_points',
  8,
  date('now', '+3 days'),
  date('now', '+40 days'),
  date('now', '+35 days'),
  'instagram',
  '패션/의류',
  '니트 착용 전신샷 2장 이상
다양한 각도에서 촬영
스타일링 팁 공유
해시태그: #겨울니트 #데일리룩',
  '니트,겨울패션,데일리룩,OOTD',
  '사이즈는 신청 시 선택 가능합니다. 반품은 불가하니 신중히 선택해주세요.',
  'approved',
  '승인완료',
  datetime('now', '-1 day')
);

-- 테스트 캠페인 4: 전자제품
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, product_value, sphere_points,
  pricing_type, slots, start_date, end_date, content_deadline,
  platform, category, mission, keywords, notes, status, admin_note, created_at
) VALUES (
  1,
  '프리미엄 무선 이어폰 체험단 모집',
  '최신 노이즈캔슬링 기술이 적용된 무선 이어폰의 음질과 성능을 테스트하고 리뷰해주실 테크 리뷰어를 찾습니다.',
  '노이즈캔슬링 무선 이어폰',
  129000,
  25000,
  'product_with_points',
  5,
  date('now', '+5 days'),
  date('now', '+35 days'),
  date('now', '+30 days'),
  'youtube',
  '전자제품/가전',
  '언박싱 영상 또는 사진
음질 테스트 및 평가
노이즈캔슬링 효과 리뷰
사용 후 장단점 정리',
  '무선이어폰,블루투스이어폰,노이즈캔슬링,테크리뷰',
  '제품은 반납 불필요하며, 정직한 리뷰를 부탁드립니다.',
  'approved',
  '승인완료',
  datetime('now', '-2 days')
);

-- 테스트 캠페인 5: 맛집
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, product_value, sphere_points,
  pricing_type, slots, start_date, end_date, content_deadline,
  platform, category, mission, keywords, notes, status, admin_note, created_at
) VALUES (
  1,
  '프리미엄 한우 BBQ 레스토랑 방문 리뷰',
  '최상급 한우를 사용하는 프리미엄 레스토랑의 방문 리뷰어를 모집합니다. 고급스러운 분위기와 최고급 식재료를 경험해보세요.',
  '한우 코스 세트 (2인)',
  180000,
  50000,
  'voucher_with_points',
  6,
  date('now', '+7 days'),
  date('now', '+45 days'),
  date('now', '+40 days'),
  'blog',
  '맛집/음식점',
  '레스토랑 분위기 및 인테리어
음식 비주얼 사진 (최소 5장)
맛 평가 상세 작성
서비스 품질 평가
재방문 의사 표현',
  '한우맛집,프리미엄레스토랑,고깃집추천,데이트코스',
  '예약 필수이며, 예약 시 "리뷰스피어 캠페인"이라고 말씀해주세요.',
  'approved',
  '승인완료 - 고가 캠페인',
  datetime('now', '-4 days')
);

SELECT 'Test campaigns inserted successfully!' as message;
SELECT COUNT(*) as total_campaigns FROM campaigns;
