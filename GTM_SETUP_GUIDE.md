# GTM 버튼 클릭 이벤트 설정 가이드

## 📋 개요

리뷰스피어의 히어로 슬라이더 버튼 클릭을 Google Tag Manager(GTM)로 추적하기 위한 설정 가이드입니다.

---

## 🎯 추적 대상 버튼

### 슬라이드별 버튼 목록

| 슬라이드 | 버튼 텍스트 | 위치 코드 | 이동 경로 | 사용자 조건 |
|---------|------------|----------|----------|------------|
| **슬라이드 1** | 광고주로 시작하기 | `Main_Slide1` | `/login` | 비로그인 |
| **슬라이드 1** | 인플루언서로 시작하기 | `Main_Slide1` | `/login` | 비로그인 |
| **슬라이드 1** | 내 캠페인 관리 | `Main_Slide1` | `/campaigns` | 광고주 로그인 |
| **슬라이드 1** | 캠페인 둘러보기 | `Main_Slide1` | `#campaigns-section` | 인플루언서 로그인 |
| **슬라이드 2** | 광고주로 시작하기 | `Promo_Slide2` | `/login` | 비로그인 |
| **슬라이드 2** | 내 캠페인 관리 | `Promo_Slide2` | `/campaigns` | 광고주 로그인 |
| **슬라이드 3** | 인플루언서로 시작하기 | `Event_Slide3` | `/login` | 비로그인 |
| **슬라이드 3** | 캠페인 둘러보기 | `Event_Slide3` | `#campaigns-section` | 인플루언서 로그인 |
| **슬라이드 4** | 지금 바로 시작하기 | `Beginner_Slide4` | `/login` | 비로그인 |
| **슬라이드 4** | 캠페인 둘러보기 | `Beginner_Slide4` | `#campaigns-section` | 인플루언서 로그인 |

---

## 🔧 GTM 설정 단계

### STEP 1: 변수(Variables) 생성

GTM 관리 화면 → **변수(Variables)** → **새로 만들기**

#### 변수 1: Button Text
- **변수 이름**: `Button Text`
- **변수 유형**: `데이터 영역 변수(Data Layer Variable)`
- **데이터 영역 변수 이름**: `button_name`
- **설명**: 버튼에 표시된 텍스트 (예: "광고주로 시작하기")

#### 변수 2: Button URL
- **변수 이름**: `Button URL`
- **변수 유형**: `데이터 영역 변수(Data Layer Variable)`
- **데이터 영역 변수 이름**: `link_url`
- **설명**: 버튼 클릭 시 이동하는 URL (예: "/login")

#### 변수 3: Button Location
- **변수 이름**: `Button Location`
- **변수 유형**: `데이터 영역 변수(Data Layer Variable)`
- **데이터 영역 변수 이름**: `button_location`
- **설명**: 버튼이 위치한 슬라이드 (예: "Main_Slide1")

---

### STEP 2: 트리거(Trigger) 생성

GTM 관리 화면 → **트리거(Triggers)** → **새로 만들기**

#### 트리거 설정
- **트리거 이름**: `Hero Button Click`
- **트리거 유형**: `맞춤 이벤트(Custom Event)`
- **이벤트 이름**: `hero_button_click`
- **실행 조건**: `모든 맞춤 이벤트`

---

### STEP 3: 태그(Tag) 생성

GTM 관리 화면 → **태그(Tags)** → **새로 만들기**

#### 태그 기본 설정
- **태그 이름**: `GA4 - Hero Button Click`
- **태그 유형**: `Google 애널리틱스: GA4 이벤트`
- **측정 ID**: `G-XXXXXXXXXX` (본인의 GA4 측정 ID 입력)
- **이벤트 이름**: `button_click`

#### 이벤트 매개변수 추가

| 매개변수 이름 | 값 | 설명 |
|--------------|-----|------|
| `button_name` | `{{Button Text}}` | 버튼 텍스트 |
| `link_url` | `{{Button URL}}` | 이동 URL |
| `button_location` | `{{Button Location}}` | 슬라이드 위치 |

#### 트리거 설정
- **트리거**: `Hero Button Click` (위에서 만든 트리거 선택)

---

## 📊 GA4에서 확인하기

### 실시간 보고서
1. GA4 → **보고서** → **실시간**
2. 이벤트 카드에서 `button_click` 이벤트 확인

### 맞춤 보고서 만들기
1. GA4 → **탐색** → **빈 보고서**
2. **측정기준 추가**:
   - `button_name` (버튼 텍스트)
   - `button_location` (슬라이드 위치)
   - `link_url` (이동 URL)
3. **측정항목 추가**:
   - `이벤트 수`
   - `전환수` (버튼 클릭을 전환으로 설정한 경우)

---

## 🧪 테스트 방법

### GTM 미리보기 모드
1. GTM → **미리보기** 클릭
2. 웹사이트 URL 입력: `https://review-spheres-v1.pages.dev`
3. 히어로 슬라이더 버튼 클릭
4. GTM 디버거에서 확인:
   - `hero_button_click` 이벤트 발생 확인
   - `button_name`, `link_url`, `button_location` 값 확인

### 브라우저 콘솔 확인
개발자 도구(F12) → Console 탭에서 다음 메시지 확인:
```
📊 GTM Event: {buttonName: "광고주로 시작하기", linkUrl: "/login", buttonLocation: "Main_Slide1"}
```

---

## 📈 예상 데이터 예시

### DataLayer 이벤트 구조
```javascript
{
  event: 'hero_button_click',
  button_name: '광고주로 시작하기',
  link_url: '/login',
  button_location: 'Main_Slide1'
}
```

### GA4 이벤트 예시

| button_name | button_location | link_url | 이벤트 수 |
|-------------|----------------|----------|----------|
| 광고주로 시작하기 | Main_Slide1 | /login | 45 |
| 인플루언서로 시작하기 | Main_Slide1 | /login | 82 |
| 캠페인 둘러보기 | Event_Slide3 | #campaigns-section | 34 |
| 지금 바로 시작하기 | Beginner_Slide4 | /login | 56 |

---

## ✅ 체크리스트

- [ ] GTM에 3개 변수 생성 완료
- [ ] GTM에 트리거 생성 완료
- [ ] GTM에 태그 생성 완료
- [ ] GTM 컨테이너 게시 완료
- [ ] GTM 미리보기 모드에서 이벤트 확인
- [ ] GA4 실시간 보고서에서 이벤트 확인
- [ ] 브라우저 콘솔에서 로그 확인

---

## 🔍 문제 해결

### 이벤트가 발생하지 않는 경우
1. GTM 컨테이너가 웹사이트에 정상 설치되었는지 확인
2. GTM 미리보기 모드에서 `dataLayer` 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 데이터가 GA4에 표시되지 않는 경우
1. GA4 측정 ID가 올바른지 확인
2. GTM 태그가 실행되고 있는지 확인 (미리보기 모드)
3. GA4 실시간 보고서에서 지연 시간 고려 (최대 5분)

---

## 📞 지원

추가 질문이나 문제가 있으시면 GTM/GA4 문서를 참고하세요:
- GTM 도움말: https://support.google.com/tagmanager
- GA4 도움말: https://support.google.com/analytics

---

**작성일**: 2025-11-23  
**버전**: v81  
**배포 URL**: https://review-spheres-v1.pages.dev
