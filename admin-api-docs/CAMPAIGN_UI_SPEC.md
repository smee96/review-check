# 📋 캠페인 생성/수정 화면 명세서

## 📑 목차
1. [화면 개요](#화면-개요)
2. [섹션별 상세 명세](#섹션별-상세-명세)
3. [과금 방식별 UI 변경](#과금-방식별-ui-변경)
4. [이미지 업로드 명세](#이미지-업로드-명세)
5. [날짜 선택기 명세](#날짜-선택기-명세)
6. [실시간 계산 로직](#실시간-계산-로직)
7. [유효성 검증](#유효성-검증)
8. [캠페인 수정 차이점](#캠페인-수정-차이점)

---

## 🎯 화면 개요

### 접근 경로
- **URL**: `/campaigns/create` (관리자/광고주)
- **권한**: admin, advertiser, agency, rep
- **레이아웃**: 풀페이지 또는 콘텐츠 영역

### 화면 구조
```
┌─────────────────────────────────────┐
│  상단 네비게이션                      │
├─────────────────────────────────────┤
│  < 캠페인관리로 (뒤로가기)            │
│                                     │
│  캠페인 등록                         │
│  ┌───────────────────────────────┐ │
│  │ 1. 기본 정보 섹션              │ │
│  │ 2. 썸네일 이미지 섹션          │ │
│  │ 3. 채널별 상세 정보 섹션       │ │
│  │ 4. 일정 관리 섹션              │ │
│  │ 5. 제공 내역 섹션              │ │
│  │ 6. 미션 및 요구사항 섹션       │ │
│  │ 7. 과금 방식 선택 섹션         │ │
│  │ 8. 과금 상세 입력 섹션         │ │
│  │ 9. 예상 수수료 카드            │ │
│  │ [등록하기] [취소]              │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  푸터                                │
└─────────────────────────────────────┘
```

---

## 📝 섹션별 상세 명세

### 1️⃣ 기본 정보 섹션
**배경색**: 흰색 (`bg-white`)  
**테두리**: 2px 회색 (`border-2 border-gray-200`)  
**아이콘**: ℹ️ 파란색 (`fas fa-info-circle text-blue-600`)

#### 필드 목록

##### 1.1 캠페인 채널 * (필수)
```html
<select id="campaignChannelType" required onchange="app.handleChannelChange()">
  <option value="">채널을 선택하세요</option>
  <option value="instagram">인스타그램</option>
  <option value="blog">네이버 블로그</option>
  <option value="youtube">유튜브</option>
  <option value="smartstore">구매처 리뷰</option>
</select>
```
- **필드 타입**: Select 드롭다운
- **기본값**: 빈 문자열
- **검증**: 필수 선택
- **설명**: "💡 한 캠페인은 하나의 채널만 선택 가능합니다. 여러 채널을 진행하려면 '복사' 기능을 이용하면 편하게 캠페인을 생성할 수 있습니다."
- **이벤트**: `onchange` 시 채널별 상세 정보 섹션 표시

##### 1.2 캠페인 제목 * (필수)
```html
<input type="text" id="campaignTitle" required>
```
- **필드 타입**: Text
- **기본값**: 빈 문자열
- **검증**: 필수 입력
- **최대 길이**: 제한 없음

##### 1.3 캠페인 설명 (선택)
```html
<textarea id="campaignDescription" rows="4" 
  placeholder="캠페인에 대한 간단한 소개를 작성해주세요">
</textarea>
```
- **필드 타입**: Textarea
- **행 수**: 4
- **기본값**: 빈 문자열
- **최대 길이**: 제한 없음

##### 1.4 모집인원 * (필수)
```html
<input type="text" id="campaignSlots" value="10" required
  oninput="app.formatNumberInput(this); app.calculateNewPricingCost()"
  onfocus="app.clearDefaultZero(this)"
  onblur="if(this.value=='') {this.value='10'}; 
          const numValue=parseInt(this.value.replace(/,/g,'')); 
          if(numValue < 10) {alert('모집인원은 최소 10명 이상이어야 합니다'); this.value='10'}; 
          app.calculateNewPricingCost()">
```
- **필드 타입**: Text (숫자 입력, 천단위 콤마)
- **기본값**: "10"
- **최소값**: 10명
- **검증**: 최소 10명 이상
- **자동 포맷**: 천단위 콤마 (`formatNumberInput`)
- **설명**: "최소 10명부터 모집 가능합니다"
- **이벤트**: 
  - `oninput`: 콤마 포맷 + 수수료 재계산
  - `onblur`: 빈 값이면 "10" 복원, 10명 미만 시 알림

---

### 2️⃣ 썸네일 이미지 섹션
**배경색**: 흰색 (`bg-white`)  
**테두리**: 2px 회색  
**아이콘**: 🖼️ 인디고 (`fas fa-image text-indigo-600`)

#### 필드 목록

##### 2.1 이미지 업로드 (선택)
```html
<input type="file" id="campaignThumbnail" 
  accept=".jpg,.jpeg,.png,.gif,.bmp"
  onchange="app.handleThumbnailUpload(event)">
```
- **필드 타입**: File
- **허용 형식**: JPG, JPEG, PNG, GIF, BMP
- **최대 용량**: 10MB
- **이미지 요구사항**:
  - ✅ 권장 크기: 1000px × 1000px
  - ✅ 최소 크기: 300px × 300px 초과
  - ✅ 최대 크기: 4000px × 4000px 미만
  - ✅ 가로:세로 비율: 1:2 이내 (0.5 ~ 2.0)
- **검증 로직**:
  ```javascript
  // 1. 파일 형식 검증
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
  if (!allowedTypes.includes(file.type)) {
    alert('JPG, JPEG, PNG, GIF, BMP 형식의 이미지만 업로드 가능합니다.');
    return;
  }

  // 2. 파일 크기 검증 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('이미지 크기는 10MB를 초과할 수 없습니다.');
    return;
  }

  // 3. 이미지 로드 및 크기 검증
  const img = new Image();
  img.onload = () => {
    const width = img.width;
    const height = img.height;

    if (width <= 300 || height <= 300) {
      alert('이미지 크기는 300px × 300px을 초과해야 합니다.');
      return;
    }

    if (width >= 4000 || height >= 4000) {
      alert('이미지 크기는 4000px × 4000px 미만이어야 합니다.');
      return;
    }

    // 4. 비율 검증 (가로:세로 = 1:2 이내)
    const ratio = width / height;
    if (ratio > 2 || ratio < 0.5) {
      alert('이미지 비율은 가로:세로 = 1:2 이내여야 합니다.\n현재 비율: ' + ratio.toFixed(2));
      return;
    }

    // 5. Base64로 변환하여 저장
    this.thumbnailData = reader.result;
  };
  ```

##### 2.2 이미지 미리보기 (동적 표시)
```html
<div id="thumbnailPreview" style="display: none;">
  <img id="thumbnailPreviewImage" src="" 
    class="max-w-xs max-h-64 border-2 border-gray-300 rounded-lg">
  <button type="button" onclick="app.removeThumbnail()" 
    class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8">
    <i class="fas fa-times"></i>
  </button>
  <p id="thumbnailInfo" class="text-xs text-gray-500 mt-2"></p>
</div>
```
- **표시 조건**: 이미지 업로드 후
- **미리보기 정보**: "크기: {width}px × {height}px | 용량: {size}MB | 비율: {ratio}"
- **삭제 버튼**: 우측 상단 ❌ 버튼 클릭 시 `removeThumbnail()` 호출

---

### 3️⃣ 채널별 상세 정보 섹션 (동적 표시)
**배경색**: 흰색  
**테두리**: 2px 인디고 (`border-2 border-indigo-200`)  
**아이콘**: # 인디고 (`fas fa-hashtag text-indigo-600`)  
**표시 조건**: 채널 선택 시 (`channelType` !== "")

#### 채널별 필드

##### 3.1 Instagram
```html
<div id="channelSpecificFields">
  <label>멘션 계정</label>
  <input type="text" id="instagramMentionAccount" 
    placeholder="@yourhandle">
  <p class="text-xs">예: @checknreview (@ 포함)</p>
</div>
```
- **필드**: 멘션 계정
- **ID**: `instagramMentionAccount`
- **형식**: @username
- **설명**: "예: @checknreview (@ 포함)"

##### 3.2 Blog (네이버 블로그)
```html
<div id="channelSpecificFields">
  <label>제품 링크</label>
  <input type="url" id="blogProductUrl" 
    placeholder="https://blog.naver.com/...">
  <p class="text-xs">블로그에 포함할 제품 링크</p>
</div>
```
- **필드**: 제품 링크
- **ID**: `blogProductUrl`
- **형식**: URL

##### 3.3 YouTube
```html
<div id="channelSpecificFields">
  <label>구매 링크</label>
  <input type="url" id="youtubePurchaseLink" 
    placeholder="https://...">
  <p class="text-xs">영상 설명란에 포함할 구매 링크</p>
</div>
```
- **필드**: 구매 링크
- **ID**: `youtubePurchaseLink`
- **형식**: URL

##### 3.4 SmartStore (구매처 리뷰)
```html
<div id="channelSpecificFields">
  <label>스마트스토어 상품 URL</label>
  <input type="url" id="smartstoreProductUrl" 
    placeholder="https://smartstore.naver.com/...">
  <p class="text-xs">스마트스토어 상품 페이지 URL</p>
</div>
```
- **필드**: 스마트스토어 상품 URL
- **ID**: `smartstoreProductUrl`
- **형식**: URL

---

### 4️⃣ 일정 관리 섹션
**배경색**: 흰색  
**테두리**: 2px 회색  
**아이콘**: 📅 초록색 (`fas fa-calendar-alt text-green-600`)

#### 필드 목록 (6개 날짜 필드)

##### 4.1 모집 시작일 * (필수)
```html
<input type="text" id="campaignApplicationStartDate" 
  required readonly placeholder="날짜를 선택하세요"
  class="...cursor-pointer">
```
- **필드 타입**: Text (readonly, Date Picker)
- **ID**: `campaignApplicationStartDate`
- **검증**: 필수
- **Date Picker**: Flatpickr 사용
- **최소 날짜**: 오늘 (`minDate: "today"`)

##### 4.2 모집 종료일 * (필수)
```html
<input type="text" id="campaignApplicationEndDate" 
  required readonly placeholder="날짜를 선택하세요">
```
- **ID**: `campaignApplicationEndDate`
- **검증**: 필수, 모집 시작일 이후
- **최소 날짜**: 모집 시작일

##### 4.3 인플루언서 선정발표일 * (필수)
```html
<input type="text" id="campaignAnnouncementDate" 
  required readonly placeholder="날짜를 선택하세요">
```
- **ID**: `campaignAnnouncementDate`
- **검증**: 필수, 모집 종료일 이후
- **최소 날짜**: 모집 종료일

##### 4.4 컨텐츠 등록 시작일 * (필수)
```html
<input type="text" id="campaignContentStartDate" 
  required readonly placeholder="날짜를 선택하세요">
```
- **ID**: `campaignContentStartDate`
- **검증**: 필수, 선정발표일 이후
- **최소 날짜**: 선정발표일

##### 4.5 컨텐츠 등록 종료일 * (필수)
```html
<input type="text" id="campaignContentEndDate" 
  required readonly placeholder="날짜를 선택하세요">
```
- **ID**: `campaignContentEndDate`
- **검증**: 필수, 컨텐츠 등록 시작일 이후
- **최소 날짜**: 컨텐츠 등록 시작일

##### 4.6 결과 발표일 * (필수)
```html
<input type="text" id="campaignResultAnnouncementDate" 
  required readonly placeholder="날짜를 선택하세요">
```
- **ID**: `campaignResultAnnouncementDate`
- **검증**: 필수, 컨텐츠 등록 종료일 이후
- **최소 날짜**: 컨텐츠 등록 종료일

#### 날짜 순서 안내
```
ℹ️ 날짜는 순서대로 입력되어야 합니다:
신청시작 → 신청마감 → 선정발표 → 등록시작 → 등록마감 → 결과발표
```

---

### 5️⃣ 제공 내역 섹션
**배경색**: 흰색  
**테두리**: 2px 회색  
**아이콘**: 🎁 핑크 (`fas fa-gift text-pink-600`)

#### 필드 목록

##### 5.1 제공 내역 (선택)
```html
<textarea id="campaignProvidedItems" rows="3" 
  placeholder="예: 제품 1개 제공, 서비스 이용권 제공 등">
</textarea>
```
- **필드 타입**: Textarea
- **행 수**: 3
- **설명**: "상품, 이용권, 서비스 등 제공하는 항목을 상세히 기재해주세요"

##### 5.2 제품/서비스명 (선택)
```html
<input type="text" id="campaignProductName" 
  placeholder="예: 프리미엄 화장품 세트">
```
- **필드 타입**: Text

##### 5.3 제품/서비스 URL (선택)
```html
<input type="url" id="campaignProductUrl" 
  placeholder="https://...">
```
- **필드 타입**: URL

##### 5.4 예상 가액 (선택)
```html
<input type="text" id="campaignBudget" 
  placeholder="제공 항목의 예상 가액을 입력해주세요"
  oninput="app.formatNumberInput(this)"
  onfocus="app.clearDefaultZero(this)">
```
- **필드 타입**: Text (숫자 입력, 천단위 콤마)
- **자동 포맷**: 천단위 콤마
- **설명**: "제품 또는 서비스 제공 시 해당 금액 입력"

---

### 6️⃣ 미션 및 요구사항 섹션
**배경색**: 흰색  
**테두리**: 2px 회색  
**아이콘**: ✅ 주황색 (`fas fa-tasks text-orange-600`)

#### 필드 목록

##### 6.1 미션 (최대 10개)
```html
<div id="missionContainer" class="space-y-2">
  <!-- 미션 입력 필드들이 동적으로 추가 -->
  <input type="text" id="mission1" placeholder="미션 1">
  <input type="text" id="mission2" placeholder="미션 2">
  ...
</div>
<button type="button" onclick="app.addMissionField()">
  <i class="fas fa-plus-circle mr-1"></i>미션 추가
</button>
```
- **필드 타입**: Text (동적 추가)
- **최대 개수**: 10개
- **동적 추가**: `addMissionField()` 함수
- **설명**: "인플루언서가 수행해야 할 미션을 명확히 작성해주세요"

##### 6.2 요구사항 (선택)
```html
<textarea id="campaignRequirements" rows="3" 
  placeholder="예: 최소 팔로워 1000명 이상, 뷰티 카테고리 인플루언서">
</textarea>
```
- **필드 타입**: Textarea
- **행 수**: 3
- **설명**: "인플루언서 선정 기준이나 조건을 작성해주세요"

##### 6.3 키워드 (선택)
```html
<div id="keywordContainer" class="...flex flex-wrap gap-2"
  onclick="document.getElementById('keywordInput').focus()">
  <!-- 해시태그 버튼들이 여기에 추가 -->
  <input type="text" id="keywordInput" 
    placeholder="키워드 입력 후 엔터, 쉼표, 스페이스"
    onkeydown="app.handleKeywordInput(event)">
</div>
<input type="hidden" id="campaignKeywords">
```
- **필드 타입**: Custom (해시태그 입력)
- **입력 방법**: 엔터, 쉼표(,), 스페이스
- **저장 형태**: Hidden 필드에 쉼표로 구분된 문자열
- **UI**: 해시태그 버튼으로 표시 (삭제 가능)
- **설명**: "키워드 입력 후 엔터, 쉼표(,), 스페이스로 추가됩니다"

##### 6.4 유의사항 (선택)
```html
<textarea id="campaignNotes" rows="8">
1. 제공받은 제품은 타인에게 양도 및 판매, 교환이 불가능...
2. 리뷰 콘텐츠 등록 기간 내 리뷰 콘텐츠 미등록 시...
...
8. 체험하신 블로거분들의 리뷰 콘텐츠는 업체 홍보로...
</textarea>
```
- **필드 타입**: Textarea
- **행 수**: 8
- **기본값**: 8가지 기본 유의사항 자동 입력
- **설명**: "기본 유의사항이 자동 입력됩니다. 필요시 수정 또는 추가 가능합니다"

---

### 7️⃣ 과금 방식 선택 섹션
**배경색**: 파란색 배경 (`bg-blue-50`)  
**테두리**: 2px 파란색 (`border-2 border-blue-200`)  
**아이콘**: 💲 (`fas fa-dollar-sign`)

#### 추천 안내 배너
```html
<div class="bg-gradient-to-r from-orange-50 to-yellow-50 
  border-2 border-orange-300 rounded-lg p-3 mb-4">
  <i class="fas fa-star text-orange-500"></i>
  <p class="text-sm font-semibold text-orange-900">
    💡 포인트 지급을 추천합니다!
  </p>
  <p class="text-xs text-orange-800">
    포인트를 많이 지급할수록 <strong>완성도 높은 리뷰</strong>를 받을 수 있습니다.
  </p>
</div>
```

#### 과금 방식 라디오 버튼 (6가지)

##### 7.1 포인트만 지급 (추천)
```html
<label class="cursor-pointer">
  <input type="radio" name="pricingType" value="points_only" 
    onchange="app.handlePricingTypeChange()" checked>
  <div class="...peer-checked:border-orange-600 peer-checked:bg-orange-50">
    <span>포인트만 지급</span>
    <span class="...bg-orange-600">추천</span>
    <i class="fas fa-coins text-orange-600"></i>
    <p class="text-xs">체크포인트만 지급</p>
    <p class="text-xs">건당 10,000원 + 포인트 30% 수수료</p>
    <p class="text-xs text-orange-600">✨ 가장 높은 리뷰 퀄리티</p>
  </div>
</label>
```
- **기본 선택**: ✅ 체크됨
- **배경색**: 주황색 (`peer-checked:bg-orange-50`)
- **테두리**: 주황색 (`peer-checked:border-orange-600`)
- **설명**: 
  - "체크포인트만 지급"
  - "건당 10,000원 + 포인트 30% 수수료"
  - "✨ 가장 높은 리뷰 퀄리티"

##### 7.2 구매 + 포인트
```html
<input type="radio" name="pricingType" value="purchase_with_points">
```
- **배경색**: 인디고 (`peer-checked:bg-indigo-50`)
- **설명**: 
  - "리뷰어가 직접 구매 + 포인트"
  - "건당 10,000원 + 포인트 30% 수수료"
  - "💰 포인트로 리뷰 품질 향상"

##### 7.3 상품만 제공 (숨김 처리)
```html
<!-- 프로모션 기간 동안 숨김 -->
<!--
<input type="radio" name="pricingType" value="product_only">
-->
```
- **현재 상태**: 주석 처리됨

##### 7.4 상품 + 포인트
```html
<input type="radio" name="pricingType" value="product_with_points">
```
- **배경색**: 파란색 (`peer-checked:bg-blue-50`)
- **설명**:
  - "상품 + 체크포인트"
  - "건당 10,000원 + 포인트 30% 수수료"
  - "💰 포인트로 리뷰 품질 향상"

##### 7.5 이용권만 제공 (숨김 처리)
```html
<!-- 프로모션 기간 동안 숨김 -->
```
- **현재 상태**: 주석 처리됨

##### 7.6 이용권 + 포인트
```html
<input type="radio" name="pricingType" value="voucher_with_points">
```
- **배경색**: 틸 (`peer-checked:bg-teal-50`)

---

### 8️⃣ 과금 상세 입력 섹션 (동적 표시)
**표시 조건**: 과금 방식 선택 시

#### 8.1 상품/이용권 가액 입력
```html
<div id="productValueSection" style="display: none;">
  <label>상품/이용권 가액 (원) *</label>
  <input type="text" id="campaignProductValue" 
    oninput="app.formatNumberInput(this); app.calculateNewPricingCost()"
    onfocus="app.clearDefaultZero(this)">
  <p class="text-xs">리뷰어가 받는 상품/이용권의 가액</p>
</div>
```
- **표시 조건**: 
  - `purchase_with_points` ✅
  - `product_only` ✅
  - `product_with_points` ✅
  - `voucher_only` ✅
  - `voucher_with_points` ✅
  - `points_only` ❌ (숨김)
- **자동 포맷**: 천단위 콤마
- **이벤트**: 입력 시 수수료 재계산

#### 8.2 체크포인트 입력
```html
<div id="spherePointsSection" style="display: block;">
  <label>체크포인트 *</label>
  <input type="text" id="campaignSpherePoints" 
    oninput="app.formatNumberInput(this); app.calculateNewPricingCost()"
    onfocus="app.clearDefaultZero(this)">
  <p class="text-xs">리뷰어에게 지급할 체크포인트</p>
  <p class="text-xs text-orange-600">
    💡 포인트를 많이 지급할수록 높은 퀄리티의 리뷰를 받을 수 있습니다!
  </p>
</div>
```
- **표시 조건**:
  - `points_only` ✅
  - `purchase_with_points` ✅
  - `product_with_points` ✅
  - `voucher_with_points` ✅
  - `product_only` ❌ (숨김)
  - `voucher_only` ❌ (숨김)
- **자동 포맷**: 천단위 콤마
- **이벤트**: 입력 시 수수료 재계산

---

### 9️⃣ 예상 수수료 카드 (실시간 계산)
**배경색**: 그라데이션 회색 → 보라색  
**테두리**: 2px 보라색

```html
<div class="bg-gradient-to-br from-gray-50 to-purple-50 
  border-2 border-purple-300 rounded-lg p-4">
  <h3 class="font-bold text-purple-900 mb-3">
    <i class="fas fa-calculator mr-2"></i>예상 수수료
  </h3>
  
  <!-- 런칭 프로모션 안내 -->
  <div class="bg-gradient-to-r from-orange-100 to-yellow-100 
    border-2 border-orange-400 rounded-lg p-3 mb-4">
    <div class="flex items-center gap-2 mb-1">
      <i class="fas fa-fire text-orange-600"></i>
      <span class="font-bold text-orange-900">
        🎉 런칭 프로모션 진행중!
      </span>
    </div>
    <div class="text-sm text-orange-800">
      <div class="line-through">
        원래 건당 수수료: <strong>30,000원</strong>
      </div>
      <div class="font-bold text-lg text-red-600">
        ➜ 현재 건당 수수료: <strong>무료!</strong>
      </div>
      <div class="text-xs mt-1">
        포인트 수수료만 15%로 책정 (원래 30%)
      </div>
    </div>
  </div>

  <!-- 수수료 계산 결과 -->
  <div class="space-y-3">
    <div class="bg-white rounded-lg p-3 border border-purple-200">
      <div class="text-sm text-gray-700">
        • 모집인원: <span id="feeCalcSlots">10</span>명
      </div>
      <div class="text-sm text-gray-700">
        • 과금방식: <span id="feeCalcType">포인트만 지급</span>
      </div>
      <div class="text-sm text-gray-700" id="feeCalcProductValue" style="display: none;">
        • 상품/이용권 가액: <span id="feeCalcProductAmount">0</span>원
      </div>
      <div class="text-sm text-gray-700" id="feeCalcPoints" style="display: block;">
        • 체크포인트: <span id="feeCalcPointsAmount">0</span>원
      </div>
    </div>

    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-600">건당 고정 수수료:</span>
        <span class="font-semibold">
          <span id="feeFixedPerSlot">0</span>원
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">건당 포인트 수수료 (15%):</span>
        <span class="font-semibold">
          <span id="feePointsPerSlot">0</span>원
        </span>
      </div>
      <div class="flex justify-between border-t border-gray-300 pt-2">
        <span class="text-gray-700 font-medium">건당 소계:</span>
        <span class="font-bold">
          <span id="feeSubtotalPerSlot">0</span>원
        </span>
      </div>
    </div>

    <div class="space-y-2 text-sm border-t-2 border-purple-300 pt-3">
      <div class="flex justify-between">
        <span class="text-gray-700">총 금액 (<span id="feeTotalSlots">10</span>명):</span>
        <span class="font-semibold">
          <span id="feeTotalAmount">0</span>원
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-700">부가세 (10%):</span>
        <span class="font-semibold">
          <span id="feeVat">0</span>원
        </span>
      </div>
      <div class="flex justify-between text-lg border-t-2 border-purple-400 pt-2">
        <span class="text-purple-900 font-bold">최종 결제 금액:</span>
        <span class="text-purple-600 font-bold">
          <span id="feeFinalAmount">0</span>원
        </span>
      </div>
    </div>

    <!-- 프로모션 안내 -->
    <div class="bg-yellow-50 border border-yellow-300 rounded p-2 text-xs text-yellow-800">
      <i class="fas fa-info-circle mr-1"></i>
      프로모션 종료 후에는 건당 30,000원의 고정 수수료가 부과됩니다.
    </div>
  </div>
</div>
```

#### 계산 로직
```javascript
// pricing-utils.js 참조
async calculateFullPricing(pricingType, productValue, spherePoints, slots) {
  // 1. 시스템 설정 조회
  const settings = await this.getSystemSettings();
  const fixedFee = settings[`fixed_fee_${pricingType}`] || 0;
  const pointsFeeRate = settings.points_fee_rate || 15;

  // 2. 건당 수수료 계산
  const pointsFee = Math.floor(spherePoints * (pointsFeeRate / 100));
  const subtotalPerSlot = fixedFee + pointsFee;

  // 3. 총 금액 계산
  let totalCost;
  if (pricingType === 'purchase_with_points') {
    // 구매+포인트: 제품 가액 포함
    totalCost = (productValue + spherePoints + subtotalPerSlot) * slots;
  } else {
    // 그 외: 포인트 + 수수료만
    totalCost = (spherePoints + subtotalPerSlot) * slots;
  }

  // 4. VAT 계산
  const vat = Math.floor(totalCost * 0.1);
  const finalAmount = totalCost + vat;

  return {
    fixedFee,
    pointsFee,
    subtotalPerSlot,
    totalAmount: totalCost,
    vat,
    finalAmount
  };
}
```

---

### 🔟 제출 버튼
```html
<div class="flex gap-4 pt-6">
  <button type="submit" 
    class="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg 
    hover:bg-purple-700 transition font-semibold">
    <i class="fas fa-check mr-2"></i>등록하기
  </button>
  <button type="button" 
    onclick="app.user.role === 'admin' ? app.showAdminCampaigns() : app.showAdvertiserCampaigns()"
    class="flex-1 bg-gray-300 text-gray-800 py-3 px-6 rounded-lg 
    hover:bg-gray-400 transition font-semibold">
    <i class="fas fa-times mr-2"></i>취소
  </button>
</div>
```

---

## 🔄 과금 방식별 UI 변경

### 과금 방식 선택 시 동작

```javascript
handlePricingTypeChange() {
  const pricingType = document.querySelector('input[name="pricingType"]:checked').value;
  
  const productValueSection = document.getElementById('productValueSection');
  const spherePointsSection = document.getElementById('spherePointsSection');

  // 1. 상품/이용권 가액 필드 표시/숨김
  if (pricingType === 'points_only') {
    productValueSection.style.display = 'none';
    spherePointsSection.style.display = 'block';
  } 
  else if (pricingType === 'product_only' || pricingType === 'voucher_only') {
    productValueSection.style.display = 'block';
    spherePointsSection.style.display = 'none';
  }
  else {
    // purchase_with_points, product_with_points, voucher_with_points
    productValueSection.style.display = 'block';
    spherePointsSection.style.display = 'block';
  }

  // 2. 수수료 재계산
  this.calculateNewPricingCost();
}
```

### 표시 조건 요약표

| 과금 방식 | 상품/이용권 가액 | 체크포인트 |
|---------|----------------|-----------|
| points_only | ❌ 숨김 | ✅ 표시 |
| purchase_with_points | ✅ 표시 | ✅ 표시 |
| product_only | ✅ 표시 | ❌ 숨김 |
| product_with_points | ✅ 표시 | ✅ 표시 |
| voucher_only | ✅ 표시 | ❌ 숨김 |
| voucher_with_points | ✅ 표시 | ✅ 표시 |

---

## 📷 이미지 업로드 명세

### 이미지 검증 흐름도

```
파일 선택
    ↓
파일 형식 검증
(JPG, JPEG, PNG, GIF, BMP)
    ↓
파일 크기 검증
(최대 10MB)
    ↓
이미지 로드
    ↓
이미지 크기 검증
(300px~4000px)
    ↓
비율 검증
(0.5~2.0)
    ↓
✅ Base64 변환 및 저장
    ↓
미리보기 표시
```

### Base64 변환 및 저장

```javascript
handleThumbnailUpload(event) {
  const file = event.target.files[0];
  
  // FileReader로 Base64 변환
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // 검증 통과
      this.thumbnailData = e.target.result; // Base64 저장
      
      // 미리보기 표시
      document.getElementById('thumbnailPreview').style.display = 'block';
      document.getElementById('thumbnailPreviewImage').src = e.target.result;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
```

### API 전송

```javascript
// 캠페인 등록 시 thumbnail_image 필드에 Base64 포함
const campaignData = {
  title: "...",
  thumbnail_image: this.thumbnailData, // "data:image/jpeg;base64,..."
  // ... 기타 필드
};

await axios.post('/api/campaigns/', campaignData);
```

### 서버 처리 (자동 R2 업로드)

```typescript
// src/routes/campaigns.ts
if (thumbnail_image && thumbnail_image.startsWith('data:image')) {
  // Base64 데이터 추출
  const base64Data = thumbnail_image.split(',')[1];
  const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  // Cloudflare R2에 업로드
  await env.R2.put(`${campaignId}.jpg`, buffer, {
    httpMetadata: { contentType: 'image/jpeg' }
  });
  
  // URL 업데이트
  const r2Url = `/api/images/${campaignId}.jpg`;
  await env.DB.prepare(
    'UPDATE campaigns SET thumbnail_image = ? WHERE id = ?'
  ).bind(r2Url, campaignId).run();
}
```

---

## 📅 날짜 선택기 명세

### Flatpickr 설정

```javascript
// 날짜 선택기 초기화
flatpickr("#campaignApplicationStartDate", {
  dateFormat: "Y-m-d",
  minDate: "today",
  locale: "ko",
  onChange: function(selectedDates, dateStr) {
    // 모집 종료일의 최소 날짜 업데이트
    flatpickr("#campaignApplicationEndDate", {
      dateFormat: "Y-m-d",
      minDate: dateStr,
      locale: "ko"
    });
  }
});

// 모집 종료일 선택 시
flatpickr("#campaignApplicationEndDate", {
  dateFormat: "Y-m-d",
  minDate: "today",
  locale: "ko",
  onChange: function(selectedDates, dateStr) {
    // 선정발표일의 최소 날짜 업데이트
    flatpickr("#campaignAnnouncementDate", {
      dateFormat: "Y-m-d",
      minDate: dateStr,
      locale: "ko"
    });
  }
});

// 이하 동일한 패턴으로 연결...
```

### 날짜 순서 검증

```javascript
validateDates() {
  const dates = {
    appStart: new Date(document.getElementById('campaignApplicationStartDate').value),
    appEnd: new Date(document.getElementById('campaignApplicationEndDate').value),
    announce: new Date(document.getElementById('campaignAnnouncementDate').value),
    contentStart: new Date(document.getElementById('campaignContentStartDate').value),
    contentEnd: new Date(document.getElementById('campaignContentEndDate').value),
    result: new Date(document.getElementById('campaignResultAnnouncementDate').value)
  };

  if (dates.appEnd < dates.appStart) {
    alert('모집 종료일은 시작일 이후여야 합니다');
    return false;
  }

  if (dates.announce < dates.appEnd) {
    alert('선정발표일은 모집 종료일 이후여야 합니다');
    return false;
  }

  // ... 이하 동일한 검증
  
  return true;
}
```

---

## 💸 실시간 계산 로직

### 계산 트리거

```javascript
// 다음 필드 변경 시 자동 계산
- campaignSlots (모집인원)
- pricingType (과금 방식)
- campaignProductValue (상품 가액)
- campaignSpherePoints (체크포인트)
```

### 계산 함수

```javascript
async calculateNewPricingCost() {
  // 1. 입력값 가져오기
  const slots = parseInt(document.getElementById('campaignSlots').value.replace(/,/g, '') || 10);
  const pricingType = document.querySelector('input[name="pricingType"]:checked').value;
  const productValue = parseInt(document.getElementById('campaignProductValue')?.value.replace(/,/g, '') || 0);
  const spherePoints = parseInt(document.getElementById('campaignSpherePoints')?.value.replace(/,/g, '') || 0);

  // 2. pricing-utils로 계산
  const result = await window.pricingUtils.calculateFullPricing(
    pricingType, 
    productValue, 
    spherePoints, 
    slots
  );

  // 3. UI 업데이트
  document.getElementById('feeCalcSlots').textContent = slots.toLocaleString();
  document.getElementById('feeCalcType').textContent = 
    window.pricingUtils.getPricingTypeName(pricingType);
  document.getElementById('feeCalcProductAmount').textContent = productValue.toLocaleString();
  document.getElementById('feeCalcPointsAmount').textContent = spherePoints.toLocaleString();
  
  document.getElementById('feeFixedPerSlot').textContent = result.fixedFee.toLocaleString();
  document.getElementById('feePointsPerSlot').textContent = result.pointsFee.toLocaleString();
  document.getElementById('feeSubtotalPerSlot').textContent = result.subtotalPerSlot.toLocaleString();
  
  document.getElementById('feeTotalSlots').textContent = slots.toLocaleString();
  document.getElementById('feeTotalAmount').textContent = result.totalAmount.toLocaleString();
  document.getElementById('feeVat').textContent = result.vat.toLocaleString();
  document.getElementById('feeFinalAmount').textContent = result.finalAmount.toLocaleString();
}
```

---

## ✅ 유효성 검증

### 제출 전 검증

```javascript
async handleCreateCampaign() {
  // 1. 채널 선택 검증
  const channelType = document.getElementById('campaignChannelType').value;
  if (!channelType) {
    alert('캠페인 채널을 선택해주세요');
    return;
  }

  // 2. 모집인원 검증
  const slots = parseInt(document.getElementById('campaignSlots').value.replace(/,/g, '') || 10);
  if (slots < 10) {
    alert('모집인원은 최소 10명 이상이어야 합니다');
    return;
  }

  // 3. 날짜 검증
  if (!this.validateDates()) {
    return;
  }

  // 4. 과금 방식별 필수 필드 검증
  const pricingType = document.querySelector('input[name="pricingType"]:checked').value;
  
  if (pricingType !== 'points_only' && pricingType !== 'product_only' && pricingType !== 'voucher_only') {
    // 상품 가액과 포인트 둘 다 필요
    const productValue = parseInt(document.getElementById('campaignProductValue').value.replace(/,/g, '') || 0);
    const spherePoints = parseInt(document.getElementById('campaignSpherePoints').value.replace(/,/g, '') || 0);
    
    if (productValue === 0 || spherePoints === 0) {
      alert('상품 가액과 체크포인트를 모두 입력해주세요');
      return;
    }
  }

  // 5. API 호출
  // ...
}
```

---

## 🔄 캠페인 수정 차이점

### 수정 화면 특징

1. **제목**: "캠페인 수정"
2. **버튼**: "수정하기" (등록하기 대신)
3. **기존 데이터 로드**: 모든 필드에 기존 값 채워짐
4. **이미지**: 기존 이미지 미리보기 표시

### 수정 시 데이터 로드

```javascript
async showEditCampaign(campaignId) {
  // 1. 기존 캠페인 데이터 조회
  const response = await axios.get(`/api/campaigns/${campaignId}`);
  const campaign = response.data;

  // 2. 폼 렌더링 (생성과 동일)
  await this.showCreateCampaign();

  // 3. 제목 변경
  document.querySelector('h2').textContent = '캠페인 수정';

  // 4. 기존 데이터 채우기
  document.getElementById('campaignChannelType').value = campaign.channel_type;
  document.getElementById('campaignTitle').value = campaign.title;
  document.getElementById('campaignDescription').value = campaign.description || '';
  document.getElementById('campaignSlots').value = (campaign.slots || 10).toLocaleString();

  // 5. 이미지 미리보기
  if (campaign.thumbnail_image) {
    document.getElementById('thumbnailPreview').style.display = 'block';
    document.getElementById('thumbnailPreviewImage').src = campaign.thumbnail_image;
  }

  // 6. 날짜 데이터
  document.getElementById('campaignApplicationStartDate').value = campaign.application_start_date;
  // ... 기타 날짜 필드

  // 7. 과금 방식 선택
  document.querySelector(`input[name="pricingType"][value="${campaign.pricing_type}"]`).checked = true;
  this.handlePricingTypeChange();

  // 8. 상품 가액 및 포인트
  if (campaign.product_value) {
    document.getElementById('campaignProductValue').value = campaign.product_value.toLocaleString();
  }
  if (campaign.sphere_points) {
    document.getElementById('campaignSpherePoints').value = campaign.sphere_points.toLocaleString();
  }

  // 9. 수수료 재계산
  this.calculateNewPricingCost();

  // 10. 제출 버튼 변경
  const form = document.getElementById('createCampaignForm');
  form.onsubmit = (e) => {
    e.preventDefault();
    this.handleUpdateCampaign(campaignId);
  };
}
```

### 수정 API 호출

```javascript
async handleUpdateCampaign(campaignId) {
  // 동일한 데이터 수집
  const campaignData = {
    // ... 생성과 동일
  };

  // PUT 요청
  await axios.put(`/api/campaigns/${campaignId}`, campaignData);

  alert('캠페인이 수정되었습니다');
  this.showAdvertiserCampaigns();
}
```

---

## 📱 반응형 디자인

### 브레이크포인트

- **모바일**: `< 640px` (sm)
- **태블릿**: `640px ~ 1024px` (md, lg)
- **데스크톱**: `> 1024px` (xl)

### 레이아웃 조정

```css
/* 모바일 */
.grid-cols-1 /* 1열 */

/* 태블릿 이상 */
.md:grid-cols-2 /* 2열 */

/* 버튼 크기 */
.px-3 sm:px-4 lg:px-8 /* 좌우 패딩 */
.py-6 sm:py-8 /* 상하 패딩 */
```

---

## 📄 요약

### 핵심 특징

1. **9개 섹션**: 체계적인 정보 입력
2. **6가지 과금 방식**: 유연한 선택
3. **실시간 수수료 계산**: 투명한 비용 표시
4. **이미지 검증**: 완벽한 업로드 검증
5. **날짜 연결**: 순차적 날짜 입력
6. **동적 UI**: 과금 방식에 따른 필드 표시/숨김
7. **천단위 콤마**: 모든 숫자 필드
8. **반응형**: 모바일/태블릿/데스크톱 최적화

### 개발 시 주의사항

- Flatpickr 라이브러리 필수
- pricing-utils.js 의존성
- Base64 이미지 처리
- 실시간 계산 트리거 관리
- 과금 방식별 UI 변경 로직

---

**작성일**: 2026-02-24  
**버전**: 1.0
