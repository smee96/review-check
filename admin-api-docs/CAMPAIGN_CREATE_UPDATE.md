# 📦 관리자 캠페인 생성 기능 추가 패키지

## 🎉 업데이트 내용

기존 관리자 API 패키지에 **캠페인 생성 기능**을 추가했습니다!

---

## 📂 새로 추가된 파일

### **CAMPAIGN_CREATE_API.md** (21.7 KB)
- 캠페인 생성 API 완전 가이드
- 필수/선택 필드 상세 설명
- 6가지 과금 방식 (Pricing Type)
- 4가지 채널 유형 (Channel Type)
- 이미지 업로드 (Base64 → R2)
- 날짜 필드 관리
- 수수료 계산 공식
- 프론트엔드 구현 예시 (HTML + JavaScript)
- 요청/응답 예시
- UI/UX 권장사항
- 테스트 시나리오

### **POSTMAN_COLLECTION.json** (업데이트)
- 캠페인 생성 (최소 필드) 요청 추가
- 캠페인 생성 (전체 필드) 요청 추가

---

## 🎯 캠페인 생성 API 요약

### 엔드포인트
```http
POST /api/campaigns/
Authorization: Session Cookie (admin role)
Content-Type: application/json
```

### 필수 필드
```json
{
  "title": "캠페인 제목",
  "channel_type": "instagram",  // instagram, youtube, blog, smartstore
  "pricing_type": "product_with_points"  // 6가지 중 선택
}
```

### 선택 필드 (30개 이상)
- 기본 정보: description, product_name, product_url
- 모집 정보: slots, budget
- 보상 정보: product_value, sphere_points
- 채널별 추가 정보: instagram_mention_account 등
- 일정 정보: 6개 날짜 필드
- 캠페인 상세: provided_items, mission, keywords, notes, requirements
- 이미지: thumbnail_image (Base64 또는 URL)

---

## 💰 과금 방식 (6가지)

### 1. **points_only** - 포인트 전용
```json
{
  "pricing_type": "points_only",
  "sphere_points": 10000,
  "product_value": 0
}
```
- 체크포인트만 지급
- 수수료: 고정 수수료 + 포인트 수수료(30%)

### 2. **purchase_with_points** - 구매 + 포인트
```json
{
  "pricing_type": "purchase_with_points",
  "sphere_points": 5000,
  "product_value": 30000
}
```
- 직접 구매 후 포인트 지급
- 수수료: 고정 수수료 + 포인트 수수료

### 3. **product_only** - 상품 전용
```json
{
  "pricing_type": "product_only",
  "sphere_points": 0,
  "product_value": 50000
}
```
- 제품만 제공
- 수수료: 고정 수수료만

### 4. **product_with_points** - 상품 + 포인트
```json
{
  "pricing_type": "product_with_points",
  "sphere_points": 5000,
  "product_value": 30000
}
```
- 제품 + 포인트 지급
- 수수료: 고정 수수료 + 포인트 수수료

### 5. **voucher_only** - 바우처 전용
```json
{
  "pricing_type": "voucher_only",
  "sphere_points": 0,
  "product_value": 20000
}
```
- 바우처만 제공
- 수수료: 고정 수수료만

### 6. **voucher_with_points** - 바우처 + 포인트
```json
{
  "pricing_type": "voucher_with_points",
  "sphere_points": 3000,
  "product_value": 15000
}
```
- 바우처 + 포인트 지급
- 수수료: 고정 수수료 + 포인트 수수료

---

## 📺 채널 유형 (4가지)

### 1. Instagram
```json
{
  "channel_type": "instagram",
  "instagram_mention_account": "@checknreview"
}
```

### 2. YouTube
```json
{
  "channel_type": "youtube",
  "youtube_purchase_link": "https://youtube.com/..."
}
```

### 3. Blog
```json
{
  "channel_type": "blog",
  "blog_product_url": "https://blog.example.com/..."
}
```

### 4. SmartStore
```json
{
  "channel_type": "smartstore",
  "smartstore_product_url": "https://smartstore.naver.com/..."
}
```

---

## 🖼️ 이미지 업로드

