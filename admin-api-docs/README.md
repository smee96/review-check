# 체크앤리뷰 관리자 기능 API 문서

## 📋 목차
1. [인증 (Authentication)](#인증-authentication)
2. [캠페인 관리](#캠페인-관리)
3. [리뷰 관리](#리뷰-관리)
4. [가입자 목록](#가입자-목록)
5. [정산 관리](#정산-관리)
6. [시스템 설정](#시스템-설정)

---

## 🔐 인증 (Authentication)

### 기본 정보
- **Base URL**: `https://fa737302.checknreviews-v1.pages.dev` (현재 배포 URL)
- **인증 방식**: Session-based (Cookie)
- **관리자 권한**: `role === 'admin'`

### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password"
}

Response:
{
  "message": "로그인 성공",
  "user": {
    "user_id": 1,
    "email": "admin@example.com",
    "nickname": "관리자",
    "role": "admin"
  }
}
```

### 세션 확인
```http
GET /api/auth/me

Response:
{
  "user_id": 1,
  "email": "admin@example.com",
  "nickname": "관리자",
  "role": "admin",
  "sphere_points": 0
}
```

### 로그아웃
```http
POST /api/auth/logout

Response:
{
  "message": "로그아웃 성공"
}
```

---

## 📊 관리자 통계 API

### 대시보드 통계
```http
GET /api/admin/stats

Response:
{
  "today_visitors": 150,
  "total_users": 1234,
  "total_campaigns": 56,
  "active_campaigns": 23,
  "total_reviews": 789,
  "pending_settlements": 12,
  "total_settlement_amount": 5000000,
  "sphere_points_issued": 150000
}
```

---

## 📢 캠페인 관리

### 전체 캠페인 목록
```http
GET /api/admin/campaigns?status=all&page=1&limit=20

Parameters:
- status: all | active | pending | completed | cancelled
- page: 페이지 번호 (기본값: 1)
- limit: 페이지당 항목 수 (기본값: 20)

Response:
{
  "campaigns": [
    {
      "campaign_id": 1,
      "title": "신제품 리뷰 캠페인",
      "advertiser_id": 5,
      "advertiser_nickname": "광고주명",
      "status": "active",
      "category": "뷰티",
      "slots": 10,
      "budget": 500000,
      "product_value": 30000,
      "sphere_points": 5000,
      "application_count": 8,
      "approved_count": 5,
      "start_date": "2024-03-01",
      "end_date": "2024-03-31",
      "created_at": "2024-02-25T10:30:00Z"
    }
  ],
  "total": 56,
  "page": 1,
  "total_pages": 3
}
```

### 캠페인 상세 정보
```http
GET /api/campaigns/:campaign_id

Response:
{
  "campaign_id": 1,
  "title": "신제품 리뷰 캠페인",
  "description": "새로운 스킨케어 제품 리뷰 요청",
  "advertiser_id": 5,
  "advertiser_nickname": "광고주명",
  "advertiser_email": "advertiser@example.com",
  "status": "active",
  "category": "뷰티",
  "channel_type": "instagram",
  "slots": 10,
  "budget": 500000,
  "product_value": 30000,
  "sphere_points": 5000,
  "reward_type": "product_with_points",
  "thumbnail_url": "https://example.com/image.jpg",
  "missions": ["제품 사용 후 솔직한 리뷰", "해시태그 #신제품 포함"],
  "start_date": "2024-03-01",
  "end_date": "2024-03-31",
  "created_at": "2024-02-25T10:30:00Z",
  "updated_at": "2024-02-25T10:30:00Z"
}
```

### 캠페인 상태 변경
```http
PUT /api/admin/campaigns/:campaign_id/status
Content-Type: application/json

{
  "status": "active",  // active | pending | completed | cancelled
  "reason": "승인 완료" (선택사항)
}

Response:
{
  "message": "캠페인 상태가 변경되었습니다",
  "campaign_id": 1,
  "status": "active"
}
```

### 캠페인 삭제
```http
DELETE /api/admin/campaigns/:campaign_id

Response:
{
  "message": "캠페인이 삭제되었습니다"
}
```

---

## ⭐ 리뷰 관리

### 전체 리뷰 목록
```http
GET /api/admin/reviews?status=all&page=1&limit=20

Parameters:
- status: all | pending | approved | rejected
- page: 페이지 번호
- limit: 페이지당 항목 수

Response:
{
  "reviews": [
    {
      "review_id": 1,
      "campaign_id": 5,
      "campaign_title": "신제품 리뷰 캠페인",
      "influencer_id": 10,
      "influencer_nickname": "인플루언서명",
      "influencer_email": "influencer@example.com",
      "channel_type": "instagram",
      "post_url": "https://instagram.com/p/xxx",
      "content": "정말 좋은 제품이에요!",
      "status": "pending",
      "submitted_at": "2024-03-15T14:30:00Z",
      "reviewed_at": null,
      "reviewer_comment": null
    }
  ],
  "total": 789,
  "page": 1,
  "total_pages": 40
}
```

### 리뷰 상세 정보
```http
GET /api/admin/reviews/:review_id

Response:
{
  "review_id": 1,
  "campaign_id": 5,
  "campaign_title": "신제품 리뷰 캠페인",
  "influencer_id": 10,
  "influencer_nickname": "인플루언서명",
  "influencer_email": "influencer@example.com",
  "channel_type": "instagram",
  "post_url": "https://instagram.com/p/xxx",
  "content": "정말 좋은 제품이에요!",
  "image_urls": ["https://example.com/image1.jpg"],
  "status": "pending",
  "submitted_at": "2024-03-15T14:30:00Z",
  "reviewed_at": null,
  "reviewer_comment": null,
  "likes": 150,
  "comments": 25
}
```

### 리뷰 승인/거절
```http
PUT /api/admin/reviews/:review_id/status
Content-Type: application/json

{
  "status": "approved",  // approved | rejected
  "comment": "승인 완료" (선택사항)
}

Response:
{
  "message": "리뷰가 승인되었습니다",
  "review_id": 1,
  "status": "approved"
}
```

---

## 👥 가입자 목록

### 전체 사용자 목록
```http
GET /api/admin/users?role=all&page=1&limit=20

Parameters:
- role: all | advertiser | influencer | agency | rep
- page: 페이지 번호
- limit: 페이지당 항목 수
- search: 검색어 (이메일, 닉네임)

Response:
{
  "users": [
    {
      "user_id": 10,
      "email": "user@example.com",
      "nickname": "사용자명",
      "role": "influencer",
      "status": "active",
      "sphere_points": 15000,
      "created_at": "2024-01-15T09:20:00Z",
      "last_login": "2024-03-20T14:30:00Z"
    }
  ],
  "total": 1234,
  "page": 1,
  "total_pages": 62
}
```

### 사용자 상세 정보
```http
GET /api/admin/users/:user_id

Response:
{
  "user_id": 10,
  "email": "user@example.com",
  "nickname": "사용자명",
  "role": "influencer",
  "status": "active",
  "sphere_points": 15000,
  "created_at": "2024-01-15T09:20:00Z",
  "last_login": "2024-03-20T14:30:00Z",
  "profile": {
    "real_name": "홍길동",
    "contact_phone": "010-1234-5678",
    "instagram_handle": "@username",
    "follower_count": 5000,
    "category": "뷰티"
  },
  "statistics": {
    "total_applications": 25,
    "approved_applications": 20,
    "completed_reviews": 18,
    "total_earned_points": 90000
  }
}
```

### 사용자 상태 변경
```http
PUT /api/admin/users/:user_id/status
Content-Type: application/json

{
  "status": "active"  // active | suspended | banned
}

Response:
{
  "message": "사용자 상태가 변경되었습니다",
  "user_id": 10,
  "status": "active"
}
```

### 사용자 포인트 조정
```http
POST /api/admin/users/:user_id/points
Content-Type: application/json

{
  "amount": 5000,  // 양수: 지급, 음수: 차감
  "reason": "이벤트 참여 보상"
}

Response:
{
  "message": "포인트가 조정되었습니다",
  "user_id": 10,
  "previous_points": 15000,
  "adjusted_points": 20000,
  "amount": 5000
}
```

---

## 💰 정산 관리

### 정산 요청 목록
```http
GET /api/admin/settlements?status=all&page=1&limit=20

Parameters:
- status: all | pending | approved | rejected | completed
- page: 페이지 번호
- limit: 페이지당 항목 수

Response:
{
  "settlements": [
    {
      "settlement_id": 1,
      "user_id": 10,
      "user_nickname": "인플루언서명",
      "user_email": "influencer@example.com",
      "amount": 100000,
      "bank_name": "국민은행",
      "account_number": "123-456-789012",
      "account_holder": "홍길동",
      "status": "pending",
      "requested_at": "2024-03-20T10:00:00Z",
      "processed_at": null,
      "admin_comment": null
    }
  ],
  "total": 12,
  "page": 1,
  "total_pages": 1
}
```

### 정산 상세 정보
```http
GET /api/admin/settlements/:settlement_id

Response:
{
  "settlement_id": 1,
  "user_id": 10,
  "user_nickname": "인플루언서명",
  "user_email": "influencer@example.com",
  "amount": 100000,
  "bank_name": "국민은행",
  "account_number": "123-456-789012",
  "account_holder": "홍길동",
  "business_number": "123-45-67890",
  "contact_phone": "010-1234-5678",
  "status": "pending",
  "requested_at": "2024-03-20T10:00:00Z",
  "processed_at": null,
  "admin_comment": null,
  "related_reviews": [
    {
      "review_id": 5,
      "campaign_title": "캠페인명",
      "submitted_at": "2024-03-15T14:30:00Z"
    }
  ]
}
```

### 정산 승인/거절
```http
PUT /api/admin/settlements/:settlement_id/status
Content-Type: application/json

{
  "status": "approved",  // approved | rejected | completed
  "comment": "정산 완료" (선택사항)
}

Response:
{
  "message": "정산이 승인되었습니다",
  "settlement_id": 1,
  "status": "approved"
}
```

### 정산 내역 CSV 다운로드
```http
GET /api/admin/settlements/export?start_date=2024-03-01&end_date=2024-03-31

Parameters:
- start_date: 시작일 (YYYY-MM-DD)
- end_date: 종료일 (YYYY-MM-DD)

Response:
Content-Type: text/csv
Content-Disposition: attachment; filename="settlements_2024-03-01_2024-03-31.csv"

캠페인,인플루언서,이메일,금액,은행,계좌번호,예금주,연락처,사업자번호,요청일
...
```

---

## ⚙️ 시스템 설정

### 시스템 설정 조회
```http
GET /api/admin/settings

Response:
{
  "points_fee_rate": 30,  // 포인트 수수료율 (%)
  "fixed_fee_points_only": 10000,  // 포인트 전용 고정 수수료
  "fixed_fee_purchase_with_points": 10000,  // 구매+포인트 고정 수수료
  "fixed_fee_product_only": 10000,  // 상품 전용 고정 수수료
  "fixed_fee_product_with_points": 10000,  // 상품+포인트 고정 수수료
  "fixed_fee_voucher_only": 10000,  // 바우처 전용 고정 수수료
  "fixed_fee_voucher_with_points": 10000,  // 바우처+포인트 고정 수수료
  "min_withdrawal_amount": 10000,  // 최소 출금 금액
  "max_withdrawal_amount": 1000000,  // 최대 출금 금액
  "point_to_krw_rate": 1  // 포인트-원화 환율
}
```

### 시스템 설정 업데이트
```http
PUT /api/admin/settings/:setting_key
Content-Type: application/json

{
  "value": 35  // 새로운 값
}

Parameters:
- setting_key: 설정 키 (예: points_fee_rate, fixed_fee_points_only)

Response:
{
  "message": "시스템 설정이 업데이트되었습니다",
  "setting_key": "points_fee_rate",
  "value": 35
}
```

---

## 📈 통계 및 리포트

### 캠페인 통계
```http
GET /api/admin/stats/campaigns?start_date=2024-03-01&end_date=2024-03-31

Parameters:
- start_date: 시작일
- end_date: 종료일

Response:
{
  "total_campaigns": 56,
  "active_campaigns": 23,
  "completed_campaigns": 30,
  "cancelled_campaigns": 3,
  "total_budget": 25000000,
  "average_budget": 446428,
  "by_category": {
    "뷰티": 20,
    "패션": 15,
    "식품": 10,
    "기타": 11
  }
}
```

### 사용자 통계
```http
GET /api/admin/stats/users?start_date=2024-03-01&end_date=2024-03-31

Response:
{
  "total_users": 1234,
  "new_users": 50,
  "active_users": 890,
  "by_role": {
    "advertiser": 234,
    "influencer": 950,
    "agency": 30,
    "rep": 20
  },
  "by_status": {
    "active": 1200,
    "suspended": 20,
    "banned": 14
  }
}
```

---

## 🔍 데이터베이스 스키마

### 주요 테이블 구조

#### users (사용자)
```sql
- user_id: INTEGER PRIMARY KEY
- email: TEXT UNIQUE
- nickname: TEXT
- password_hash: TEXT
- role: TEXT (advertiser, influencer, agency, rep, admin)
- sphere_points: INTEGER (체크포인트)
- status: TEXT (active, suspended, banned)
- created_at: DATETIME
- last_login: DATETIME
```

#### campaigns (캠페인)
```sql
- campaign_id: INTEGER PRIMARY KEY
- advertiser_id: INTEGER (users.user_id FK)
- title: TEXT
- description: TEXT
- status: TEXT (pending, active, completed, cancelled)
- category: TEXT
- channel_type: TEXT (instagram, youtube, blog)
- slots: INTEGER
- budget: INTEGER
- product_value: INTEGER
- sphere_points: INTEGER
- reward_type: TEXT
- start_date: DATE
- end_date: DATE
- created_at: DATETIME
```

#### applications (지원)
```sql
- application_id: INTEGER PRIMARY KEY
- campaign_id: INTEGER (campaigns.campaign_id FK)
- influencer_id: INTEGER (users.user_id FK)
- status: TEXT (pending, approved, rejected)
- applied_at: DATETIME
```

#### reviews (리뷰)
```sql
- review_id: INTEGER PRIMARY KEY
- campaign_id: INTEGER
- influencer_id: INTEGER
- post_url: TEXT
- content: TEXT
- status: TEXT (pending, approved, rejected)
- submitted_at: DATETIME
- reviewed_at: DATETIME
```

#### settlements (정산)
```sql
- settlement_id: INTEGER PRIMARY KEY
- user_id: INTEGER
- amount: INTEGER
- bank_name: TEXT
- account_number: TEXT
- account_holder: TEXT
- status: TEXT (pending, approved, rejected, completed)
- requested_at: DATETIME
- processed_at: DATETIME
```

#### system_settings (시스템 설정)
```sql
- setting_key: TEXT PRIMARY KEY
- setting_value: TEXT
- updated_at: DATETIME
```

---

## 🛠️ 개발 가이드

### 환경 설정
```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run build
npm run dev

# 데이터베이스 마이그레이션
npm run db:migrate:local
```

### API 테스트
```bash
# 로그인 테스트
curl -X POST https://fa737302.checknreviews-v1.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 세션 쿠키를 사용한 요청
curl -X GET https://fa737302.checknreviews-v1.pages.dev/api/admin/campaigns \
  -H "Cookie: session=xxxxx"
```

---

## 📝 참고사항

### 인증 흐름
1. `/api/auth/login`으로 로그인
2. 응답 헤더의 `Set-Cookie`에서 세션 쿠키 추출
3. 이후 모든 요청에 쿠키 포함
4. `/api/auth/me`로 세션 유효성 확인

### 에러 응답 형식
```json
{
  "error": "에러 메시지",
  "details": "상세 설명 (선택사항)"
}
```

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

---

## 🚀 배포 정보

- **현재 배포 URL**: https://fa737302.checknreviews-v1.pages.dev
- **GitHub**: https://github.com/smee96/review-check
- **플랫폼**: Cloudflare Pages + Workers
- **데이터베이스**: Cloudflare D1 (SQLite)

---

## 📞 문의

추가 API가 필요하거나 질문이 있으시면 언제든지 문의해주세요!
