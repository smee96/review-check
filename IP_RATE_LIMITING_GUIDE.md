# 🚦 IP 기반 회원가입 속도 제한 가이드

## 📋 목차
1. [개요](#개요)
2. [작동 방식](#작동-방식)
3. [장단점](#장단점)
4. [설정 변경 방법](#설정-변경-방법)
5. [완전 제거 방법](#완전-제거-방법)

---

## 🎯 개요

### 현재 적용된 제한
```
동일 IP 주소에서 24시간 내 1회만 회원가입 가능
```

### 목적
- **스팸 방지**: 봇이나 자동화 스크립트를 통한 대량 계정 생성 차단
- **다중 계정 방지**: 같은 사람이 여러 계정을 만드는 것을 제한
- **서버 부하 감소**: 무분별한 회원가입 요청으로 인한 DB 부하 감소

---

## ⚙️ 작동 방식

### 1. IP 주소 수집
```typescript
// src/routes/auth.ts (line 76)
const clientIP = c.req.header('CF-Connecting-IP') || 
                 c.req.header('X-Forwarded-For') || 
                 'unknown';
```

**Cloudflare가 제공하는 실제 클라이언트 IP 사용**:
- `CF-Connecting-IP`: Cloudflare가 감지한 실제 클라이언트 IP
- `X-Forwarded-For`: 프록시를 거친 경우 원본 IP
- `unknown`: IP를 알 수 없는 경우 (거의 발생 안 함)

### 2. 최근 가입 확인
```typescript
// src/routes/auth.ts (line 79-81)
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const recentSignup = await env.DB.prepare(
  'SELECT id FROM users WHERE created_at > ? AND id IN (SELECT user_id FROM user_ips WHERE ip_address = ?)'
).bind(oneDayAgo, clientIP).first();
```

**쿼리 설명**:
- `created_at > ?`: 24시간 이내 생성된 사용자만 조회
- `ip_address = ?`: 동일한 IP 주소로 가입한 사용자
- 매칭되는 사용자가 있으면 → **가입 차단**

### 3. 제한 적용
```typescript
// src/routes/auth.ts (line 83-85)
if (recentSignup) {
  return c.json({ 
    error: '하루에 한 번만 가입할 수 있습니다. 24시간 후 다시 시도해주세요.' 
  }, 429);
}
```

**HTTP 429 Too Many Requests** 상태 코드 반환

### 4. IP 저장
```typescript
// src/routes/auth.ts (line 118-120)
await env.DB.prepare(
  'INSERT INTO user_ips (user_id, ip_address, created_at) VALUES (?, ?, ?)'
).bind(userId, clientIP, getCurrentDateTime()).run();
```

**회원가입 성공 후**:
- `user_ips` 테이블에 (사용자 ID, IP 주소, 생성 시간) 저장
- 다음 가입 시 이 데이터로 제한 체크

---

## 📊 user_ips 테이블 구조

```sql
CREATE TABLE user_ips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,           -- 사용자 ID
  ip_address TEXT NOT NULL,           -- IP 주소 (예: 123.45.67.89)
  created_at DATETIME NOT NULL,       -- 가입 시간
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 예시 데이터
| id | user_id | ip_address | created_at |
|----|---------|------------|------------|
| 1 | 111 | 123.45.67.89 | 2026-02-26 09:10:00 |
| 2 | 112 | 98.76.54.32 | 2026-02-26 10:30:00 |

---

## ⚖️ 장단점

### ✅ 장점

1. **스팸 방지**
   - 봇이 자동으로 수백 개의 계정을 만드는 것을 차단
   - 악의적인 사용자의 대량 계정 생성 방지

2. **서버 부하 감소**
   - 무분별한 회원가입 요청 차단
   - DB 쓰기 연산 감소

3. **간단한 구현**
   - IP 주소만 확인하면 되므로 구현이 단순
   - 추가 인증 절차 불필요

### ❌ 단점

1. **정상 사용자 불편**
   - **공용 IP 문제**: 같은 Wi-Fi를 사용하는 가족/회사 동료들이 동시에 가입 불가
   - **카페/도서관**: 공용 네트워크에서 누군가 가입하면 다른 사람들도 24시간 차단
   - **모바일 데이터**: 이동통신사의 공용 IP 사용 시 다른 사람이 먼저 가입하면 차단

2. **우회 가능**
   - VPN/프록시 사용하면 IP 변경 가능
   - 모바일 데이터 ↔ Wi-Fi 전환으로 IP 변경

3. **동적 IP 환경**
   - 가정용 인터넷은 보통 동적 IP (재부팅 시 IP 변경)
   - 악의적 사용자는 쉽게 우회 가능

---

## 🛠️ 설정 변경 방법

### Option 1: 제한 시간 변경

**24시간 → 1시간으로 단축**:
```typescript
// src/routes/auth.ts (line 77)
// Before
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

// After
const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
```

**24시간 → 1주일로 연장**:
```typescript
const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
```

### Option 2: 동일 IP에서 2회 허용

```typescript
// src/routes/auth.ts (line 79-81)
// Before: 1회 이상이면 차단
const recentSignup = await env.DB.prepare(
  'SELECT id FROM users WHERE created_at > ? AND id IN (SELECT user_id FROM user_ips WHERE ip_address = ?)'
).bind(oneDayAgo, clientIP).first();

// After: 2회 이상이면 차단
const recentSignupCount = await env.DB.prepare(
  'SELECT COUNT(*) as count FROM users WHERE created_at > ? AND id IN (SELECT user_id FROM user_ips WHERE ip_address = ?)'
).bind(oneDayAgo, clientIP).first();

if (recentSignupCount && recentSignupCount.count >= 2) {
  return c.json({ 
    error: '하루에 최대 2번까지 가입할 수 있습니다. 24시간 후 다시 시도해주세요.' 
  }, 429);
}
```

### Option 3: 관리자 계정은 제한 제외

```typescript
// src/routes/auth.ts (line 75-85)
// IP 속도 제한 (관리자 제외)
if (role !== 'admin') {
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const recentSignup = await env.DB.prepare(
    'SELECT id FROM users WHERE created_at > ? AND id IN (SELECT user_id FROM user_ips WHERE ip_address = ?)'
  ).bind(oneDayAgo, clientIP).first();
  
  if (recentSignup) {
    return c.json({ error: '하루에 한 번만 가입할 수 있습니다. 24시간 후 다시 시도해주세요.' }, 429);
  }
}
```

---

## 🗑️ 완전 제거 방법

IP 기반 속도 제한을 완전히 제거하려면:

### Step 1: auth.ts에서 코드 제거

```typescript
// src/routes/auth.ts
auth.post('/register', async (c) => {
  try {
    const { email, nickname, password, role, recaptchaToken } = await c.req.json<RegisterRequest>();
    
    // ... 기본 검증 코드
    
    const { env } = c;
    
    // ❌ 이 부분 전체 삭제 (line 75-85)
    /*
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentSignup = await env.DB.prepare(
      'SELECT id FROM users WHERE created_at > ? AND id IN (SELECT user_id FROM user_ips WHERE ip_address = ?)'
    ).bind(oneDayAgo, clientIP).first();
    
    if (recentSignup) {
      return c.json({ error: '하루에 한 번만 가입할 수 있습니다. 24시간 후 다시 시도해주세요.' }, 429);
    }
    */
    
    // Check if email already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    // ... 나머지 코드
    
    // ❌ IP 저장 코드도 삭제 (line 107-120)
    /*
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_ips (...)
    `).run();
    
    await env.DB.prepare(
      'INSERT INTO user_ips (user_id, ip_address, created_at) VALUES (?, ?, ?)'
    ).bind(userId, clientIP, getCurrentDateTime()).run();
    */
    
    // ... 나머지 코드
  }
});
```

### Step 2: 빌드 및 배포

```bash
cd /home/user/webapp
npm run build
npm run deploy
```

### Step 3: user_ips 테이블은 남겨두기 (선택)

**옵션 A**: 테이블 유지 (나중에 다시 활성화 가능)
```sql
-- 아무것도 안 함
```

**옵션 B**: 테이블 삭제 (완전 제거)
```sql
DROP TABLE IF EXISTS user_ips;
```

---

## 🎯 권장사항

### 추천: IP 제한 유지 + reCAPTCHA 강화

**현재 상태**:
- ✅ IP 제한: 24시간 내 1회
- ✅ reCAPTCHA v3: 점수 0.5 이상
- ✅ 이메일 도메인 검증: 스팸 도메인 차단

**이 조합이 가장 효과적**:
1. 대부분의 스팸/봇 차단 (reCAPTCHA)
2. 악의적인 대량 가입 방지 (IP 제한)
3. 정상 사용자는 거의 영향 없음 (공용 IP 문제는 드물게 발생)

### 문제 발생 시 대응

**상황**: "우리 회사에서 여러 직원이 가입하려는데 안 됩니다"

**해결책 1**: 임시로 해당 IP의 user_ips 레코드 삭제
```sql
DELETE FROM user_ips WHERE ip_address = '123.45.67.89';
```

**해결책 2**: 시간 제한을 1시간으로 단축
```typescript
const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
```

**해결책 3**: 동일 IP에서 3~5회까지 허용
```typescript
if (recentSignupCount && recentSignupCount.count >= 3) { ... }
```

---

## 📊 현재 상황 확인

### user_ips 테이블 조회
```bash
npx wrangler d1 execute checknreviews-v1-production --remote \
  --command="SELECT * FROM user_ips ORDER BY created_at DESC LIMIT 10"
```

### 특정 IP의 가입 횟수 확인
```bash
npx wrangler d1 execute checknreviews-v1-production --remote \
  --command="SELECT COUNT(*) as count FROM user_ips WHERE ip_address = '123.45.67.89'"
```

### 24시간 내 가입 현황
```bash
npx wrangler d1 execute checknreviews-v1-production --remote \
  --command="SELECT ip_address, COUNT(*) as count FROM user_ips 
             WHERE created_at > datetime('now', '-24 hours') 
             GROUP BY ip_address 
             ORDER BY count DESC"
```

---

## 🔐 대안: 이메일 인증으로 대체

IP 제한이 너무 불편하다면, **이메일 인증**으로 대체 추천:

1. 회원가입 시 인증 메일 발송
2. 이메일 링크 클릭해야 계정 활성화
3. IP 제한 없이도 스팸 방지 가능

**장점**:
- 공용 IP 문제 없음
- 실제 이메일 소유자만 가입 가능
- 더 강력한 인증

**단점**:
- 이메일 발송 서비스 필요 (SendGrid, Mailgun 등)
- 구현 복잡도 증가

---

**작성일**: 2026-02-26  
**버전**: 1.0  
**관련 파일**: `src/routes/auth.ts`
