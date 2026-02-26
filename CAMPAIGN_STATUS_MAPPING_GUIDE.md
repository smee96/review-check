# 캠페인 상태 매핑 가이드

## 문제 요약

프론트엔드는 `recruiting`, `in_progress` 같은 가상 상태를 사용하지만,  
데이터베이스는 실제로 `pending`, `approved`, `suspended`, `completed`, `cancelled`만 저장합니다.

**백엔드 API는 이 매핑을 정확하게 처리해야 합니다.**

---

## DB 스키마 상태값

```sql
CHECK(status IN ('pending', 'approved', 'suspended', 'completed', 'cancelled'))
```

- **pending**: 대기 (관리자 승인 대기 중)
- **approved**: 승인됨 (신청 가능한 상태)
- **suspended**: 일시 중지
- **completed**: 완료
- **cancelled**: 취소

---

## 프론트엔드 가상 상태

- **recruiting**: 모집 중 (= `approved` + 신청기간 내)
- **in_progress**: 진행 중 (= `approved` + 신청기간 종료 후)

프론트엔드는 `approved` 상태와 날짜를 보고 `recruiting` 또는 `in_progress`로 표시합니다.

---

## 수정한 오류들

### 1. ✅ 캠페인 신청 API (`POST /campaigns/:id/apply`)

**이전 코드** (오류):
```typescript
const campaign = await env.DB.prepare(
  'SELECT * FROM campaigns WHERE id = ? AND status = ?'
).bind(campaignId, 'recruiting').first();
```

**수정 후**:
```typescript
const campaign = await env.DB.prepare(
  'SELECT * FROM campaigns WHERE id = ? AND status = ?'
).bind(campaignId, 'approved').first();
```

**원인**: DB에는 `recruiting` 상태가 없어 쿼리가 항상 실패  
**결과**: "모집 중인 캠페인을 찾을 수 없습니다" 오류

---

### 2. ✅ 캠페인 상태 업데이트 API (`PUT /campaigns/:id/status`)

**수정 코드**:
```typescript
// 프론트엔드에서 보낸 상태를 DB 스키마에 맞게 변환
let dbStatus = status;
if (status === 'recruiting' || status === 'in_progress') {
  dbStatus = 'approved';
}

// 유효한 상태값 체크
const validStatuses = ['pending', 'approved', 'suspended', 'completed', 'cancelled'];
if (!validStatuses.includes(dbStatus)) {
  return c.json({ error: '유효하지 않은 상태입니다' }, 400);
}
```

**설명**: 프론트엔드가 `recruiting`이나 `in_progress`를 보내면 `approved`로 변환

---

### 3. ✅ 관리자 통계 API (`GET /admin/stats`)

**이전 코드** (오류):
```typescript
const activeCampaigns = await env.DB.prepare(
  `SELECT COUNT(*) as count FROM campaigns WHERE status = 'recruiting'`
).first();
```

**수정 후**:
```typescript
// 현재 모집 중인 캠페인 = approved 상태 + 신청기간 내
const currentDate = new Date();
const koreaDate = new Date(currentDate.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
const activeCampaigns = await env.DB.prepare(
  `SELECT COUNT(*) as count FROM campaigns 
   WHERE status = 'approved' 
   AND application_start_date <= ? 
   AND application_end_date >= ?`
).bind(koreaDate, koreaDate).first();
```

**설명**: `approved` + 날짜 범위로 모집 중인 캠페인 판별

---

### 4. ✅ 캠페인 수정 권한 체크 (`PUT /campaigns/:id`)

**수정 후**:
```typescript
// 광고주 권한 체크: pending 상태에서만 수정 가능
if (user.role !== 'admin') {
  const editBlockedStatuses = ['approved', 'suspended', 'completed', 'cancelled'];
  if (editBlockedStatuses.includes(campaign.status)) {
    const statusName = {
      'approved': '승인된',
      'suspended': '일시 중지된',
      'completed': '완료된',
      'cancelled': '취소된'
    }[campaign.status] || campaign.status;
    return c.json({ error: `${statusName} 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.` }, 403);
  }
}
```

**설명**: 관리자가 아닌 경우 `pending` 상태만 수정 가능

---

### 5. ✅ 프론트엔드 신청 버튼 표시 (`public/static/js/app.js`)

**이전 코드** (오류):
```javascript
${campaign.payment_status === 'paid' && (campaign.status === 'recruiting' || campaign.status === 'in_progress') ? `
  // 신청 버튼 표시
` : ''}
```

**수정 후**:
```javascript
${(campaign.status === 'recruiting' || campaign.status === 'in_progress' || campaign.status === 'approved') ? `
  // 신청 버튼 표시 (payment_status 체크 제거)
` : ''}
```

**설명**: 
- `payment_status` 체크 제거
- `approved` 상태도 포함하여 신청 가능

---

## 체크리스트

### ✅ 완료된 항목
- [x] 캠페인 신청 API 수정
- [x] 캠페인 상태 업데이트 API 매핑 추가
- [x] 관리자 통계 쿼리 수정
- [x] 캠페인 수정 권한 체크 명확화
- [x] 프론트엔드 신청 버튼 payment_status 체크 제거

### 🔍 확인 필요
- [ ] 캠페인 목록 API에서 프론트엔드용 가상 상태 반환
- [ ] 캠페인 상세 API에서 프론트엔드용 가상 상태 반환
- [ ] 대시보드 통계에서 상태별 분류 정확성

---

## 권장 사항

### 백엔드 처리
1. **DB 쿼리**: 항상 실제 DB 상태 사용 (`pending`, `approved`, `suspended`, `completed`, `cancelled`)
2. **프론트 입력**: `recruiting`/`in_progress` → `approved`로 변환
3. **응답 생성**: 필요시 날짜 기반으로 가상 상태 계산하여 반환

### 프론트엔드 처리
1. **상태 표시**: 백엔드 응답의 `status`와 날짜를 보고 UI 렌더링
2. **상태 전송**: `recruiting`/`in_progress`를 보내도 백엔드가 변환하므로 문제없음
3. **필터/검색**: 가상 상태가 아닌 실제 상태값 사용 권장

---

## 테스트 결과

### ✅ 신청 테스트
```bash
# 캠페인 6번 신청 성공
{"success":true,"message":"캠페인에 지원되었습니다"}
```

### ✅ 신청 버튼 표시
- 상태: `approved`
- 신청 기간: 2026-02-26 ~ 2026-03-06
- 결과: **지원하기 버튼 정상 표시**

---

## 작성일
2026-02-26

## 관련 파일
- `src/routes/campaigns.ts` - 캠페인 신청/수정 API
- `src/routes/admin.ts` - 관리자 통계 API
- `public/static/js/app.js` - 프론트엔드 UI 로직
- `migrations/0001_initial_schema.sql` - DB 스키마
