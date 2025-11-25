# SEO 설정 가이드 - 리뷰스피어

## 📊 구현된 SEO 최적화

### ✅ 완료된 항목

#### 1. 메타 태그 최적화
- **Title**: "리뷰스피어 - 인플루언서 리뷰 마케팅 플랫폼 | 블로그 리뷰, 인스타그램 리뷰, 유튜브 리뷰"
- **Description**: 190자 상세 설명
- **Keywords**: 40개 이상의 관련 키워드 포함

**주요 키워드:**
- 리뷰스피어, 리뷰플랫폼, 인플루언서리뷰
- 블로그리뷰, 인스타그램리뷰, 유튜브리뷰
- 체험단, 리뷰마케팅, 인플루언서마케팅
- 광고주플랫폼, 인플루언서플랫폼, 협찬
- 초보인플루언서, 팔로워적어도가능

#### 2. Open Graph 태그 (소셜 미디어)
- Facebook, Kakao, LinkedIn 등에서 링크 공유 시 최적화
- 이미지, 제목, 설명 자동 표시

#### 3. Twitter Card
- Twitter에서 링크 공유 시 카드 형태로 표시

#### 4. Structured Data (JSON-LD)
- Google 검색 결과에서 리치 스니펫 표시
- WebSite 스키마
- Organization 스키마

#### 5. robots.txt
- 검색 엔진 크롤러 가이드
- `/api/` 경로 차단 (보안)
- 정적 파일 허용

#### 6. sitemap.xml
- 사이트 구조 맵
- 홈페이지, 로그인, 회원가입 페이지 포함
- 우선순위 및 업데이트 빈도 설정

---

## 🔍 검색 엔진 등록 (필수)

### 1️⃣ Google Search Console 등록

**단계:**
1. https://search.google.com/search-console 접속
2. "속성 추가" 클릭
3. URL 입력: `https://reviews-sphere.com`
4. 소유권 확인:
   
   **방법 A: HTML 파일 업로드**
   ```bash
   # Google에서 제공하는 인증 파일 다운로드
   # 예: google1234567890abcdef.html
   
   # public/ 폴더에 업로드
   /home/user/webapp/public/google1234567890abcdef.html
   ```
   
   **방법 B: 메타 태그 (이미 준비됨)**
   - Google에서 제공하는 메타 태그를 index.ts의 `<head>` 섹션에 추가
   
5. Sitemap 제출:
   - URL: `https://reviews-sphere.com/sitemap.xml`

---

### 2️⃣ Naver Search Advisor 등록

**단계:**
1. https://searchadvisor.naver.com 접속
2. "웹마스터 도구" → "사이트 등록"
3. URL 입력: `https://reviews-sphere.com`
4. 소유권 확인:
   
   **방법 A: HTML 파일 업로드**
   ```bash
   # Naver에서 제공하는 인증 파일 다운로드
   # 예: naver1234567890abcdef.html
   
   # public/ 폴더에 업로드
   /home/user/webapp/public/naver1234567890abcdef.html
   ```
   
   **방법 B: 메타 태그**
   - Naver에서 제공하는 메타 태그를 index.ts의 `<head>` 섹션에 추가

5. Sitemap 제출:
   - URL: `https://reviews-sphere.com/sitemap.xml`

---

### 3️⃣ Bing Webmaster Tools 등록 (선택)

**단계:**
1. https://www.bing.com/webmasters 접속
2. 사이트 추가
3. Google Search Console과 연동 가능 (간편)

---

## 📈 SEO 개선 추가 작업 (권장)

### 1. 블로그/뉴스 섹션 추가
```
- 리뷰 마케팅 노하우
- 인플루언서 성공 사례
- 캠페인 운영 팁
→ 검색 트래픽 증가 및 체류 시간 개선
```

### 2. FAQ 페이지
```
- 자주 묻는 질문
- Structured Data로 마크업
→ Google 검색 결과에 FAQ 리치 스니펫 표시
```

### 3. 백링크 구축
```
- 관련 블로그에 게스트 포스팅
- 마케팅 커뮤니티에 소개
- 보도자료 배포
→ 도메인 권위도(Domain Authority) 상승
```

### 4. 페이지 속도 최적화
```
- 이미지 최적화 (WebP 형식)
- CDN 활용 (Cloudflare 이미 사용 중 ✅)
- 코드 번들 최소화
→ Google Core Web Vitals 점수 향상
```

### 5. 모바일 최적화
```
- 반응형 디자인 (이미 적용됨 ✅)
- 터치 영역 충분히 확보
- 폰트 크기 적절히 설정
→ 모바일 검색 순위 향상
```

---

## 🎯 예상되는 검색 키워드

### 주요 검색어 (높은 우선순위)
- 리뷰스피어
- 리뷰 플랫폼
- 인플루언서 리뷰
- 블로그 리뷰 플랫폼
- 인스타그램 리뷰 플랫폼
- 유튜브 리뷰 플랫폼

### 롱테일 검색어 (중간 우선순위)
- 블로그 체험단
- 인스타 체험단
- 유튜버 협찬
- 리뷰 마케팅 플랫폼
- 인플루언서 마케팅 플랫폼
- 초보 인플루언서 플랫폼
- 팔로워 적어도 되는 체험단

### 브랜드 검색어
- R.SPHERE
- 리뷰스피어
- ReviewSphere

---

## 📅 SEO 체크리스트

- [x] 메타 태그 최적화
- [x] Open Graph 태그 추가
- [x] Twitter Card 추가
- [x] Structured Data (JSON-LD)
- [x] robots.txt 생성
- [x] sitemap.xml 생성
- [ ] Google Search Console 등록
- [ ] Naver Search Advisor 등록
- [ ] 블로그/뉴스 섹션 추가
- [ ] FAQ 페이지 추가
- [ ] 정기적인 콘텐츠 업데이트

---

## 🚀 다음 단계

1. **Google Search Console 등록** (우선순위 1)
2. **Naver Search Advisor 등록** (우선순위 2)
3. **정기적인 콘텐츠 발행** (블로그, 뉴스)
4. **소셜 미디어 연동** (Instagram, Facebook, Twitter)
5. **백링크 구축 시작**

---

**작성일**: 2025-11-24  
**버전**: v85  
**배포 URL**: https://reviews-sphere.com
