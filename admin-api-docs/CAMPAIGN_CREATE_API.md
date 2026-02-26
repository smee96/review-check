# 🎯 관리자 캠페인 생성 API 문서

## 📋 목차
1. [캠페인 생성 개요](#캠페인-생성-개요)
2. [API 엔드포인트](#api-엔드포인트)
3. [필수 필드](#필수-필드)
4. [선택 필드](#선택-필드)
5. [과금 방식 (Pricing Type)](#과금-방식-pricing-type)
6. [채널 유형 (Channel Type)](#채널-유형-channel-type)
7. [날짜 필드](#날짜-필드)
8. [이미지 업로드](#이미지-업로드)
9. [요청 예시](#요청-예시)
10. [응답 예시](#응답-예시)
11. [프론트엔드 구현 가이드](#프론트엔드-구현-가이드)

---

## 🎯 캠페인 생성 개요

관리자는 광고주를 대신하여 캠페인을 생성할 수 있습니다. 관리자가 생성한 캠페인은 자동으로 승인 상태로 생성될 수도 있고, 일반 프로세스를 따를 수도 있습니다.

**권한**: `admin` 역할 필수

---

## 🔌 API 엔드포인트

### 캠페인 생성
```http
POST /api/campaigns/
Authorization: Session Cookie (admin role required)
Content-Type: application/json
```

**참고**: 현재 코드에서는 `advertiser`, `agency`, `rep`, `admin` 모두 캠페인 생성 가능합니다.

---

## ✅ 필수 필드

### 1. **title** (string)
```json
{
  "title": "신제품 체험단 모집"
}
```
- 캠페인 제목
- 필수 입력
- 사용자에게 표시되는 메인 제목

### 2. **channel_type** (string)
```json
{
  "channel_type": "instagram"
}
```
- 캠페인 채널
- 가능한 값: `instagram`, `youtube`, `blog`, `smartstore`
- 필수 선택

### 3. **pricing_type** (string)
```json
{
  "pricing_type": "product_with_points"
}
```
- 과금 방식
- 필수 선택
- 상세 내용은 [과금 방식](#과금-방식-pricing-type) 참조

---

## 🔧 선택 필드

### 기본 정보

#### **description** (string)
```json
{
  "description": "새로 출시한 스킨케어 제품을 체험하고 솔직한 리뷰를 작성해주세요!"
}
```
- 캠페인 설명
- 상세 내용

#### **product_name** (string)
```json
{
  "product_name": "히알루론산 수분크림"
}
```
- 제품명

#### **product_url** (string)
```json
{
  "product_url": "https://example.com/product/123"
}
```
- 제품 상세 페이지 URL

---

### 모집 정보

#### **slots** (number)
```json
{
  "slots": 10
}
```
- 모집 인원
- 기본값: 1
- 최소값: 10 (프론트엔드 검증)

#### **budget** (number)
```json
{
  "budget": 500000
}
```
- 예산 (원)
- 선택 사항

---

### 보상 정보

#### **product_value** (number)
```json
{
  "product_value": 30000
}
```
- 제품 가치 (원)
- pricing_type에 따라 필수/선택

#### **sphere_points** (number)
```json
{
  "sphere_points": 5000
}
```
- 체크포인트 지급액
- pricing_type에 따라 필수/선택

#### **point_reward** (number) - **Deprecated**
```json
{
  "point_reward": 5000
}
```
- 구버전 포인트 필드
- 현재는 `sphere_points` 사용 권장

---

### 채널별 추가 정보

#### **Instagram**
```json
{
  "instagram_mention_account": "@checknreview"
}
```
- 멘션 계정

#### **Blog**
```json
{
  "blog_product_url": "https://blog.example.com/product"
}
```
- 블로그 제품 링크

#### **YouTube**
```json
{
  "youtube_purchase_link": "https://youtube.com/watch?v=..."
}
```
- 유튜브 구매 링크

#### **SmartStore**
```json
{
  "smartstore_product_url": "https://smartstore.naver.com/..."
}
```
- 스마트스토어 상품 URL

---

### 일정 정보

#### **application_start_date** (string, ISO 8601)
```json
{
  "application_start_date": "2024-03-01"
}
```
- 지원 시작일

#### **application_end_date** (string, ISO 8601)
```json
{
  "application_end_date": "2024-03-15"
}
```
- 지원 마감일

#### **announcement_date** (string, ISO 8601)
```json
{
  "announcement_date": "2024-03-20"
}
```
- 발표일

#### **content_start_date** (string, ISO 8601)
```json
{
  "content_start_date": "2024-03-25"
}
```
- 콘텐츠 작성 시작일

#### **content_end_date** (string, ISO 8601)
```json
{
  "content_end_date": "2024-04-10"
}
```
- 콘텐츠 작성 마감일

#### **result_announcement_date** (string, ISO 8601)
```json
{
  "result_announcement_date": "2024-04-15"
}
```
- 최종 결과 발표일

---

### 캠페인 상세 정보

#### **provided_items** (string)
```json
{
  "provided_items": "- 스킨케어 세트 (3종)\n- 사용 가이드북\n- 샘플 키트"
}
```
- 제공 물품 목록

#### **mission** (string)
```json
{
  "mission": "1. 제품 사용 후 솔직한 리뷰\n2. 사진 최소 3장 이상\n3. 해시태그 필수 포함"
}
```
- 미션 내용

#### **keywords** (string)
```json
{
  "keywords": "#체크앤리뷰 #신제품 #스킨케어 #리뷰"
}
```
- 필수 키워드/해시태그

#### **notes** (string)
```json
{
  "notes": "※ 배송은 선정 후 3일 이내\n※ 리뷰는 제품 수령 후 7일 이내 작성"
}
```
- 유의사항

#### **requirements** (string)
```json
{
  "requirements": "- 팔로워 500명 이상\n- 최근 3개월 활동 이력\n- 뷰티 콘텐츠 경험자"
}
```
- 지원 자격 요건

---

### 이미지

#### **thumbnail_image** (string)
```json
{
  "thumbnail_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```
또는
```json
{
  "thumbnail_image": "https://example.com/image.jpg"
}
```
- 썸네일 이미지
- Base64 인코딩된 이미지 또는 URL
- Base64인 경우 Cloudflare R2에 자동 업로드

---

## 💰 과금 방식 (Pricing Type)

### 6가지 과금 방식

#### 1. **points_only** - 포인트 전용
```json
{
  "pricing_type": "points_only",
  "sphere_points": 10000,
  "product_value": 0
}
```
- 체크포인트만 지급
- 제품 제공 없음
- **수수료 계산**: 고정 수수료 + 포인트 수수료

#### 2. **purchase_with_points** - 구매 + 포인트
```json
{
  "pricing_type": "purchase_with_points",
  "sphere_points": 5000,
  "product_value": 30000
}
```
- 인플루언서가 직접 구매 후 체크포인트 지급
- **수수료 계산**: 고정 수수료 + 포인트 수수료

#### 3. **product_only** - 상품 전용
```json
{
  "pricing_type": "product_only",
  "sphere_points": 0,
  "product_value": 50000
}
```
- 제품만 제공
- 포인트 지급 없음
- **수수료 계산**: 고정 수수료만

#### 4. **product_with_points** - 상품 + 포인트
```json
{
  "pricing_type": "product_with_points",
  "sphere_points": 5000,
  "product_value": 30000
}
```
- 제품 제공 + 체크포인트 지급
- **수수료 계산**: 고정 수수료 + 포인트 수수료

#### 5. **voucher_only** - 바우처 전용
```json
{
  "pricing_type": "voucher_only",
  "sphere_points": 0,
  "product_value": 20000
}
```
- 바우처만 제공
- 포인트 지급 없음
- **수수료 계산**: 고정 수수료만

#### 6. **voucher_with_points** - 바우처 + 포인트
```json
{
  "pricing_type": "voucher_with_points",
  "sphere_points": 3000,
  "product_value": 15000
}
```
- 바우처 제공 + 체크포인트 지급
- **수수료 계산**: 고정 수수료 + 포인트 수수료

---

### 수수료 계산 공식

```javascript
// 시스템 설정에서 가져온 값
const pointsFeeRate = 0.30; // 30%
const fixedFee = {
  points_only: 10000,
  purchase_with_points: 10000,
  product_only: 10000,
  product_with_points: 10000,
  voucher_only: 10000,
  voucher_with_points: 10000
};

// 수수료 계산
function calculateFee(pricingType, spherePoints, slots) {
  const fixed = fixedFee[pricingType] || 10000;
  const pointsFee = spherePoints * pointsFeeRate;
  const totalPerSlot = fixed + pointsFee;
  const totalAmount = totalPerSlot * slots;
  const vat = totalAmount * 0.1; // 10% VAT
  const totalWithVat = totalAmount + vat;
  
  return {
    fixedFee: fixed,
    pointsFee: pointsFee,
    subtotal: totalPerSlot,
    totalAmount: totalAmount,
    vat: vat,
    totalWithVat: totalWithVat
  };
}

// 예시
const result = calculateFee('product_with_points', 5000, 10);
console.log(result);
// {
//   fixedFee: 10000,
//   pointsFee: 1500,
//   subtotal: 11500,
//   totalAmount: 115000,
//   vat: 11500,
//   totalWithVat: 126500
// }
```

---

## 📺 채널 유형 (Channel Type)

### 지원 채널

#### 1. **instagram**
```json
{
  "channel_type": "instagram",
  "instagram_mention_account": "@checknreview"
}
```
- 인스타그램 포스트/릴스
- 멘션 계정 입력 가능

#### 2. **youtube**
```json
{
  "channel_type": "youtube",
  "youtube_purchase_link": "https://youtube.com/..."
}
```
- 유튜브 영상
- 구매 링크 입력 가능

#### 3. **blog**
```json
{
  "channel_type": "blog",
  "blog_product_url": "https://blog.example.com/..."
}
```
- 블로그 포스트
- 제품 링크 입력 가능

#### 4. **smartstore**
```json
{
  "channel_type": "smartstore",
  "smartstore_product_url": "https://smartstore.naver.com/..."
}
```
- 네이버 스마트스토어
- 상품 URL 입력 가능

---

## 📅 날짜 필드

### 날짜 형식
- **형식**: `YYYY-MM-DD` (ISO 8601)
- **예시**: `2024-03-15`

### 날짜 필드 순서
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

### JavaScript Date Picker 예시
```javascript
// Flatpickr 사용 예시
flatpickr("#application_start_date", {
  dateFormat: "Y-m-d",
  minDate: "today",
  onChange: function(selectedDates, dateStr) {
    // application_end_date의 minDate를 설정
    flatpickr("#application_end_date", {
      dateFormat: "Y-m-d",
      minDate: dateStr
    });
  }
});
```

---

## 🖼️ 이미지 업로드

### Base64 이미지 업로드
```javascript
// 파일 선택
const fileInput = document.getElementById('thumbnail_file');
const file = fileInput.files[0];

// Base64로 변환
const reader = new FileReader();
reader.onload = function(e) {
  const base64Image = e.target.result;
  // base64Image: "data:image/jpeg;base64,/9j/4AAQ..."
  
  // API 요청에 포함
  const campaignData = {
    title: "캠페인 제목",
    thumbnail_image: base64Image,
    // ... 기타 필드
  };
  
  fetch('/api/campaigns/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaignData)
  });
};
reader.readAsDataURL(file);
```

### Cloudflare R2 자동 처리
- Base64 이미지는 자동으로 R2에 업로드됨
- 파일명: `{campaign_id}.jpg`
- URL: `/api/images/{campaign_id}.jpg`
- R2 업로드 실패 시 Base64 그대로 저장 (fallback)

---

## 📤 요청 예시

### 최소 요청 (필수 필드만)
```json
{
  "title": "신제품 리뷰 캠페인",
  "channel_type": "instagram",
  "pricing_type": "product_only"
}
```

### 전체 요청 (모든 필드)
```json
{
  "title": "히알루론산 수분크림 체험단 모집",
  "description": "새로 출시한 스킨케어 제품을 체험하고 솔직한 리뷰를 작성해주세요!",
  "product_name": "히알루론산 수분크림",
  "product_url": "https://example.com/product/moisturizer",
  "channel_type": "instagram",
  "pricing_type": "product_with_points",
  "slots": 10,
  "budget": 500000,
  "product_value": 30000,
  "sphere_points": 5000,
  "instagram_mention_account": "@checknreview",
  "application_start_date": "2024-03-01",
  "application_end_date": "2024-03-15",
  "announcement_date": "2024-03-20",
  "content_start_date": "2024-03-25",
  "content_end_date": "2024-04-10",
  "result_announcement_date": "2024-04-15",
  "provided_items": "- 스킨케어 세트 (3종)\n- 사용 가이드북\n- 샘플 키트",
  "mission": "1. 제품 사용 후 솔직한 리뷰\n2. 사진 최소 3장 이상\n3. 해시태그 필수 포함",
  "keywords": "#체크앤리뷰 #신제품 #스킨케어 #리뷰",
  "notes": "※ 배송은 선정 후 3일 이내\n※ 리뷰는 제품 수령 후 7일 이내 작성",
  "requirements": "- 팔로워 500명 이상\n- 최근 3개월 활동 이력\n- 뷰티 콘텐츠 경험자",
  "thumbnail_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

## 📥 응답 예시

### 성공 응답 (201 Created)
```json
{
  "success": true,
  "campaignId": 123,
  "message": "캠페인이 등록되었습니다. 관리자 승인 후 활성화됩니다."
}
```

### 에러 응답 (400 Bad Request)
```json
{
  "error": "캠페인 제목을 입력해주세요"
}
```

```json
{
  "error": "캠페인 채널을 선택해주세요"
}
```

```json
{
  "error": "유효하지 않은 과금 방식입니다"
}
```

### 에러 응답 (500 Internal Server Error)
```json
{
  "error": "캠페인 등록 중 오류가 발생했습니다"
}
```

---

## 💻 프론트엔드 구현 가이드

### HTML 폼 예시

```html
<form id="createCampaignForm" class="space-y-6">
  <!-- 기본 정보 -->
  <div>
    <label class="block font-semibold mb-2">캠페인 제목 *</label>
    <input 
      type="text" 
      id="campaign_title" 
      required 
      class="w-full border rounded px-3 py-2"
      placeholder="예: 신제품 리뷰 캠페인"
    >
  </div>

  <!-- 채널 선택 -->
  <div>
    <label class="block font-semibold mb-2">채널 유형 *</label>
    <select id="channel_type" required class="w-full border rounded px-3 py-2">
      <option value="">선택하세요</option>
      <option value="instagram">Instagram</option>
      <option value="youtube">YouTube</option>
      <option value="blog">Blog</option>
      <option value="smartstore">SmartStore</option>
    </select>
  </div>

  <!-- 과금 방식 -->
  <div>
    <label class="block font-semibold mb-2">과금 방식 *</label>
    <select id="pricing_type" required class="w-full border rounded px-3 py-2">
      <option value="points_only">포인트 전용</option>
      <option value="purchase_with_points">구매 + 포인트</option>
      <option value="product_only">상품 전용</option>
      <option value="product_with_points">상품 + 포인트</option>
      <option value="voucher_only">바우처 전용</option>
      <option value="voucher_with_points">바우처 + 포인트</option>
    </select>
  </div>

  <!-- 모집 인원 -->
  <div>
    <label class="block font-semibold mb-2">모집 인원</label>
    <input 
      type="number" 
      id="slots" 
      min="10" 
      value="10"
      class="w-full border rounded px-3 py-2"
    >
  </div>

  <!-- 제품 가치 -->
  <div id="product_value_section">
    <label class="block font-semibold mb-2">제품 가치 (원)</label>
    <input 
      type="number" 
      id="product_value" 
      class="w-full border rounded px-3 py-2"
      placeholder="30000"
    >
  </div>

  <!-- 체크포인트 -->
  <div id="sphere_points_section">
    <label class="block font-semibold mb-2">체크포인트</label>
    <input 
      type="number" 
      id="sphere_points" 
      class="w-full border rounded px-3 py-2"
      placeholder="5000"
    >
  </div>

  <!-- 썸네일 이미지 -->
  <div>
    <label class="block font-semibold mb-2">썸네일 이미지</label>
    <input 
      type="file" 
      id="thumbnail_file" 
      accept="image/*"
      class="w-full border rounded px-3 py-2"
    >
    <div id="image_preview" class="mt-2"></div>
  </div>

  <!-- 날짜 -->
  <div>
    <label class="block font-semibold mb-2">지원 시작일</label>
    <input 
      type="date" 
      id="application_start_date" 
      class="w-full border rounded px-3 py-2"
    >
  </div>

  <div>
    <label class="block font-semibold mb-2">지원 마감일</label>
    <input 
      type="date" 
      id="application_end_date" 
      class="w-full border rounded px-3 py-2"
    >
  </div>

  <!-- 설명 -->
  <div>
    <label class="block font-semibold mb-2">캠페인 설명</label>
    <textarea 
      id="description" 
      rows="4"
      class="w-full border rounded px-3 py-2"
      placeholder="캠페인에 대한 상세 설명을 입력하세요..."
    ></textarea>
  </div>

  <!-- 미션 -->
  <div>
    <label class="block font-semibold mb-2">미션</label>
    <textarea 
      id="mission" 
      rows="4"
      class="w-full border rounded px-3 py-2"
      placeholder="1. 제품 사용 후 솔직한 리뷰&#10;2. 사진 최소 3장 이상&#10;3. 해시태그 필수 포함"
    ></textarea>
  </div>

  <!-- 제출 버튼 -->
  <div class="flex gap-4">
    <button 
      type="submit" 
      class="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
    >
      캠페인 등록
    </button>
    <button 
      type="button" 
      onclick="app.showAdminCampaigns()"
      class="flex-1 bg-gray-300 py-3 rounded-lg hover:bg-gray-400"
    >
      취소
    </button>
  </div>
</form>
```

---

### JavaScript 구현

```javascript
class AdminCampaignManager {
  async handleCreateCampaign() {
    try {
      // 폼 데이터 수집
      const campaignData = {
        title: document.getElementById('campaign_title').value,
        description: document.getElementById('description').value,
        channel_type: document.getElementById('channel_type').value,
        pricing_type: document.getElementById('pricing_type').value,
        slots: parseInt(document.getElementById('slots').value) || 10,
        product_value: parseInt(document.getElementById('product_value').value) || 0,
        sphere_points: parseInt(document.getElementById('sphere_points').value) || 0,
        application_start_date: document.getElementById('application_start_date').value,
        application_end_date: document.getElementById('application_end_date').value,
        mission: document.getElementById('mission').value,
        // ... 기타 필드
      };

      // 필수 필드 검증
      if (!campaignData.title) {
        alert('캠페인 제목을 입력해주세요');
        return;
      }

      if (!campaignData.channel_type) {
        alert('채널 유형을 선택해주세요');
        return;
      }

      // 이미지 처리
      const fileInput = document.getElementById('thumbnail_file');
      if (fileInput.files.length > 0) {
        const base64Image = await this.fileToBase64(fileInput.files[0]);
        campaignData.thumbnail_image = base64Image;
      }

      // API 호출
      const response = await fetch('/api/campaigns/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 세션 쿠키 포함
        body: JSON.stringify(campaignData)
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || '캠페인이 생성되었습니다');
        // 캠페인 목록으로 이동
        this.showCampaignList();
      } else {
        alert(result.error || '캠페인 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Campaign creation error:', error);
      alert('캠페인 생성 중 오류가 발생했습니다');
    }
  }

  // 파일을 Base64로 변환
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 이미지 미리보기
  previewImage(file) {
    const preview = document.getElementById('image_preview');
    const reader = new FileReader();
    
    reader.onload = function(e) {
      preview.innerHTML = `
        <img src="${e.target.result}" 
             class="max-w-full h-auto rounded-lg border" 
             style="max-height: 200px;">
      `;
    };
    
    reader.readAsDataURL(file);
  }

  // 수수료 계산 및 표시
  calculateAndDisplayFee() {
    const pricingType = document.getElementById('pricing_type').value;
    const spherePoints = parseInt(document.getElementById('sphere_points').value) || 0;
    const slots = parseInt(document.getElementById('slots').value) || 10;

    // 시스템 설정에서 가져온 값 (예시)
    const fixedFees = {
      'points_only': 10000,
      'purchase_with_points': 10000,
      'product_only': 10000,
      'product_with_points': 10000,
      'voucher_only': 10000,
      'voucher_with_points': 10000
    };
    const pointsFeeRate = 0.30;

    const fixedFee = fixedFees[pricingType] || 10000;
    const pointsFee = spherePoints * pointsFeeRate;
    const subtotal = fixedFee + pointsFee;
    const totalAmount = subtotal * slots;
    const vat = totalAmount * 0.1;
    const totalWithVat = totalAmount + vat;

    // UI에 표시
    document.getElementById('fee_display').innerHTML = `
      <div class="bg-blue-50 p-4 rounded-lg">
        <h4 class="font-semibold mb-2">예상 수수료</h4>
        <div class="space-y-1 text-sm">
          <div>거래당 고정 수수료: ${fixedFee.toLocaleString()}원</div>
          <div>포인트 수수료 (30%): ${pointsFee.toLocaleString()}원</div>
          <div>거래당 소계: ${subtotal.toLocaleString()}원</div>
          <div class="pt-2 border-t">
            <div>총 금액 (${slots}명): ${totalAmount.toLocaleString()}원</div>
            <div>부가세 (10%): ${vat.toLocaleString()}원</div>
            <div class="font-bold text-lg">최종 금액: ${totalWithVat.toLocaleString()}원</div>
          </div>
        </div>
      </div>
    `;
  }
}

// 이벤트 리스너
document.getElementById('thumbnail_file').addEventListener('change', function(e) {
  if (this.files.length > 0) {
    adminCampaignManager.previewImage(this.files[0]);
  }
});

document.getElementById('pricing_type').addEventListener('change', function() {
  adminCampaignManager.calculateAndDisplayFee();
});

document.getElementById('sphere_points').addEventListener('input', function() {
  adminCampaignManager.calculateAndDisplayFee();
});

document.getElementById('slots').addEventListener('input', function() {
  adminCampaignManager.calculateAndDisplayFee();
});
```

---

## 🎨 UI/UX 권장사항

### 1. 필드 표시/숨김
```javascript
// pricing_type에 따라 필드 표시/숨김
document.getElementById('pricing_type').addEventListener('change', function() {
  const pricingType = this.value;
  const productSection = document.getElementById('product_value_section');
  const pointsSection = document.getElementById('sphere_points_section');

  // 포인트 포함 여부
  const hasPoints = pricingType.includes('points');
  pointsSection.style.display = hasPoints ? 'block' : 'none';

  // 상품/바우처 가치 포함 여부
  const hasProductValue = !pricingType.includes('points_only');
  productSection.style.display = hasProductValue ? 'block' : 'none';
});
```

### 2. 실시간 수수료 계산
- 입력 필드 변경 시 즉시 수수료 계산 및 표시
- 광고주가 지불할 금액을 명확히 표시

### 3. 날짜 검증
```javascript
// 날짜 순서 검증
document.getElementById('application_end_date').addEventListener('change', function() {
  const startDate = new Date(document.getElementById('application_start_date').value);
  const endDate = new Date(this.value);

  if (endDate < startDate) {
    alert('지원 마감일은 시작일 이후여야 합니다');
    this.value = '';
  }
});
```

### 4. 이미지 업로드 제한
```javascript
// 파일 크기 및 형식 검증
document.getElementById('thumbnail_file').addEventListener('change', function(e) {
  const file = this.files[0];
  
  // 파일 크기 제한 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('이미지 크기는 5MB 이하여야 합니다');
    this.value = '';
    return;
  }

  // 파일 형식 제한
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    alert('JPG, PNG, GIF 형식만 업로드 가능합니다');
    this.value = '';
    return;
  }
});
```

### 5. 자동 저장 (Draft)
```javascript
// 로컬 스토리지에 임시 저장
function saveDraft() {
  const formData = {
    title: document.getElementById('campaign_title').value,
    description: document.getElementById('description').value,
    // ... 기타 필드
  };
  localStorage.setItem('campaign_draft', JSON.stringify(formData));
}

// 페이지 로드 시 복원
function loadDraft() {
  const draft = localStorage.getItem('campaign_draft');
  if (draft) {
    const formData = JSON.parse(draft);
    document.getElementById('campaign_title').value = formData.title || '';
    // ... 기타 필드 복원
  }
}

// 자동 저장 (3초마다)
setInterval(saveDraft, 3000);
```

---

## 📋 체크리스트

### 구현 전 확인사항
- [ ] API 엔드포인트 테스트 완료
- [ ] 인증 (Session Cookie) 확인
- [ ] 관리자 권한 확인

### 필수 기능
- [ ] 제목 입력 필드
- [ ] 채널 선택 드롭다운
- [ ] 과금 방식 선택
- [ ] 모집 인원 입력
- [ ] 제품 가치/포인트 입력
- [ ] 제출 버튼

### 선택 기능
- [ ] 이미지 업로드 & 미리보기
- [ ] 날짜 선택 (Date Picker)
- [ ] 실시간 수수료 계산
- [ ] 필드 유효성 검증
- [ ] 임시 저장 (Draft)

### UI/UX
- [ ] 필수 필드 표시 (*)
- [ ] 에러 메시지 표시
- [ ] 로딩 상태 표시
- [ ] 성공/실패 알림
- [ ] 취소 버튼

---

## 🔍 테스트 시나리오

### 1. 최소 필드로 생성
```bash
curl -X POST https://fa737302.checknreviews-v1.pages.dev/api/campaigns/ \
  -H "Content-Type: application/json" \
  -H "Cookie: session=xxx" \
  -d '{
    "title": "테스트 캠페인",
    "channel_type": "instagram",
    "pricing_type": "product_only"
  }'
```

### 2. 전체 필드로 생성
```bash
curl -X POST https://fa737302.checknreviews-v1.pages.dev/api/campaigns/ \
  -H "Content-Type: application/json" \
  -H "Cookie: session=xxx" \
  -d @campaign_full.json
```

### 3. 에러 케이스
- 제목 누락
- 채널 누락
- 잘못된 pricing_type
- 세션 없음 (401)
- 관리자 권한 없음 (403)

---

## 💡 팁

1. **관리자 자동 승인**: 관리자가 생성한 캠페인은 `status='active'`로 바로 생성 가능
2. **광고주 선택**: 관리자는 특정 광고주를 대신하여 생성 가능 (advertiser_id 지정)
3. **벌크 생성**: 여러 캠페인을 한 번에 생성하는 기능 추가 가능
4. **템플릿**: 자주 사용하는 캠페인 설정을 템플릿으로 저장

---

## 📞 문의

추가로 필요한 기능이나 문의사항이 있으시면 언제든지 연락주세요!
