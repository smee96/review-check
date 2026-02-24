# 테스트 인플루언서 지원 데이터 생성 가이드

## API 엔드포인트
```
POST /api/admin/seed-applications
```

## 실행 방법

### 1. 브라우저 콘솔에서 실행 (추천)

관리자 계정으로 로그인한 상태에서 브라우저 콘솔(F12)에 다음 코드를 입력하세요:

```javascript
// 테스트 지원 데이터 생성
async function seedApplications() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('https://reviews-sphere.com/api/admin/seed-applications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('결과:', result);
    alert(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('에러:', error);
    alert('에러 발생: ' + error.message);
  }
}

// 실행
seedApplications();
```

### 2. curl 명령어로 실행

관리자 토큰을 알고 있다면 터미널에서:

```bash
curl -X POST https://reviews-sphere.com/api/admin/seed-applications \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## 동작 방식

1. **테스트 인플루언서 조회**: `influencer%@test.com` 패턴의 이메일을 가진 인플루언서 계정 조회
2. **대상 캠페인 선택**: `recruiting` 또는 `in_progress` 상태의 캠페인 조회
3. **기존 데이터 삭제**: 테스트 인플루언서의 기존 지원 데이터 삭제 (중복 방지)
4. **지원 데이터 생성**: 각 캠페인에 대해 모집인원의 1.5배(최소 모집인원+5명)만큼 지원 데이터 생성

## 예상 결과

```json
{
  "success": true,
  "message": "120개의 테스트 지원 데이터가 생성되었습니다",
  "campaigns": 8,
  "influencers": 50
}
```

## 주의사항

- 관리자 권한이 필요합니다
- 기존 테스트 인플루언서의 모든 지원 데이터가 삭제됩니다
- 실제 사용자의 지원 데이터는 영향을 받지 않습니다
