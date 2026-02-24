# 테스트 지원 데이터 생성 가이드

## 🎯 목적
모집중/진행중 캠페인에 테스트 인플루언서들의 지원 데이터를 자동으로 생성합니다.

## 📊 지원자 수
- **10명 모집** → 10~15명 지원 (랜덤)
- **20명 모집** → 20~30명 지원 (랜덤)
- **30명 모집** → 30~45명 지원 (랜덤)

---

## 방법 1: 브라우저 콘솔 사용 (가장 간단)

1. **https://reviews-sphere.com 접속 및 관리자 로그인**

2. **F12 키**를 눌러 개발자 도구를 엽니다

3. **Console 탭** 클릭

4. 아래 코드를 **복사하여 붙여넣고 Enter**:

```javascript
(async function() {
    try {
        // 로컬 스토리지에서 토큰 가져오기
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('❌ 로그인이 필요합니다');
            return;
        }
        
        console.log('📊 테스트 지원 데이터 생성 중...');
        
        const response = await fetch('https://reviews-sphere.com/api/admin/seed-applications', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ 성공!');
            console.log('메시지:', result.message);
            console.log('캠페인 수:', result.campaigns);
            console.log('인플루언서 수:', result.influencers);
            alert(`✅ 성공!\n\n${result.message}\n캠페인 수: ${result.campaigns}개\n인플루언서 수: ${result.influencers}명`);
        } else {
            console.error('❌ 오류:', result.error);
            alert(`❌ 오류 발생\n\n${result.error}`);
        }
    } catch (error) {
        console.error('❌ 오류:', error);
        alert(`❌ 오류 발생\n\n${error.message}`);
    }
})();
```

5. 결과 확인!

---

## 방법 2: curl 명령어 사용 (터미널)

### Step 1: 로그인하여 토큰 받기
```bash
curl -X POST https://reviews-sphere.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_ADMIN_EMAIL","password":"YOUR_PASSWORD"}'
```

### Step 2: 받은 토큰으로 지원 데이터 생성
```bash
curl -X POST https://reviews-sphere.com/api/admin/seed-applications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 방법 3: 스크립트 파일 사용

터미널에서 실행:
```bash
/tmp/seed_applications.sh
```

관리자 이메일과 비밀번호를 입력하면 자동으로 실행됩니다.

---

## ⚠️ 주의사항

1. **관리자 권한 필요**: 관리자 계정으로 로그인해야 합니다
2. **기존 데이터 삭제**: 테스트 인플루언서의 기존 지원 데이터는 모두 삭제됩니다
3. **실제 사용자 보호**: `influencer%@test.com` 형태의 계정만 영향을 받습니다

---

## 📝 결과 확인

지원 데이터 생성 후:
1. 관리자 > 캠페인 관리 페이지 접속
2. 각 캠페인의 지원자 수 확인
3. 모집인원보다 많은 지원자가 생성되었는지 확인

---

## 🐛 문제 해결

### "로그인이 필요합니다"
→ 관리자 계정으로 로그인하세요

### "테스트 인플루언서가 없습니다"
→ `influencer%@test.com` 형태의 계정이 DB에 없습니다

### "모집중이거나 진행중인 캠페인이 없습니다"
→ 캠페인 상태를 `recruiting` 또는 `in_progress`로 변경하세요

---

## ✅ API 정보

- **Endpoint**: `POST /api/admin/seed-applications`
- **권한**: Admin only
- **Request Body**: 없음
- **Response**:
  ```json
  {
    "success": true,
    "message": "123개의 테스트 지원 데이터가 생성되었습니다",
    "campaigns": 10,
    "influencers": 50
  }
  ```
