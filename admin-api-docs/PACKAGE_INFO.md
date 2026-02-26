# 📦 셀러리 에이전트 전달 패키지

## 🎯 목적
체크앤리뷰 플랫폼의 관리자 기능을 셀러리 에이전트에서 구현할 수 있도록 필요한 모든 API 문서와 코드를 제공합니다.

---

## 📂 패키지 내용

### 📄 문서 파일
1. **README.md** (12.6 KB)
   - 전체 API 엔드포인트 문서
   - 요청/응답 예시
   - 데이터베이스 스키마
   - HTTP 상태 코드

2. **QUICK_START.md** (6.5 KB)
   - 빠른 시작 가이드
   - 단계별 구현 가이드
   - 테스트 시나리오
   - 추천 개발 순서

3. **ENV_SAMPLE.md** (4.1 KB)
   - 환경 변수 설정
   - 관리자 계정 생성 방법
   - 데이터베이스 초기화
   - 로컬/프로덕션 설정

4. **POSTMAN_COLLECTION.json** (11.6 KB)
   - Postman API 테스트 컬렉션
   - 모든 엔드포인트 포함
   - 즉시 테스트 가능

### 💻 소스 코드
5. **admin-routes.ts**
   - 관리자 라우트 구현 코드
   - 사용자 관리, 통계 API

6. **campaigns-routes.ts**
   - 캠페인 CRUD API
   - 캠페인 상태 관리

7. **applications-routes.ts**
   - 지원/리뷰 관리 API
   - 승인/거절 로직

8. **settings-routes.ts**
   - 시스템 설정 API
   - 수수료율, 금액 설정

9. **auth-middleware.ts**
   - 인증 미들웨어
   - 관리자 권한 검증

