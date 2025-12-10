-- 샘플 캠페인 10개 생성 SQL
-- 광고주 ID 1 (모빈관리자) 사용

-- 캠페인 1: 치킨 리뷰 (진행중 - recruiting)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots, 
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '🍗 황금 바삭 치킨 리뷰어 모집',
  '입안에서 살살 녹는 황금 치킨! 맛과 건강을 동시에 잡은 프리미엄 치킨을 소개해주실 인플루언서를 찾습니다.',
  '황금 바삭 치킨',
  '치킨 사진 3장 이상, 맛 평가, 배달 속도 언급',
  15,
  15000,
  'instagram',
  '2025-12-10',
  '2025-12-20',
  '2025-12-21',
  '2025-12-22',
  '2025-12-28',
  '2025-12-29',
  '황금 바삭 치킨 1마리 + 음료 2개',
  '인스타그램 피드에 치킨 사진과 리뷰 게시, #황금치킨 #치맥 해시태그 필수',
  '#황금치킨 #치맥 #야식추천 #배달음식',
  '배달 후 24시간 내 리뷰 작성 권장',
  'product_with_points',
  15000,
  'recruiting',
  datetime('now'),
  datetime('now')
);

-- 캠페인 2: 스킨케어 (진행중 - recruiting)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '✨ 럭셔리 안티에이징 크림 체험단',
  '피부과 전문의가 추천하는 프리미엄 안티에이징 크림! 주름 개선 효과를 직접 경험해보세요.',
  '골든 에이지 크림',
  '사용 전후 비교 사진, 2주 이상 사용 후기',
  20,
  20000,
  'blog',
  '2025-12-10',
  '2025-12-25',
  '2025-12-26',
  '2025-12-27',
  '2026-01-15',
  '2026-01-16',
  '골든 에이지 크림 50ml (정품)',
  '블로그에 사용 후기 작성, Before/After 사진 포함',
  '#안티에이징 #주름개선 #스킨케어 #뷰티',
  '민감성 피부도 사용 가능한 순한 성분',
  'product_with_points',
  20000,
  'recruiting',
  datetime('now', '-1 hour'),
  datetime('now', '-1 hour')
);

-- 캠페인 3: 카페 디저트 (진행중 - recruiting)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '🍰 달콤한 딸기 케이크 카페 방문 리뷰',
  '시즌 한정 딸기 케이크가 출시되었습니다! 감성 가득한 카페 분위기와 함께 즐겨주세요.',
  '스트로베리 드림 케이크',
  '케이크 + 카페 인테리어 사진 4장 이상',
  12,
  12000,
  'instagram',
  '2025-12-10',
  '2025-12-18',
  '2025-12-19',
  '2025-12-20',
  '2025-12-23',
  '2025-12-24',
  '딸기 케이크 1조각 + 아메리카노',
  '인스타그램 릴스 또는 피드 게시, 카페 위치 태그 필수',
  '#딸기케이크 #카페 #디저트 #감성카페',
  '서울 강남/홍대/이태원 지역 카페',
  'voucher_with_points',
  12000,
  'recruiting',
  datetime('now', '-2 hours'),
  datetime('now', '-2 hours')
);

-- 캠페인 4: 건강 보조식품 (종료됨 - completed)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '💊 면역력 UP! 프리미엄 비타민 체험단',
  '바쁜 현대인을 위한 올인원 멀티비타민! 하루 한 알로 건강 관리를 시작하세요.',
  '이뮨부스트 멀티비타민',
  '1개월 복용 후기, 건강 변화 솔직 리뷰',
  30,
  18000,
  'blog',
  '2025-11-10',
  '2025-11-20',
  '2025-11-21',
  '2025-11-22',
  '2025-12-05',
  '2025-12-06',
  '이뮨부스트 멀티비타민 1개월분',
  '블로그 상세 후기 작성, 제품 사진 3장 이상',
  '#비타민 #건강식품 #면역력 #영양제',
  '의학적 효능 과장 금지',
  'product_with_points',
  18000,
  'completed',
  datetime('now', '-30 days'),
  datetime('now', '-5 days')
);

-- 캠페인 5: 스낵 (종료됨 - completed)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '🍯 꿀버터 감자칩 SNS 리뷰어 모집',
  '달콤 짭짤한 중독성 있는 맛! 한 번 먹으면 멈출 수 없는 꿀버터 감자칩을 소개합니다.',
  '꿀버터 크리스피 칩',
  '제품 사진 2장, 맛 평가, 재구매 의향',
  25,
  10000,
  'instagram',
  '2025-11-15',
  '2025-11-25',
  '2025-11-26',
  '2025-11-27',
  '2025-12-03',
  '2025-12-04',
  '꿀버터 감자칩 3봉지',
  '인스타그램 스토리 또는 피드 게시',
  '#꿀버터칩 #간식 #스낵 #맛스타그램',
  '알레르기 주의: 우유, 대두 함유',
  'product_with_points',
  10000,
  'completed',
  datetime('now', '-25 days'),
  datetime('now', '-7 days')
);

