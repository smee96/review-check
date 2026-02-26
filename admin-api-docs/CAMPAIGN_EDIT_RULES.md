# 📋 캠페인 수정 권한 및 규칙 명세서

## 📑 목차
1. [캠페인 상태 정의](#캠페인-상태-정의)
2. [수정 권한 규칙](#수정-권한-규칙)
3. [상태별 수정 가능 범위](#상태별-수정-가능-범위)
4. [권한별 수정 규칙](#권한별-수정-규칙)
5. [수정 불가 조건](#수정-불가-조건)
6. [API 구현](#api-구현)
7. [UI 처리 가이드](#ui-처리-가이드)

---

## 🏷️ 캠페인 상태 정의

### DB 스키마
```sql
-- migrations/0001_initial_schema.sql
status TEXT NOT NULL DEFAULT 'pending' 
CHECK(status IN ('pending', 'approved', 'suspended', 'completed', 'cancelled'))
```

### 상태 목록

| 상태 (DB) | 한글명 | 설명 |
|----------|-------|------|
| `pending` | 승인 대기 | 캠페인 등록 후 관리자 승인 대기 중 |
| `approved` | 승인됨 (모집 중) | 관리자 승인 완료, 인플루언서 모집 가능 |
| `suspended` | 일시 중지 | 관리자에 의해 일시 중지된 상태 |
| `completed` | 완료 | 캠페인 종료 및 정산 완료 |
| `cancelled` | 취소됨 | 광고주 또는 관리자가 캠페인 취소 |

### 프론트엔드 표시 상태 매핑

프론트엔드에서는 더 세분화된 상태로 표시:

| DB 상태 | 프론트엔드 표시 | 조건 |
|---------|---------------|-----|
| `pending` | 승인 대기 | `status === 'pending'` |
| `approved` | 모집 중 | `status === 'approved'` + 신청 기간 내 |
| `approved` | 진행 중 | `status === 'approved'` + 신청 기간 종료 후 |
| `suspended` | 일시 중지 | `status === 'suspended'` |
| `completed` | 완료 | `status === 'completed'` |
| `cancelled` | 취소됨 | `status === 'cancelled'` |

---

## 🔐 수정 권한 규칙

### 기본 규칙

```typescript
// src/routes/campaigns.ts (line 429-468)
campaigns.put('/:id', authMiddleware, async (c) => {
  // 1. 소유권 확인
  const campaign = await env.DB.prepare(
    'SELECT advertiser_id, status, application_start_date FROM campaigns WHERE id = ?'
  ).bind(campaignId).first();
  
  // 2. 권한 체크: 관리자 OR 캠페인 소유자
  if (user.role !== 'admin' && campaign.advertiser_id !== user.userId) {
    return c.json({ error: '권한이 없습니다' }, 403);
  }
  
  // 3. 광고주 권한 추가 제약
  if (user.role !== 'admin') {
    // 3-1. 상태 체크
    if (campaign.status === 'recruiting' || 
        campaign.status === 'in_progress' || 
        campaign.status === 'suspended') {
      return c.json({ 
        error: '모집 중이거나 진행 중인 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.' 
      }, 403);
    }
    
    // 3-2. 신청 시작일 체크
    const now = new Date();
    const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    if (campaign.application_start_date && 
        campaign.application_start_date < koreaDate) {
      return c.json({ 
        error: '신청 시작일 이후에는 캠페인을 수정할 수 없습니다. 관리자에게 문의해주세요.' 
      }, 403);
    }
  }
});
```

---

## 📊 상태별 수정 가능 범위

### 🟡 pending (승인 대기)

| 항목 | 광고주 | 관리자 |
|-----|-------|-------|
| **기본 정보** (제목, 설명, 채널) | ✅ 전체 수정 가능 | ✅ 전체 수정 가능 |
| **썸네일 이미지** | ✅ 변경 가능 | ✅ 변경 가능 |
| **일정** (6개 날짜) | ✅ 전체 수정 가능 | ✅ 전체 수정 가능 |
| **제공 내역** | ✅ 전체 수정 가능 | ✅ 전체 수정 가능 |
| **과금 방식** | ✅ 변경 가능 | ✅ 변경 가능 |
| **모집 인원** | ✅ 변경 가능 | ✅ 변경 가능 |
| **상태 변경** | ❌ 불가 | ✅ approved/cancelled로 변경 가능 |

**조건**:
- ✅ 신청 시작일 이전이면 **모든 필드 수정 가능**
- ❌ 신청 시작일 당일 또는 이후면 **광고주 수정 불가**

---

### 🟢 approved (승인됨 / 모집 중)

| 항목 | 광고주 | 관리자 |
|-----|-------|-------|
| **기본 정보** | ❌ 수정 불가 | ✅ 전체 수정 가능 |
| **썸네일 이미지** | ❌ 수정 불가 | ✅ 변경 가능 |
| **일정** | ❌ 수정 불가 | ⚠️ 신중히 수정 (지원자 알림 필요) |
| **제공 내역** | ❌ 수정 불가 | ✅ 수정 가능 |
| **과금 방식** | ❌ 수정 불가 | ⚠️ 수정 비권장 (정산 영향) |
| **모집 인원** | ❌ 수정 불가 | ⚠️ 증가만 권장 |
| **상태 변경** | ❌ 불가 | ✅ suspended/completed/cancelled로 변경 |

**조건**:
- 광고주: **전체 수정 불가** (관리자에게 문의)
- 관리자: 모든 필드 수정 가능하지만, **신중히 처리** (지원자에게 영향)

---

### 🔴 suspended (일시 중지)

| 항목 | 광고주 | 관리자 |
|-----|-------|-------|
| **기본 정보** | ❌ 수정 불가 | ✅ 전체 수정 가능 |
| **썸네일 이미지** | ❌ 수정 불가 | ✅ 변경 가능 |
| **일정** | ❌ 수정 불가 | ✅ 수정 가능 |
| **제공 내역** | ❌ 수정 불가 | ✅ 수정 가능 |
| **과금 방식** | ❌ 수정 불가 | ⚠️ 수정 비권장 |
| **모집 인원** | ❌ 수정 불가 | ✅ 수정 가능 |
| **상태 변경** | ❌ 불가 | ✅ approved/cancelled로 변경 |

**조건**:
- 광고주: **전체 수정 불가** (관리자가 중지시킨 상태)
- 관리자: 문제 해결 후 수정하여 재개 가능

---

### ⚫ completed (완료)

| 항목 | 광고주 | 관리자 |
|-----|-------|-------|
| **모든 필드** | ❌ 수정 불가 | ❌ 수정 불가 |
| **상태 변경** | ❌ 불가 | ❌ 불가 (영구 완료) |

**조건**:
- **아무도 수정할 수 없음** (정산 완료, 기록 보존)
- 수정 필요 시 복사 후 새 캠페인 생성

---

### ⚫ cancelled (취소됨)

| 항목 | 광고주 | 관리자 |
|-----|-------|-------|
| **모든 필드** | ❌ 수정 불가 | ❌ 수정 불가 |
| **상태 변경** | ❌ 불가 | ❌ 불가 (영구 취소) |

**조건**:
- **아무도 수정할 수 없음** (취소된 캠페인)
- 수정 필요 시 복사 후 새 캠페인 생성

---

## 👥 권한별 수정 규칙

### 광고주 (advertiser, agency, rep)

#### ✅ 수정 가능한 경우
```
1. status === 'pending' (승인 대기)
   AND
2. application_start_date > 오늘 날짜 (신청 시작일 이전)
```

#### ❌ 수정 불가능한 경우
```
1. status === 'approved' (모집 중)
   OR
2. status === 'suspended' (일시 중지)
   OR
3. status === 'completed' (완료)
   OR
4. status === 'cancelled' (취소됨)
   OR
5. application_start_date <= 오늘 날짜 (신청 시작일 당일 이후)
```

#### 에러 메시지
```typescript
if (campaign.status === 'recruiting' || 
    campaign.status === 'in_progress' || 
    campaign.status === 'suspended') {
  return '모집 중이거나 진행 중인 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.';
}

if (campaign.application_start_date < koreaDate) {
  return '신청 시작일 이후에는 캠페인을 수정할 수 없습니다. 관리자에게 문의해주세요.';
}
```

---

### 관리자 (admin)

#### ✅ 수정 가능한 경우
```
status IN ('pending', 'approved', 'suspended')
```

#### ⚠️ 수정 시 주의사항
- **approved (모집 중)**: 지원자에게 영향 → 신중히 수정
- **suspended (일시 중지)**: 문제 해결 후 수정

#### ❌ 수정 불가능한 경우
```
status === 'completed' (완료)
OR
status === 'cancelled' (취소됨)
```

**이유**: 
- 정산 완료 또는 취소된 캠페인은 **감사 추적**을 위해 수정 불가
- 수정 필요 시 복사 후 새 캠페인 생성

---

## 🚫 수정 불가 조건

### 1️⃣ 신청 시작일 이후 (광고주만)

```typescript
const now = new Date();
const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
  .toISOString().split('T')[0]; // YYYY-MM-DD

if (campaign.application_start_date <= koreaDate) {
  // 광고주 수정 불가
  return c.json({ 
    error: '신청 시작일 이후에는 캠페인을 수정할 수 없습니다. 관리자에게 문의해주세요.' 
  }, 403);
}
```

### 2️⃣ 모집 중 또는 진행 중 (광고주만)

```typescript
if (campaign.status === 'approved' || campaign.status === 'suspended') {
  // 광고주 수정 불가
  return c.json({ 
    error: '모집 중이거나 진행 중인 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.' 
  }, 403);
}
```

### 3️⃣ 완료 또는 취소됨 (모두)

```typescript
if (campaign.status === 'completed' || campaign.status === 'cancelled') {
  // 관리자도 수정 불가
  return c.json({ 
    error: '완료되었거나 취소된 캠페인은 수정할 수 없습니다.' 
  }, 403);
}
```

### 4️⃣ 소유권 없음

```typescript
if (user.role !== 'admin' && campaign.advertiser_id !== user.userId) {
  // 자신의 캠페인만 수정 가능
  return c.json({ 
    error: '권한이 없습니다' 
  }, 403);
}
```

---

## 💻 API 구현

### PUT /api/campaigns/:id

```typescript
// src/routes/campaigns.ts
campaigns.put('/:id', authMiddleware, async (c) => {
  const campaignId = c.req.param('id');
  const user = c.get('user');
  const { env } = c;
  
  // 1. 캠페인 정보 조회
  const campaign = await env.DB.prepare(
    'SELECT advertiser_id, status, application_start_date, thumbnail_image FROM campaigns WHERE id = ?'
  ).bind(campaignId).first();
  
  if (!campaign) {
    return c.json({ error: '캠페인을 찾을 수 없습니다' }, 404);
  }
  
  // 2. 소유권 체크
  if (user.role !== 'admin' && campaign.advertiser_id !== user.userId) {
    return c.json({ error: '권한이 없습니다' }, 403);
  }
  
  // 3. 광고주 권한 제약
  if (user.role !== 'admin') {
    // 3-1. 상태 체크
    if (campaign.status === 'recruiting' || 
        campaign.status === 'in_progress' || 
        campaign.status === 'suspended') {
      return c.json({ 
        error: '모집 중이거나 진행 중인 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.' 
      }, 403);
    }
    
    // 3-2. 신청 시작일 체크
    const now = new Date();
    const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    if (campaign.application_start_date && 
        campaign.application_start_date < koreaDate) {
      return c.json({ 
        error: '신청 시작일 이후에는 캠페인을 수정할 수 없습니다. 관리자에게 문의해주세요.' 
      }, 403);
    }
  }
  
  // 4. 관리자도 완료/취소된 캠페인은 수정 불가
  if (campaign.status === 'completed' || campaign.status === 'cancelled') {
    return c.json({ 
      error: '완료되었거나 취소된 캠페인은 수정할 수 없습니다.' 
    }, 403);
  }
  
  // 5. 데이터 수정 진행
  const data = await c.req.json();
  
  // ... 수정 로직
  
  return c.json({ success: true, message: '캠페인이 수정되었습니다' });
});
```

---

## 🎨 UI 처리 가이드

### 수정 버튼 표시 조건

```javascript
// public/static/js/app.js

function canEditCampaign(campaign, currentUser) {
  // 1. 완료/취소된 캠페인은 수정 불가
  if (campaign.status === 'completed' || campaign.status === 'cancelled') {
    return false;
  }
  
  // 2. 관리자는 모든 캠페인 수정 가능
  if (currentUser.role === 'admin') {
    return true;
  }
  
  // 3. 소유권 체크
  if (campaign.advertiser_id !== currentUser.userId) {
    return false;
  }
  
  // 4. 광고주 제약 조건
  // 4-1. 모집 중/진행 중/일시 중지 상태면 수정 불가
  if (campaign.status === 'approved' || campaign.status === 'suspended') {
    return false;
  }
  
  // 4-2. 신청 시작일 이후면 수정 불가
  const now = new Date();
  const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    .toISOString().split('T')[0];
  
  if (campaign.application_start_date && 
      campaign.application_start_date < koreaDate) {
    return false;
  }
  
  // 5. 승인 대기 상태 + 신청 시작일 이전 → 수정 가능
  return campaign.status === 'pending';
}
```

### UI 표시 예시

```javascript
// 캠페인 목록에서 수정 버튼 표시
campaignsHtml += `
  <div class="flex gap-2">
    ${canEditCampaign(campaign, this.user) ? `
      <button onclick="app.showEditCampaign(${campaign.id})" 
        class="text-blue-600 hover:text-blue-800">
        <i class="fas fa-edit"></i> 수정
      </button>
    ` : `
      <span class="text-gray-400" title="수정 불가">
        <i class="fas fa-lock"></i> 수정 불가
      </span>
    `}
  </div>
`;
```

### 수정 불가 시 안내 메시지

```javascript
function getEditBlockReason(campaign, currentUser) {
  if (campaign.status === 'completed') {
    return '완료된 캠페인은 수정할 수 없습니다.';
  }
  
  if (campaign.status === 'cancelled') {
    return '취소된 캠페인은 수정할 수 없습니다.';
  }
  
  if (currentUser.role !== 'admin') {
    if (campaign.status === 'approved') {
      return '모집 중인 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.';
    }
    
    if (campaign.status === 'suspended') {
      return '일시 중지된 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.';
    }
    
    const now = new Date();
    const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    if (campaign.application_start_date < koreaDate) {
      return '신청 시작일 이후에는 수정할 수 없습니다. 관리자에게 문의해주세요.';
    }
  }
  
  return '';
}
```

---

## 📝 요약

### 광고주 수정 가능 조건
```
status === 'pending' 
AND 
application_start_date > 오늘
```

### 관리자 수정 가능 조건
```
status IN ('pending', 'approved', 'suspended')
```

### 모두 수정 불가 조건
```
status === 'completed'
OR
status === 'cancelled'
```

### 핵심 규칙
1. **신청 시작일 이전**: 광고주 자유롭게 수정 가능
2. **신청 시작일 이후**: 광고주 수정 불가, 관리자만 가능
3. **모집 중/진행 중**: 광고주 수정 불가, 관리자만 신중히 수정
4. **완료/취소**: 아무도 수정 불가 (기록 보존)

---

**작성일**: 2026-02-26  
**버전**: 1.0  
**참조 파일**: 
- `src/routes/campaigns.ts` (line 429-468)
- `migrations/0001_initial_schema.sql` (line 74)