### 🗄️ 데이터베이스
10. **migrations/** (35개 파일)
    - 전체 데이터베이스 스키마
    - 테이블 정의
    - 인덱스 정의

---

## 🚀 구현할 관리자 기능

### 1. 📊 대시보드 통계
- 오늘 방문자 수
- 전체 사용자 수
- 전체/활성 캠페인 수
- 대기 중인 리뷰 수
- 정산 대기 건수
- 총 정산 금액

**API**: `GET /api/admin/stats`

---

### 2. 📢 캠페인 관리
- 전체 캠페인 목록 조회
- 캠페인 상세 정보
- 캠페인 상태 변경 (승인/거절/완료/취소)
- 캠페인 삭제
- 필터링 (상태별, 카테고리별)
- 페이지네이션

**주요 API**:
```
GET  /api/admin/campaigns          # 목록
GET  /api/campaigns/:id             # 상세
PUT  /api/admin/campaigns/:id/status # 상태 변경
DELETE /api/admin/campaigns/:id      # 삭제
```

---

### 3. ⭐ 리뷰 관리
- 전체 리뷰 목록 조회
- 리뷰 상세 정보
- 리뷰 승인/거절
- 관리자 코멘트 작성
- 필터링 (상태별)
- 페이지네이션

**주요 API**:
```
GET  /api/admin/reviews           # 목록
GET  /api/admin/reviews/:id       # 상세
PUT  /api/admin/reviews/:id/status # 승인/거절
```

---

### 4. 👥 가입자 목록 관리
- 전체 사용자 목록 조회
- 사용자 상세 정보
- 사용자 상태 변경 (활성/정지/차단)
- 포인트 조정 (지급/차감)
- 검색 (이메일, 닉네임)
- 필터링 (역할별)
- 사용자 통계 (지원/완료 건수)

**주요 API**:
```
GET  /api/admin/users             # 목록
GET  /api/admin/users/:id         # 상세
PUT  /api/admin/users/:id/status  # 상태 변경
POST /api/admin/users/:id/points  # 포인트 조정
```

---

### 5. 💰 정산 관리
- 정산 요청 목록 조회
- 정산 상세 정보
- 정산 승인/거절/완료
- 관리자 코멘트 작성
- 정산 내역 CSV 다운로드
- 필터링 (상태별, 기간별)
- 계좌 정보 확인

**주요 API**:
```
GET  /api/admin/settlements           # 목록
GET  /api/admin/settlements/:id       # 상세
PUT  /api/admin/settlements/:id/status # 승인/거절
GET  /api/admin/settlements/export    # CSV 다운로드
```

---

### 6. ⚙️ 시스템 설정
- 포인트 수수료율 설정
- 거래당 고정 수수료 설정
  - 포인트 전용
  - 구매+포인트
  - 상품 전용
  - 상품+포인트
  - 바우처 전용
  - 바우처+포인트
- 최소/최대 출금 금액 설정
- 포인트-원화 환율 설정

**주요 API**:
```
GET  /api/admin/settings          # 전체 설정 조회
PUT  /api/admin/settings/:key     # 개별 설정 변경
```

---

## 🔐 인증 방식

### Session-based Authentication
```typescript
// 1. 로그인
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "your_password"
}

// 2. 세션 쿠키 자동 저장
Set-Cookie: session=xxxxx; HttpOnly; Secure

// 3. 이후 모든 요청에 쿠키 포함
GET /api/admin/campaigns
Cookie: session=xxxxx

// 4. 권한 확인
role === 'admin' → 접근 허용
role !== 'admin' → 403 Forbidden
```

---

## 📊 데이터베이스 구조

### 주요 테이블

#### users (사용자)
```sql
user_id, email, nickname, password_hash, role, 
sphere_points, status, created_at, last_login
```

#### campaigns (캠페인)
```sql
campaign_id, advertiser_id, title, description, status,
category, channel_type, slots, budget, product_value,
sphere_points, reward_type, start_date, end_date
```

#### applications (지원)
```sql
application_id, campaign_id, influencer_id, 
status, applied_at, approved_at
```

#### reviews (리뷰)
```sql
review_id, campaign_id, influencer_id, post_url,
content, status, submitted_at, reviewed_at
```

#### settlements (정산)
```sql
settlement_id, user_id, amount, bank_name,
account_number, account_holder, status,
requested_at, processed_at
```

#### system_settings (시스템 설정)
```sql
setting_key, setting_value, updated_at
```

전체 스키마는 `migrations/` 폴더 참고

---

## 🛠️ 개발 방법 (2가지 옵션)

### Option A: REST API 호출 (추천 ⭐)
```typescript
// 기존 API를 HTTP로 호출
const response = await fetch('https://fa737302.checknreviews-v1.pages.dev/api/admin/campaigns', {
  headers: {
    'Cookie': 'session=xxx'
  }
});
const data = await response.json();
```

**장점**:
- 기존 코드 재사용
- 인증/권한 자동 처리
- 빠른 개발

---

### Option B: 직접 데이터베이스 접근
```typescript
// Cloudflare D1에 직접 쿼리
const campaigns = await env.DB.prepare(`
  SELECT * FROM campaigns WHERE status = ?
`).bind('active').all();
```

**장점**:
- 유연한 쿼리
- 성능 최적화 가능

**단점**:
- 인증 로직 직접 구현 필요
- 코드 중복

---

## 📋 구현 체크리스트

### Phase 1: 기본 설정 (30분)
- [ ] Postman 컬렉션 임포트
- [ ] API 테스트 (로그인, 목록 조회)
- [ ] 세션 인증 확인

### Phase 2: 대시보드 (1시간)
- [ ] 통계 API 연동
- [ ] 카드 형태로 표시

### Phase 3: 캠페인 관리 (3시간)
- [ ] 캠페인 목록 표시
- [ ] 페이지네이션
- [ ] 상세 보기
- [ ] 상태 변경 (승인/거절)
- [ ] 삭제 기능

### Phase 4: 리뷰 관리 (2시간)
- [ ] 리뷰 목록 표시
- [ ] 승인/거절 기능
- [ ] 코멘트 작성

### Phase 5: 가입자 관리 (3시간)
- [ ] 사용자 목록 표시
- [ ] 검색/필터링
- [ ] 상세 정보
- [ ] 포인트 조정

### Phase 6: 정산 관리 (3시간)
- [ ] 정산 요청 목록
- [ ] 승인/거절
- [ ] CSV 다운로드

### Phase 7: 시스템 설정 (1시간)
- [ ] 설정 조회
- [ ] 설정 변경

**총 예상 시간: 13-15시간**

---

## 🌐 배포 정보

### 현재 배포 URL
```
https://fa737302.checknreviews-v1.pages.dev
```

### GitHub 저장소
```
https://github.com/smee96/review-check
```

### 데이터베이스
- **플랫폼**: Cloudflare D1 (SQLite)
- **이름**: checknreviews-v1-production

---

## 📞 API 테스트 예시

### 1. 로그인
```bash
curl -X POST https://fa737302.checknreviews-v1.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt
```

### 2. 캠페인 목록
```bash
curl -X GET https://fa737302.checknreviews-v1.pages.dev/api/admin/campaigns \
  -b cookies.txt
```

### 3. 캠페인 승인
```bash
curl -X PUT https://fa737302.checknreviews-v1.pages.dev/api/admin/campaigns/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}' \
  -b cookies.txt
```

---

## 💡 개발 팁

### 인증 처리
- 로그인 후 세션 쿠키 저장
- 401 응답 시 재로그인
- 403 응답 시 권한 없음 알림

### 에러 처리
- try-catch로 감싸기
- 사용자 친화적인 메시지
- 네트워크 오류 재시도

### 성능 최적화
- 페이지네이션 필수
- 불필요한 요청 최소화
- 로딩 상태 표시

### UI/UX
- 테이블 형태로 목록 표시
- 필터/검색 기능
- 액션 버튼 (승인/거절/삭제)
- 확인 다이얼로그

---

## 📚 파일 읽는 순서

1. **QUICK_START.md** ← 먼저 읽기!
2. **README.md** ← API 상세 문서
3. **POSTMAN_COLLECTION.json** ← Postman으로 임포트
4. **ENV_SAMPLE.md** ← 환경 설정
5. **소스 코드 파일** ← 구현 참고

---

## 🎁 추가 제공 사항

- ✅ 전체 API 문서
- ✅ Postman 테스트 컬렉션
- ✅ 실제 서버 코드
- ✅ 데이터베이스 스키마
- ✅ 환경 설정 가이드
- ✅ 빠른 시작 가이드

---

## 📞 지원

문제가 발생하거나 추가 API가 필요하면:
- GitHub Issues 등록
- API 문서 확인
- 소스 코드 참고

**행운을 빕니다! 🚀**

---

## 📦 파일 정보

- **패키지 이름**: admin-api-package.tar.gz
- **파일 크기**: 29 KB
- **포함 파일**: 40개
- **생성일**: 2026-02-24