-- 캠페인 6: 커피 (진행중 - recruiting)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '☕ 프리미엄 원두 커피 홈카페 리뷰',
  '콜롬비아 스페셜티 원두로 만드는 나만의 홈카페! 커피 애호가를 위한 프리미엄 원두입니다.',
  '콜롬비아 수프리모 원두',
  '추출 과정 사진, 맛 평가, 원두 특징 설명',
  18,
  16000,
  'blog',
  '2025-12-09',
  '2025-12-22',
  '2025-12-23',
  '2025-12-24',
  '2026-01-05',
  '2026-01-06',
  '콜롬비아 수프리모 원두 200g',
  '블로그 상세 리뷰, 핸드드립 과정 사진 포함',
  '#홈카페 #원두커피 #콜롬비아커피 #스페셜티',
  '핸드드립 또는 에스프레소 머신 추출 권장',
  'product_with_points',
  16000,
  'recruiting',
  datetime('now', '-3 hours'),
  datetime('now', '-3 hours')
);

-- 캠페인 7: 패션 (종료됨 - completed)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '👜 미니멀 레더 가방 스타일링',
  '어떤 옷에도 어울리는 심플한 디자인! 데일리룩에 포인트를 더해줄 가방을 소개합니다.',
  '베이직 레더 크로스백',
  '스타일링 사진 5장 이상, 코디 설명',
  15,
  25000,
  'instagram',
  '2025-11-20',
  '2025-11-30',
  '2025-12-01',
  '2025-12-02',
  '2025-12-09',
  '2025-12-10',
  '베이직 레더 크로스백 (색상 선택)',
  '인스타그램 피드에 스타일링 사진 게시, 여러 코디 제안',
  '#데일리백 #크로스백 #미니멀패션 #OOTD',
  '베이지, 블랙, 그레이 중 선택',
  'product_with_points',
  25000,
  'completed',
  datetime('now', '-20 days'),
  datetime('now', '-1 day')
);

-- 캠페인 8: 홈 인테리어 (진행중 - recruiting)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '🌿 감성 세라믹 화병 인테리어 리뷰',
  '공간에 생기를 더하는 모던 세라믹 화병! 드라이플라워와 함께 연출해보세요.',
  '모던 세라믹 화병',
  '인테리어 적용 사진 3장, 스타일링 팁',
  10,
  14000,
  'instagram',
  '2025-12-10',
  '2025-12-19',
  '2025-12-20',
  '2025-12-21',
  '2025-12-25',
  '2025-12-26',
  '모던 세라믹 화병 + 드라이플라워 세트',
  '인스타그램에 인테리어 사진 게시, 스타일링 설명',
  '#홈인테리어 #화병 #드라이플라워 #감성인테리어',
  '미니멀, 북유럽 스타일 선호',
  'product_with_points',
  14000,
  'recruiting',
  datetime('now', '-5 hours'),
  datetime('now', '-5 hours')
);

-- 캠페인 9: 반려동물 (종료됨 - completed)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '🐶 반려견 건강 간식 체험단 모집',
  '수의사가 추천하는 자연주의 반려견 간식! 우리 아이 건강을 위한 최고의 선택입니다.',
  '내추럴 독 트릿',
  '강아지 먹는 모습 사진/영상, 반응 설명',
  20,
  13000,
  'youtube',
  '2025-11-18',
  '2025-11-28',
  '2025-11-29',
  '2025-11-30',
  '2025-12-07',
  '2025-12-08',
  '내추럴 독 트릿 300g',
  '유튜브 쇼츠 또는 영상 업로드, 강아지 반응 촬영',
  '#강아지간식 #반려견 #펫푸드 #반려동물',
  '소형견/중형견/대형견 모두 가능',
  'product_with_points',
  13000,
  'completed',
  datetime('now', '-22 days'),
  datetime('now', '-3 days')
);

-- 캠페인 10: 헬스 음료 (진행중 - recruiting)
INSERT INTO campaigns (
  advertiser_id, title, description, product_name, requirements, slots,
  point_reward, channel_type, application_start_date, application_end_date,
  announcement_date, content_start_date, content_end_date, result_announcement_date,
  provided_items, mission, keywords, notes, pricing_type, sphere_points,
  status, created_at, updated_at
) VALUES (
  2,
  '🥤 그린 디톡스 주스 건강 챌린지',
  '하루 한 잔으로 시작하는 건강한 아침! 신선한 채소와 과일로 만든 콜드프레스 주스입니다.',
  '그린 디톡스 주스',
  '7일 챌린지 인증, 몸의 변화 후기',
  15,
  17000,
  'blog',
  '2025-12-10',
  '2025-12-23',
  '2025-12-24',
  '2025-12-25',
  '2026-01-08',
  '2026-01-09',
  '그린 디톡스 주스 7일분',
  '블로그 일일 챌린지 인증, 최종 후기 작성',
  '#디톡스 #주스클렌즈 #건강음료 #다이어트',
  '공복 섭취 권장, 냉장 보관',
  'product_with_points',
  17000,
  'recruiting',
  datetime('now', '-6 hours'),
  datetime('now', '-6 hours')
);
