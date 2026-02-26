# 환경 변수 설정 가이드

## 📋 필수 환경 변수

### 1. reCAPTCHA (회원가입 보안)
```
RECAPTCHA_SITE_KEY=6Ldt3nUsAAAAAPAG3UYPPLEQO6LHdA_f-rOf8fs8
RECAPTCHA_SECRET_KEY=6Ldt3nUsAAAAANQDPi3Yy_CAYeinwiKP3I9LauKa
```

### 2. 이메일 발송 (1:1 문의)
```
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
TO_EMAIL=support@yourdomain.com
```

### 3. Cloudflare Pages 설정
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

---

## 🔧 로컬 개발 환경 설정

### .dev.vars 파일 생성
```bash
# .dev.vars 파일 생성 (로컬 개발용)
cat > .dev.vars << 'EOF'
RECAPTCHA_SITE_KEY=6Ldt3nUsAAAAAPAG3UYPPLEQO6LHdA_f-rOf8fs8
RECAPTCHA_SECRET_KEY=6Ldt3nUsAAAAANQDPi3Yy_CAYeinwiKP3I9LauKa
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
TO_EMAIL=support@yourdomain.com
EOF
```

**주의**: `.dev.vars` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

---

## 🚀 프로덕션 환경 설정

### Cloudflare Pages에서 환경 변수 설정
```bash
# wrangler를 사용한 시크릿 설정
npx wrangler pages secret put RECAPTCHA_SECRET_KEY --project-name checknreviews-v1
npx wrangler pages secret put RESEND_API_KEY --project-name checknreviews-v1
```

또는 Cloudflare Dashboard에서 설정:
```
1. Cloudflare Dashboard 접속
2. Pages → checknreviews-v1 프로젝트 선택
3. Settings → Environment variables
4. 각 환경 변수 추가:
   - RECAPTCHA_SECRET_KEY
   - RESEND_API_KEY
   - FROM_EMAIL
   - TO_EMAIL
```

---

## 🗄️ 데이터베이스 설정

### Cloudflare D1 (프로덕션)
```bash
# D1 데이터베이스 생성
npx wrangler d1 create checknreviews-v1-production

# 출력된 database_id를 wrangler.jsonc에 추가
# wrangler.jsonc:
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "checknreviews-v1-production",
      "database_id": "여기에-database-id-입력"
    }
  ]
}

# 마이그레이션 적용
npx wrangler d1 migrations apply checknreviews-v1-production
```

### 로컬 개발
```bash
# 로컬 D1 데이터베이스 사용
npx wrangler d1 migrations apply checknreviews-v1-production --local

# 로컬 개발 서버 실행 (--local 플래그)
npm run dev
```

---

## 🔐 관리자 계정 생성

### 초기 관리자 계정 생성 방법

#### 방법 1: SQL 직접 실행
```bash
# 로컬 데이터베이스에 관리자 추가
npx wrangler d1 execute checknreviews-v1-production --local --command="
INSERT INTO users (email, nickname, password_hash, role, sphere_points, created_at)
VALUES (
  'admin@checknreview.com',
  '관리자',
  '\$2a\$10\$hashedPasswordHere',
  'admin',
  0,
  datetime('now')
);
"

# 프로덕션 데이터베이스에 관리자 추가
npx wrangler d1 execute checknreviews-v1-production --command="..."
```

#### 방법 2: 회원가입 후 수동으로 role 변경
```bash
# 1. 웹사이트에서 일반 회원가입
# 2. 데이터베이스에서 role 변경
npx wrangler d1 execute checknreviews-v1-production --local --command="
UPDATE users SET role = 'admin' WHERE email = 'your_email@example.com';
"
```

---

## 📊 시스템 설정 초기값

### system_settings 테이블 초기 데이터
```sql
INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES
('points_fee_rate', '30', datetime('now')),
('fixed_fee_points_only', '10000', datetime('now')),
('fixed_fee_purchase_with_points', '10000', datetime('now')),
('fixed_fee_product_only', '10000', datetime('now')),
('fixed_fee_product_with_points', '10000', datetime('now')),
('fixed_fee_voucher_only', '10000', datetime('now')),
('fixed_fee_voucher_with_points', '10000', datetime('now')),
('min_withdrawal_amount', '10000', datetime('now')),
('max_withdrawal_amount', '1000000', datetime('now')),
('point_to_krw_rate', '1', datetime('now'));
```

---

## 🧪 테스트 데이터

### 테스트 사용자 생성
```sql
-- 테스트 광고주
INSERT INTO users (email, nickname, password_hash, role, sphere_points, created_at)
VALUES ('advertiser@test.com', '테스트광고주', '$2a$10$...', 'advertiser', 0, datetime('now'));

-- 테스트 인플루언서
INSERT INTO users (email, nickname, password_hash, role, sphere_points, created_at)
VALUES ('influencer@test.com', '테스트인플루언서', '$2a$10$...', 'influencer', 50000, datetime('now'));
```

---

## 🌐 API 엔드포인트

### 로컬 개발
```
http://localhost:3000
```

### 프로덕션
```
https://fa737302.checknreviews-v1.pages.dev
```

또는 커스텀 도메인 설정 가능

---

## 📝 참고사항

### 비밀번호 해싱
- 알고리즘: bcrypt
- Salt rounds: 10
- 예시 코드:
```typescript
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash('password123', 10);
```

### 세션 관리
- Session-based authentication
- 쿠키 이름: `session`
- 만료 시간: 7일

### CORS 설정
- `/api/*` 경로에 CORS 적용
- 프로덕션에서는 특정 도메인만 허용하도록 설정 권장
