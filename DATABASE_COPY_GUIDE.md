# 데이터베이스 복사 가이드

## ✅ 새 데이터베이스 생성 완료

### 📊 새 데이터베이스 정보
- **이름**: `checknreviews-v1-production`
- **Database ID**: `c49d8889-d159-4473-bb01-8ad820e1dd1a`
- **리전**: ENAM (유럽/북미)
- **스키마**: ✅ 26개 마이그레이션 완료

### 🔄 데이터 복사 방법

D1 데이터베이스 간 직접 복사는 공식적으로 지원되지 않지만, 다음 방법으로 데이터를 복사할 수 있습니다:

#### 방법 1: SQL 덤프 및 복원 (추천)

**1단계: 기존 DB에서 데이터 덤프**
```bash
# 각 테이블별로 데이터 추출
npx wrangler d1 execute review-spheres-v1-production --remote --command="SELECT * FROM users"
npx wrangler d1 execute review-spheres-v1-production --remote --command="SELECT * FROM campaigns"
# ... 다른 테이블들도 반복
```

**2단계: SQL INSERT 문 생성**
Wrangler에서 직접 덤프 기능이 제한적이므로, 웹 앱을 통해 데이터를 추출하는 것이 더 효율적입니다.

#### 방법 2: API를 통한 데이터 마이그레이션 (추천)

관리자 API를 만들어서 기존 DB에서 데이터를 읽고 새 DB로 복사:

```typescript
// src/routes/admin.ts에 추가
admin.post('/migrate-database', async (c) => {
  // 1. 기존 DB 연결 (환경 변수로 설정)
  // 2. 데이터 읽기
  // 3. 새 DB에 삽입
  // 4. 진행 상황 반환
});
```

#### 방법 3: 수동 시드 스크립트 (가장 간단)

테스트 데이터를 생성하는 시드 스크립트를 실행:

```bash
# seed_production_data.sql 실행
npx wrangler d1 execute checknreviews-v1-production --remote --file=./seed_production_data.sql
```

### 🚀 현재 상태

- ✅ 새 데이터베이스 생성 완료
- ✅ 스키마 마이그레이션 완료
- ⏳ 데이터 복사 대기 중

### 📝 권장 사항

**개발/테스트 환경**이므로 실제 프로덕션 데이터를 복사하기보다는:

1. **테스트 데이터 생성**: 시드 스크립트로 테스트 사용자, 캠페인 생성
2. **독립적인 개발**: 새 데이터베이스에서 자유롭게 수정 및 테스트
3. **필요시 복사**: 특정 데이터만 선택적으로 복사

### 💡 테스트 데이터 생성

```bash
# 기본 테스트 데이터 생성
npx wrangler d1 execute checknreviews-v1-production --remote --file=./seed_production_data.sql

# 추가 테스트 지원 데이터 생성
# 브라우저 콘솔에서 seed-applications API 호출
```

### 🔗 데이터베이스 바인딩

`wrangler.jsonc`가 이미 업데이트되었으므로, 다음 배포부터는 자동으로 새 데이터베이스를 사용합니다:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "checknreviews-v1-production",
    "database_id": "c49d8889-d159-4473-bb01-8ad820e1dd1a"
  }
]
```

### ✨ 다음 단계

1. `npm run deploy` - 새 DB로 배포
2. 테스트 데이터 생성
3. 기능 테스트 및 수정
4. 필요시 프로덕션 데이터 선택적 복사

---

## 📋 두 데이터베이스 비교

| 항목 | review-spheres-v1 | checknreviews-v1 |
|------|-------------------|------------------|
| Database ID | 907a208c-c1cb-4ca4-a5d7-73d7731f11b9 | c49d8889-d159-4473-bb01-8ad820e1dd1a |
| 용도 | 프로덕션 운영 | 개발/테스트 |
| 데이터 | 실제 사용자 데이터 | 빈 스키마 (테스트 데이터 추가 예정) |
| 프로젝트 | review-spheres-v1 | checknreviews-v1 |

완전히 독립적인 두 개의 데이터베이스입니다!