### Base64 인코딩
```javascript
const fileInput = document.getElementById('thumbnail_file');
const file = fileInput.files[0];

const reader = new FileReader();
reader.onload = function(e) {
  const base64Image = e.target.result;
  // "data:image/jpeg;base64,/9j/4AAQ..."
  
  campaignData.thumbnail_image = base64Image;
};
reader.readAsDataURL(file);
```

### 자동 R2 업로드
- Base64 이미지 → Cloudflare R2 자동 업로드
- 파일명: `{campaign_id}.jpg`
- URL: `/api/images/{campaign_id}.jpg`

---

## 💸 수수료 계산

### 공식
```javascript
function calculateFee(pricingType, spherePoints, slots) {
  const fixedFee = 10000;  // 거래당 고정 수수료
  const pointsFeeRate = 0.30;  // 30%
  
  const pointsFee = spherePoints * pointsFeeRate;
  const subtotal = fixedFee + pointsFee;
  const totalAmount = subtotal * slots;
  const vat = totalAmount * 0.1;
  const totalWithVat = totalAmount + vat;
  
  return {
    fixedFee,
    pointsFee,
    subtotal,
    totalAmount,
    vat,
    totalWithVat
  };
}
```

### 예시 (product_with_points, 5000P, 10명)
```
고정 수수료: 10,000원
포인트 수수료: 1,500원 (5,000 × 30%)
거래당 소계: 11,500원
총 금액: 115,000원 (11,500 × 10)
부가세: 11,500원 (10%)
최종 금액: 126,500원
```

---

## 📅 날짜 필드 순서

```
application_start_date (지원 시작)
    ↓
application_end_date (지원 마감)
    ↓
announcement_date (선정 발표)
    ↓
content_start_date (콘텐츠 작성 시작)
    ↓
content_end_date (콘텐츠 작성 마감)
    ↓
result_announcement_date (최종 결과)
```

---

## 📤 요청 예시

### 최소 요청
```bash
curl -X POST https://fa737302.checknreviews-v1.pages.dev/api/campaigns/ \
  -H "Content-Type: application/json" \
  -H "Cookie: session=xxx" \
  -d '{
    "title": "신제품 리뷰 캠페인",
    "channel_type": "instagram",
    "pricing_type": "product_only"
  }'
```

### 응답
```json
{
  "success": true,
  "campaignId": 123,
  "message": "캠페인이 등록되었습니다. 관리자 승인 후 활성화됩니다."
}
```

---

## 💻 프론트엔드 구현 핵심

### HTML 폼
```html
<form id="createCampaignForm">
  <input type="text" id="campaign_title" required>
  <select id="channel_type" required>
    <option value="instagram">Instagram</option>
    <option value="youtube">YouTube</option>
    <option value="blog">Blog</option>
    <option value="smartstore">SmartStore</option>
  </select>
  <select id="pricing_type" required>
    <option value="points_only">포인트 전용</option>
    <option value="product_with_points">상품 + 포인트</option>
    <!-- ... -->
  </select>
  <button type="submit">캠페인 등록</button>
</form>
```

### JavaScript
```javascript
async function handleCreateCampaign() {
  const campaignData = {
    title: document.getElementById('campaign_title').value,
    channel_type: document.getElementById('channel_type').value,
    pricing_type: document.getElementById('pricing_type').value,
    // ... 기타 필드
  };

  const response = await fetch('/api/campaigns/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(campaignData)
  });

  const result = await response.json();
  if (response.ok) {
    alert('캠페인이 생성되었습니다!');
  }
}
```

---

## 📋 구현 체크리스트

### Phase 1: 기본 폼 (2시간)
- [ ] 제목 입력
- [ ] 채널 선택 드롭다운
- [ ] 과금 방식 선택
- [ ] 제출 버튼
- [ ] API 연동

### Phase 2: 상세 필드 (2시간)
- [ ] 모집 인원
- [ ] 제품 가치/포인트
- [ ] 설명, 미션, 키워드
- [ ] 필드 유효성 검증

### Phase 3: 고급 기능 (2시간)
- [ ] 이미지 업로드 & 미리보기
- [ ] 날짜 선택 (Date Picker)
- [ ] 실시간 수수료 계산
- [ ] 자동 저장 (Draft)

### Phase 4: UI/UX 개선 (1시간)
- [ ] 로딩 상태
- [ ] 에러 처리
- [ ] 성공/실패 알림
- [ ] 필드 표시/숨김 로직

