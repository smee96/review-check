# 배포 정보

## 🚀 새 프로젝트: checknreviews-v1

### 📍 배포 URL
- **프로젝트 이름**: `checknreviews-v1`
- **Production URL**: https://checknreviews-v1.pages.dev
- **첫 배포 URL**: https://1b4613ef.checknreviews-v1.pages.dev

### 📊 데이터베이스 및 스토리지
기존 `review-spheres-v1` 프로젝트와 동일한 리소스를 공유합니다:

- **D1 Database**: `review-spheres-v1-production`
  - Database ID: `907a208c-c1cb-4ca4-a5d7-73d7731f11b9`
  - Binding: `DB`

- **R2 Bucket**: `reviewsphere-images`
  - Binding: `R2`

### ⚙️ 환경 변수 설정

✅ **완료**: Cloudflare Dashboard에서 환경 변수 설정 완료

- **RESEND_API_KEY**: `re_2cRyJY5y_KqMiHQU97Nw5wi4ebFX5aMKD`
  - 이름: `checknreview`
  - 용도: 이메일 발송 (비밀번호 재설정, 알림 등)
  - 설정 완료: ✅ Production 환경

로컬 개발 환경:
- `.dev.vars` 파일에도 동일한 키 저장됨
- `.gitignore`에 포함되어 있어 Git에 커밋되지 않음

### 🔄 기존 프로젝트와의 관계

- **기존**: `review-spheres-v1` (https://review-spheres-v1.pages.dev)
- **신규**: `checknreviews-v1` (https://checknreviews-v1.pages.dev)

두 프로젝트는 **동일한 데이터베이스와 스토리지를 공유**하므로:
- ✅ 사용자 데이터 공유
- ✅ 캠페인 데이터 공유
- ✅ 이미지 파일 공유
- ✅ 설정 정보 공유

### 📝 배포 명령어

```bash
# 빌드 및 배포
npm run deploy

# 또는 수동으로
npm run build
npx wrangler pages deploy dist --project-name checknreviews-v1
```

### 🌐 커스텀 도메인 설정 (선택사항)

```bash
# 커스텀 도메인 추가
npx wrangler pages domain add YOUR_DOMAIN.com --project-name checknreviews-v1
```

### 📅 배포 날짜
- **생성일**: 2025-02-19
- **목적**: 많은 수정을 위한 새로운 배포 버전

---

## 이전 프로젝트 정보

### review-spheres-v1 (기존)
- **Production URL**: https://reviews-sphere.com (커스텀 도메인)
- **Pages URL**: https://review-spheres-v1.pages.dev
- **용도**: 프로덕션 운영 중
- **상태**: 활성화

이 프로젝트는 계속 운영되며, `checknreviews-v1`은 테스트 및 개발용으로 사용됩니다.
