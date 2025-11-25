# 커스텀 도메인 설정 가이드 - reviews-sphere.com

## 🌐 Cloudflare Pages 커스텀 도메인 연결

### ✅ 도메인 정보
- **도메인**: `reviews-sphere.com`
- **Cloudflare Pages 프로젝트**: `review-spheres-v1`

---

## 📋 설정 단계

### 1️⃣ Cloudflare Pages에서 커스텀 도메인 추가

**단계:**
1. https://dash.cloudflare.com 로그인
2. **Workers & Pages** 선택
3. **review-spheres-v1** 프로젝트 클릭
4. **Custom domains** 탭 클릭
5. **Set up a custom domain** 버튼 클릭
6. 도메인 입력: `reviews-sphere.com`
7. **Continue** 클릭

---

### 2️⃣ DNS 레코드 설정

Cloudflare가 자동으로 DNS 레코드를 제안합니다:

#### Option A: CNAME 방식 (권장)
```
Type: CNAME
Name: reviews-sphere.com (또는 @)
Target: review-spheres-v1.pages.dev
Proxy: Proxied (오렌지 구름 아이콘)
```

#### Option B: A 레코드 방식
```
Type: A
Name: @ (root domain)
Target: [Cloudflare가 제공하는 IP 주소]
Proxy: Proxied
```

---

### 3️⃣ www 서브도메인 추가 (선택사항)

**www.reviews-sphere.com** 도 설정하려면:

1. **Custom domains** 탭에서 **Add a domain** 클릭
2. 도메인 입력: `www.reviews-sphere.com`
3. DNS 레코드 추가:
```
Type: CNAME
Name: www
Target: review-spheres-v1.pages.dev
Proxy: Proxied
```

4. **리디렉션 규칙 설정** (www → 메인 도메인):
   - Cloudflare Dashboard → **Rules** → **Redirect Rules**
   - **Create rule** 클릭
   - 규칙 이름: "Redirect www to apex"
   - If: `Hostname equals www.reviews-sphere.com`
   - Then: `Dynamic redirect` → `concat("https://reviews-sphere.com", http.request.uri.path)`
   - Status code: `301 (Permanent Redirect)`

---

### 4️⃣ SSL/TLS 설정

**자동 HTTPS 활성화:**
1. Cloudflare Dashboard → **SSL/TLS** 탭
2. 암호화 모드: **Full (strict)** 선택 (권장)
3. **Edge Certificates** → **Always Use HTTPS**: ON
4. **Automatic HTTPS Rewrites**: ON

**인증서 발급 대기:**
- Cloudflare가 자동으로 SSL 인증서 발급 (보통 5-15분 소요)
- 상태: **Active certificate** 로 변경될 때까지 대기

---

### 5️⃣ 검증

**DNS 전파 확인:**
```bash
# 도메인 DNS 확인
nslookup reviews-sphere.com

# HTTPS 접속 테스트
curl -I https://reviews-sphere.com
```

**브라우저에서 확인:**
- https://reviews-sphere.com 접속
- 자물쇠 아이콘 확인 (SSL 정상)
- 사이트 정상 로딩 확인

---

## 🔍 Google Search Console 재등록

**커스텀 도메인으로 변경 후 필수:**

### 단계:
1. https://search.google.com/search-console 접속
2. **속성 추가** 클릭
3. URL 입력: `https://reviews-sphere.com`
4. 소유권 확인:
   - **DNS 레코드 방식** (권장):
     ```
     Type: TXT
     Name: @
     Value: google-site-verification=xxxxxxxxxxxxx
     ```
   - 또는 **HTML 파일 방식**
   - 또는 **메타 태그 방식**

5. **Sitemap 제출**:
   - URL: `https://reviews-sphere.com/sitemap.xml`
   - **Sitemaps** 메뉴에서 제출

6. **URL 검사**:
   - 홈페이지 URL 검사
   - **색인 생성 요청** 클릭

---

## 🔍 Naver Search Advisor 재등록

### 단계:
1. https://searchadvisor.naver.com 접속
2. **사이트 추가** 클릭
3. URL 입력: `https://reviews-sphere.com`
4. 소유권 확인:
   - **HTML 파일 방식** 또는
   - **메타 태그 방식**

5. **Sitemap 제출**:
   - URL: `https://reviews-sphere.com/sitemap.xml`

6. **수집 요청**:
   - 홈페이지 URL 수집 요청

---

## 📊 예상 작업 시간

| 단계 | 소요 시간 |
|------|----------|
| DNS 레코드 추가 | 1-2분 |
| DNS 전파 | 5-30분 |
| SSL 인증서 발급 | 5-15분 |
| Google Search Console 등록 | 5분 |
| Naver Search Advisor 등록 | 5분 |
| **총 예상 시간** | **20-60분** |

---

## ⚠️ 주의사항

### DNS 전파 대기
- 도메인 설정 후 전 세계 DNS 서버에 전파되는 시간 필요
- 보통 5-30분, 최대 24-48시간 소요 가능

### 이전 도메인 처리
- `review-spheres-v1.pages.dev`는 계속 작동
- 301 리디렉션 설정 권장 (구 도메인 → 새 도메인)
- Google Search Console에서 주소 변경 알림

### 캐시 정리
- 브라우저 캐시 삭제
- Cloudflare 캐시 삭제 (**Caching** → **Purge Everything**)

---

## 🚀 배포 후 체크리스트

- [ ] Cloudflare Pages 커스텀 도메인 추가
- [ ] DNS CNAME 레코드 설정
- [ ] SSL 인증서 발급 확인
- [ ] https://reviews-sphere.com 접속 테스트
- [ ] Google Search Console 등록
- [ ] Naver Search Advisor 등록
- [ ] Sitemap 제출 (Google, Naver)
- [ ] robots.txt 접근 테스트
- [ ] 소셜 미디어 링크 공유 테스트 (Open Graph)

---

## 📞 문제 해결

### DNS 전파 안 됨
```bash
# DNS 캐시 플러시 (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# DNS 캐시 플러시 (Windows)
ipconfig /flushdns
```

### SSL 오류
- Cloudflare SSL 모드: **Full (strict)** 확인
- 인증서 상태: **Active** 확인
- 24시간 대기 후 재시도

### 리디렉션 루프
- Cloudflare SSL 모드 변경: **Flexible** → **Full (strict)**
- **Always Use HTTPS** 설정 확인

---

**작성일**: 2025-11-24  
**버전**: v85  
**프로젝트**: review-spheres-v1  
**도메인**: reviews-sphere.com