**총 예상 시간: 7시간**

---

## 🧪 테스트 시나리오

### 1. Postman으로 최소 필드 테스트
```
POST /api/campaigns/
{
  "title": "테스트 캠페인",
  "channel_type": "instagram",
  "pricing_type": "product_only"
}
```

### 2. Postman으로 전체 필드 테스트
```
POSTMAN_COLLECTION.json의 "캠페인 생성 (전체)" 사용
```

### 3. 이미지 업로드 테스트
```javascript
// Base64 이미지 포함
{
  "title": "이미지 테스트",
  "thumbnail_image": "data:image/jpeg;base64,..."
}
```

### 4. 에러 케이스
- [ ] 제목 누락 (400)
- [ ] 채널 누락 (400)
- [ ] 잘못된 pricing_type (400)
- [ ] 세션 없음 (401)
- [ ] 권한 없음 (403)

---

## 📦 패키지 정보

### 파일 구조
```
admin-api-docs/
├── CAMPAIGN_CREATE_API.md       ← 새로 추가! (21.7 KB)
├── README.md                     
├── QUICK_START.md                
├── PACKAGE_INFO.md               
├── ENV_SAMPLE.md                 
├── POSTMAN_COLLECTION.json       ← 업데이트!
├── admin-routes.ts               
├── campaigns-routes.ts           
├── applications-routes.ts        
├── settings-routes.ts            
├── auth-middleware.ts            
└── migrations/                   
```

### 파일 크기
- **admin-api-package-v2.tar.gz**: 38 KB
- **총 파일 수**: 38개
- **문서 파일**: 6개 (새로 추가 1개)

---

## 🔍 문서 읽는 순서

### 캠페인 생성 기능 구현 시
1. **CAMPAIGN_CREATE_API.md** ← 먼저 읽기!
2. **POSTMAN_COLLECTION.json** ← Postman 테스트
3. **campaigns-routes.ts** ← 서버 코드 참고
4. **README.md** ← 전체 API 문서

### 전체 관리자 기능 구현 시
1. **PACKAGE_INFO.md** ← 전체 개요
2. **QUICK_START.md** ← 빠른 시작
3. **CAMPAIGN_CREATE_API.md** ← 캠페인 생성
4. **README.md** ← 기타 API 문서

---

## 💡 주요 특징

### 1. 유연한 과금 방식
- 6가지 과금 방식 지원
- 포인트/상품/바우처 조합 가능
- 자동 수수료 계산

### 2. 다양한 채널 지원
- Instagram, YouTube, Blog, SmartStore
- 채널별 추가 정보 입력 가능

### 3. 이미지 자동 처리
- Base64 → Cloudflare R2 자동 업로드
- 파일명 자동 관리
- Fallback 처리

### 4. 상세한 일정 관리
- 6단계 날짜 필드
- 순차적인 일정 관리

### 5. 실시간 수수료 계산
- 입력 시 즉시 계산
- 투명한 비용 표시

---

## 📞 추가 지원

### 필요한 경우
- API 추가 요청
- 필드 수정 요청
- 기능 개선 제안

### GitHub Issues
- https://github.com/smee96/review-check/issues

---

## 🎁 보너스

### 프론트엔드 UI 컴포넌트
- 전체 HTML 폼 예시 제공
- JavaScript 클래스 구현 예시
- 이벤트 리스너 예시
- 수수료 계산기 예시
- 이미지 미리보기 예시

### 테스트 데이터
- Postman에서 즉시 테스트 가능
- 최소/전체 요청 예시 포함

---

## ✨ 업데이트 요약

**이전 버전 (v1)**:
- 관리자 기본 기능 (캠페인 관리, 리뷰 관리, 가입자 관리, 정산 관리, 시스템 설정)
- 31 KB, 37개 파일

**현재 버전 (v2)**:
- **+ 캠페인 생성 기능** (완전한 API 문서 + 프론트엔드 구현 가이드)
- 38 KB, 38개 파일
- Postman 컬렉션 업데이트

---

## 🚀 다운로드

### 파일 위치
```
/home/user/webapp/admin-api-package-v2.tar.gz
```

### 압축 해제
```bash
tar -xzf admin-api-package-v2.tar.gz
cd admin-api-docs
```

**행운을 빕니다! 🎉**
