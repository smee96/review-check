// ReviewSphere Frontend Application

class ReviewSphere {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.currentPage = 'home';
    this.init();
  }

  init() {
    // Eruda 모바일 디버깅 도구 로드
    this.loadEruda();
    
    // History API 이벤트 리스너 등록
    window.addEventListener('popstate', (event) => {
      if (event.state) {
        this.handleHistoryState(event.state);
      } else {
        // 상태가 없으면 홈으로
        this.showHome(false);
      }
    });

    // 로그인 여부와 관계없이 항상 홈 페이지로 시작
    // 초기 히스토리 상태 설정
    const state = { page: 'home', data: {} };
    window.history.replaceState(state, 'R.SPHERE - 홈', '#home');
    this.showHome(false);
  }

  loadEruda() {
    // Eruda 디버깅 도구 로드 (모바일에서 개발자 도구)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.onload = () => {
      if (window.eruda) {
        window.eruda.init();
        console.log('📱 Eruda 모바일 디버깅 도구가 활성화되었습니다. 화면 우측 하단 버튼을 클릭하세요.');
      }
    };
    document.head.appendChild(script);
  }

  // 히어로 슬라이더 초기화
  initHeroSlider() {
    // 기존 인터벌 정리
    if (window.heroSlideInterval) {
      clearInterval(window.heroSlideInterval);
    }
    
    const totalRealSlides = 4; // 실제 슬라이드 개수
    const totalSlides = 5; // 복제본 포함 총 개수
    
    // 전역 변수 초기화
    window.heroSlideIndex = 0;
    window.touchStartX = 0;
    window.touchEndX = 0;
    window.heroIsTransitioning = false;
    
    // 슬라이드 설정 함수
    window.setHeroSlide = (index, instant = false) => {
      const slider = document.getElementById('heroSlider');
      const indicators = document.querySelectorAll('.hero-indicator');
      
      if (slider) {
        // 트랜지션 설정
        if (instant) {
          slider.style.transition = 'none';
        } else {
          slider.style.transition = 'transform 0.5s ease-in-out';
        }
        
        slider.style.transform = `translateX(-${index * 100}%)`;
        window.heroSlideIndex = index;
      }
      
      // 인디케이터 업데이트 (실제 슬라이드 인덱스 기준)
      const realIndex = index >= totalRealSlides ? 0 : index;
      indicators.forEach((indicator, i) => {
        if (i === realIndex) {
          indicator.classList.remove('opacity-50');
          indicator.classList.add('opacity-100', 'w-6');
        } else {
          indicator.classList.remove('opacity-100', 'w-6');
          indicator.classList.add('opacity-50');
        }
      });
    };
    
    // 다음 슬라이드
    window.heroNext = () => {
      if (window.heroIsTransitioning) return;
      window.heroIsTransitioning = true;
      
      window.heroSlideIndex++;
      window.setHeroSlide(window.heroSlideIndex);
      
      // 복제된 슬라이드(인덱스 3)에 도달하면 트랜지션 후 첫 슬라이드로 순간이동
      if (window.heroSlideIndex >= totalRealSlides) {
        setTimeout(() => {
          window.heroSlideIndex = 0;
          window.setHeroSlide(0, true);
          setTimeout(() => {
            window.heroIsTransitioning = false;
          }, 50);
        }, 500);
      } else {
        setTimeout(() => {
          window.heroIsTransitioning = false;
        }, 500);
      }
      
      this.startHeroAutoSlide();
    };
    
    // 이전 슬라이드
    window.heroPrev = () => {
      if (window.heroIsTransitioning) return;
      window.heroIsTransitioning = true;
      
      if (window.heroSlideIndex <= 0) {
        // 첫 슬라이드에서 이전으로 가면 복제 슬라이드로 순간이동 후 마지막 슬라이드로 이동
        window.heroSlideIndex = totalRealSlides;
        window.setHeroSlide(window.heroSlideIndex, true);
        setTimeout(() => {
          window.heroSlideIndex = totalRealSlides - 1;
          window.setHeroSlide(window.heroSlideIndex);
          setTimeout(() => {
            window.heroIsTransitioning = false;
          }, 500);
        }, 50);
      } else {
        window.heroSlideIndex--;
        window.setHeroSlide(window.heroSlideIndex);
        setTimeout(() => {
          window.heroIsTransitioning = false;
        }, 500);
      }
      
      this.startHeroAutoSlide();
    };
    
    // 자동 슬라이드 시작
    this.startHeroAutoSlide();
    
    // DOM이 준비된 후 이벤트 리스너 추가
    setTimeout(() => {
      window.setHeroSlide(0, true);
      
      // 터치 이벤트
      const slider = document.getElementById('heroSlider');
      if (slider) {
        slider.addEventListener('touchstart', (e) => {
          window.touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        slider.addEventListener('touchmove', (e) => {
          window.touchEndX = e.touches[0].clientX;
        }, { passive: true });
        
        slider.addEventListener('touchend', () => {
          const diff = window.touchStartX - window.touchEndX;
          const threshold = 50;
          
          if (Math.abs(diff) > threshold) {
            if (diff > 0) {
              window.heroNext();
            } else {
              window.heroPrev();
            }
          }
        });
      }
      
      // 인디케이터 클릭 이벤트
      const indicators = document.querySelectorAll('.hero-indicator');
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
          if (!window.heroIsTransitioning) {
            window.heroIsTransitioning = true;
            window.heroSlideIndex = index;
            window.setHeroSlide(index);
            setTimeout(() => {
              window.heroIsTransitioning = false;
            }, 500);
            this.startHeroAutoSlide();
          }
        });
      });
    }, 100);
  }
  
  // 자동 슬라이드 시작
  startHeroAutoSlide() {
    if (window.heroSlideInterval) {
      clearInterval(window.heroSlideInterval);
    }
    window.heroSlideInterval = setInterval(() => {
      window.heroNext();
    }, 5000);
  }

  // 히스토리 상태 처리
  async handleHistoryState(state) {
    const { page, data } = state;
    
    switch (page) {
      case 'home':
        await this.showHome(false);
        break;
      case 'bestCampaigns':
        await this.showBestCampaigns(false);
        break;
      case 'bestReviews':
        await this.showBestReviews(false);
        break;
      case 'myPage':
        await this.showMyPage(false);
        break;
      case 'campaignDetail':
        await this.viewCampaignDetail(data.id, false);
        break;
      case 'advertiserCampaigns':
        await this.showAdvertiserCampaigns();
        break;
      case 'advertiserReviews':
        await this.showAdvertiserReviews();
        break;
      case 'login':
        // 로그인 페이지로 뒤로가기 하는 경우 홈으로 리다이렉트
        await this.showHome(false);
        break;
      case 'register':
        // 회원가입 페이지로 뒤로가기 하는 경우 홈으로 리다이렉트
        await this.showHome(false);
        break;
      default:
        await this.showHome(false);
    }
  }

  // 히스토리에 상태 추가
  pushHistory(page, data = {}) {
    const state = { page, data };
    const title = this.getPageTitle(page);
    const url = `#${page}${data.id ? `/${data.id}` : ''}`;
    
    // 같은 페이지면 히스토리에 추가하지 않음
    if (window.history.state && 
        window.history.state.page === page && 
        JSON.stringify(window.history.state.data) === JSON.stringify(data)) {
      return;
    }
    
    window.history.pushState(state, title, url);
  }

  // 페이지 제목 가져오기
  getPageTitle(page) {
    const titles = {
      home: 'R.SPHERE - 홈',
      bestCampaigns: 'R.SPHERE - 베스트 캠페인',
      bestReviews: 'R.SPHERE - 베스트 리뷰',
      myPage: 'R.SPHERE - 마이페이지',
      campaignDetail: 'R.SPHERE - 캠페인 상세',
      advertiserCampaigns: 'R.SPHERE - 캠페인 관리',
      advertiserReviews: 'R.SPHERE - 리뷰 관리',
      login: 'R.SPHERE - 로그인',
      register: 'R.SPHERE - 회원가입'
    };
    return titles[page] || 'R.SPHERE';
  }

  // ============================================
  // Auth Methods
  // ============================================

  async register(email, nickname, password, role) {
    try {
      const response = await api.register(email, nickname, password, role);
      alert(response.data.message || '회원가입이 완료되었습니다!');
      this.showLogin();
    } catch (error) {
      alert(error.response?.data?.error || '회원가입에 실패했습니다');
    }
  }

  async login(email, password) {
    try {
      const response = await api.login(email, password);
      this.token = response.data.token;
      this.user = response.data.user;
      
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      
      // 저장된 리턴 URL이 있으면 해당 페이지로 이동
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        
        // campaign:123 형식으로 저장된 경우
        if (returnUrl.startsWith('campaign:')) {
          const campaignId = returnUrl.split(':')[1];
          this.viewCampaignDetail(campaignId);
        } else {
          // 다른 형식의 URL도 처리 가능하도록 확장 가능
          this.showHome();
        }
      } else {
        // 리턴 URL이 없으면 홈으로 이동
        this.showHome();
      }
    } catch (error) {
      // 에러 메시지를 화면에 표시
      const errorDiv = document.getElementById('loginError');
      const errorMessage = document.getElementById('loginErrorMessage');
      if (errorDiv && errorMessage) {
        errorMessage.textContent = error.response?.data?.error || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
        errorDiv.classList.remove('hidden');
        
        // 3초 후 에러 메시지 자동 숨김
        setTimeout(() => {
          errorDiv.classList.add('hidden');
        }, 5000);
      }
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.showHome();
  }

  async forgotPassword(email) {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      alert(response.data.message);
      
      // For development - show token
      if (response.data.dev_token) {
        const resetUrl = window.location.origin + '/reset-password?token=' + response.data.dev_token;
        console.log('Reset URL:', resetUrl);
        prompt('개발용 비밀번호 재설정 URL (실제로는 이메일로 발송됩니다):', resetUrl);
      }
    } catch (error) {
      alert(error.response?.data?.error || '요청에 실패했습니다');
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword
      });
      
      alert(response.data.message);
      this.showLogin();
    } catch (error) {
      alert(error.response?.data?.error || '비밀번호 재설정에 실패했습니다');
    }
  }

  getAuthHeaders() {
    return {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    };
  }

  // ============================================
  // Page Rendering Methods
  // ============================================

  async showHome(pushHistory = true) {
    if (pushHistory) {
      this.pushHistory('home');
    }
    // 홈은 항상 메인 페이지(캠페인 목록)로 이동
    const app = document.getElementById('app');
    
    // Load campaigns and reviews for display
    let ongoingCampaigns = [];
    let bestCampaigns = [];
    let bestReviews = [];
    
    try {
      // 진행중인 캠페인 (모든 승인된 캠페인)
      const ongoingResponse = await axios.get('/api/campaigns');
      ongoingCampaigns = ongoingResponse.data || [];
      
      // 베스트 캠페인 (관리자 선정)
      const bestResponse = await axios.get('/api/campaigns?type=best');
      bestCampaigns = bestResponse.data || [];
      
      // 베스트 리뷰 (관리자 선정)
      const bestReviewsResponse = await axios.get('/api/campaigns/reviews/best');
      bestReviews = bestReviewsResponse.data || [];
    } catch (error) {
      console.log('Failed to load data:', error);
    }
    
    app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}

          <!-- Hero Section Slider -->
          <div class="relative overflow-hidden">
            <div id="heroSlider" class="flex touch-pan-y">
            
            <!-- 슬라이드 1: 메인 화면 -->
            <div class="min-w-full bg-gradient-to-br from-purple-600 to-blue-500 text-white py-10 sm:py-14">
              <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
                <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                  진짜 리뷰, 리뷰스피어
                </h2>
                <p class="text-sm sm:text-base lg:text-lg text-purple-100 mb-6">
                  리뷰스피어의 AI 매칭으로<br>광고주와 인플루언서를 직접 연결
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  ${this.user ? (
                    this.user.role === 'advertiser' || this.user.role === 'agency' || this.user.role === 'rep' ? `
                      <button onclick="app.showAdvertiserCampaigns()" class="bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-lg w-56">
                        <i class="fas fa-tasks mr-2"></i>내 캠페인 관리
                      </button>
                    ` : `
                      <button onclick="window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})" class="bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-lg w-56">
                        <i class="fas fa-search mr-2"></i>캠페인 둘러보기
                      </button>
                    `
                  ) : `
                    <button onclick="app.showLogin()" class="bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-lg w-56">
                      <i class="fas fa-bullhorn mr-2"></i>광고주로 시작하기
                    </button>
                    <button onclick="app.showLogin()" class="bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-lg w-56">
                      <i class="fas fa-star mr-2"></i>인플루언서로 시작하기
                    </button>
                  `}
                </div>
              </div>
            </div>
            
            <!-- 슬라이드 2: 광고주 프로모션 -->
            <div class="min-w-full bg-gradient-to-br from-pink-500 to-purple-600 text-white py-10 sm:py-14">
              <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
                <div class="flex items-center justify-center mb-3">
                  <i class="fas fa-percentage text-3xl sm:text-4xl text-white mr-3"></i>
                  <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                    광고주 특별 프로모션
                  </h2>
                </div>
                <p class="text-base sm:text-lg text-pink-100 mb-3">
                  캠페인 등록비 할인 🔥
                </p>
                <div class="mb-4">
                  <p class="text-2xl sm:text-3xl font-extrabold">
                    <span class="line-through opacity-70">30,000원</span> → <span class="text-yellow-300">10,000원</span>
                  </p>
                </div>
                ${this.user && (this.user.role === 'advertiser' || this.user.role === 'agency' || this.user.role === 'rep') ? `
                  <button onclick="app.showAdvertiserCampaigns()" class="bg-white text-pink-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-pink-50 transition shadow-lg w-56">
                    <i class="fas fa-tasks mr-2"></i>내 캠페인 관리
                  </button>
                ` : this.user ? `
                  <button disabled class="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg text-sm font-bold cursor-not-allowed shadow-lg w-56 opacity-60">
                    <i class="fas fa-bullhorn mr-2"></i>광고주 전용
                  </button>
                ` : `
                  <button onclick="app.showLogin()" class="bg-white text-pink-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-pink-50 transition shadow-lg w-56">
                    <i class="fas fa-bullhorn mr-2"></i>광고주로 시작하기
                  </button>
                `}
              </div>
            </div>
            
            <!-- 슬라이드 3: 인플루언서 이벤트 -->
            <div class="min-w-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white py-10 sm:py-14">
              <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
                <div class="flex items-center justify-center mb-3">
                  <i class="fas fa-gift text-3xl sm:text-4xl text-white mr-3"></i>
                  <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                    신규 가입 이벤트
                  </h2>
                </div>
                <p class="text-base sm:text-lg text-yellow-100 mb-3">
                  인플루언서 신규 가입 시 🎉
                </p>
                <div class="mb-4">
                  <p class="text-2xl sm:text-3xl font-extrabold">
                    스피어 포인트 <span class="text-3xl sm:text-4xl">1,000P 지급!</span>
                  </p>
                </div>
                ${this.user && this.user.role === 'influencer' ? `
                  <button onclick="window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})" class="bg-white text-orange-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-50 transition shadow-lg w-56">
                    <i class="fas fa-search mr-2"></i>캠페인 둘러보기
                  </button>
                ` : this.user ? `
                  <button disabled class="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg text-sm font-bold cursor-not-allowed shadow-lg w-56 opacity-60">
                    <i class="fas fa-star mr-2"></i>인플루언서 전용
                  </button>
                ` : `
                  <button onclick="app.showLogin()" class="bg-white text-orange-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-50 transition shadow-lg w-56">
                    <i class="fas fa-star mr-2"></i>인플루언서로 시작하기
                  </button>
                `}
              </div>
            </div>
            
            <!-- 슬라이드 4: 성장 메시지 -->
            <div class="min-w-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-10 sm:py-14">
              <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
                <div class="flex items-center justify-center mb-4">
                  <i class="fas fa-rocket text-4xl sm:text-5xl text-white mr-3"></i>
                  <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                    리뷰스피어가 성장하고 있어요
                  </h2>
                </div>
                <div class="space-y-3 mb-6">
                  <div class="flex items-center justify-center gap-2">
                    <i class="fas fa-check-circle text-2xl text-green-300"></i>
                    <p class="text-xl sm:text-2xl font-bold">더 많은 캠페인</p>
                  </div>
                  <div class="flex items-center justify-center gap-2">
                    <i class="fas fa-check-circle text-2xl text-green-300"></i>
                    <p class="text-xl sm:text-2xl font-bold">더 많은 인플루언서</p>
                  </div>
                  <div class="flex items-center justify-center gap-2">
                    <i class="fas fa-check-circle text-2xl text-green-300"></i>
                    <p class="text-xl sm:text-2xl font-bold">더 큰 기회</p>
                  </div>
                </div>
                <p class="text-2xl sm:text-3xl font-extrabold text-pink-200">
                  많관부 💜
                </p>
              </div>
            </div>
            
            <!-- 슬라이드 5: 첫 번째 슬라이드 복제 (무한 루프용) -->
            <div class="min-w-full bg-gradient-to-br from-purple-600 to-blue-500 text-white py-10 sm:py-14">
              <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
                <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                  진짜 리뷰, 리뷰스피어
                </h2>
                <p class="text-sm sm:text-base lg:text-lg text-purple-100 mb-6">
                  리뷰스피어의 AI 매칭으로<br>광고주와 인플루언서를 직접 연결
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  ${this.user ? (
                    this.user.role === 'advertiser' || this.user.role === 'agency' || this.user.role === 'rep' ? `
                      <button onclick="app.showAdvertiserCampaigns()" class="bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-lg w-56">
                        <i class="fas fa-tasks mr-2"></i>내 캠페인 관리
                      </button>
                    ` : `
                      <button onclick="window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})" class="bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-lg w-56">
                        <i class="fas fa-search mr-2"></i>캠페인 둘러보기
                      </button>
                    `
                  ) : `
                    <button onclick="app.showLogin()" class="bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-lg w-56">
                      <i class="fas fa-bullhorn mr-2"></i>광고주로 시작하기
                    </button>
                    <button onclick="app.showLogin()" class="bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition shadow-lg w-56">
                      <i class="fas fa-star mr-2"></i>인플루언서로 시작하기
                    </button>
                  `}
                </div>
              </div>
            </div>
            
          </div>
          
          <!-- 하단 인디케이터 (점) -->
          <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            <button class="hero-indicator cursor-pointer w-2 h-2 rounded-full bg-white opacity-50 transition-all hover:opacity-75" data-index="0"></button>
            <button class="hero-indicator cursor-pointer w-2 h-2 rounded-full bg-white opacity-50 transition-all hover:opacity-75" data-index="1"></button>
            <button class="hero-indicator cursor-pointer w-2 h-2 rounded-full bg-white opacity-50 transition-all hover:opacity-75" data-index="2"></button>
            <button class="hero-indicator cursor-pointer w-2 h-2 rounded-full bg-white opacity-50 transition-all hover:opacity-75" data-index="3"></button>
          </div>
        </div>

        <!-- Ongoing Campaigns Section -->
        <div class="py-8 sm:py-12 bg-white">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-fire text-orange-500 mr-2"></i>진행중인 캠페인
              </h3>
              ${ongoingCampaigns.length > 0 ? '<span class="text-sm text-gray-500">좌우로 스크롤하세요</span>' : ''}
            </div>
            <div class="overflow-x-auto pb-4 -mx-3 px-3 scrollbar-hide">
              <div class="flex space-x-4" style="width: max-content;">
                ${ongoingCampaigns.length > 0 ? ongoingCampaigns.map(c => {
                  const channelIcon = UIUtils.getChannelIcon(c.channel_type);
                  return `
                  <div onclick="app.viewCampaignDetail(${c.id})" class="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition cursor-pointer flex-shrink-0" style="width: 280px;">
                    ${c.thumbnail_image ? `
                      <div class="w-full h-40 overflow-hidden bg-gray-100">
                        <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-full object-cover">
                      </div>
                    ` : `
                      <div class="w-full h-40 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                        <i class="fas fa-image text-white text-5xl opacity-50"></i>
                      </div>
                    `}
                    <div class="p-4 flex flex-col" style="min-height: 220px;">
                      <div class="flex items-start justify-between mb-2">
                        <h4 class="font-bold text-base line-clamp-1 flex-1">${c.title}</h4>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${this.getStatusBadge(c.status, c)} ml-2 whitespace-nowrap">
                          ${this.getStatusText(c.status, c)}
                        </span>
                      </div>
                      <p class="text-gray-600 text-sm mb-3 line-clamp-2" style="height: 40px;">${c.description || '캠페인 설명이 없습니다'}</p>
                      
                      <!-- 과금 방식 정보 -->
                      <div class="bg-purple-50 px-3 py-2 rounded-lg mb-2 space-y-1">
                        ${c.pricing_type === 'points_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">포인트만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'purchase_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">구매 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">구매금</span>
                            <span class="font-bold text-orange-600">${c.product_value ? c.product_value.toLocaleString() + '원' : '-'}</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'product_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">상품 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">상품</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'voucher_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">이용권 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">이용권</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'product_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">상품만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">상품</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-gray-500">- P</span>
                          </div>
                        ` : c.pricing_type === 'voucher_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">이용권만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">이용권</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-gray-500">- P</span>
                          </div>
                        ` : `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points > 0 || c.point_reward > 0) ? (c.sphere_points || c.point_reward).toLocaleString() + ' P' : '- P'}</span>
                          </div>
                        `}
                      </div>
                      
                      <div class="flex items-center justify-between pt-2 border-t mt-auto">
                        <span>${channelIcon}</span>
                        <span class="text-sm text-gray-600"><i class="fas fa-users mr-1"></i><span class="font-semibold text-purple-600">${c.application_count || 0}</span>/${c.slots}명</span>
                      </div>
                    </div>
                  </div>
                `}).join('') : `
                  <div class="w-full text-center py-16">
                    <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <p class="text-xl text-gray-500 mb-2">아직 진행중인 캠페인이 없어요</p>
                    <p class="text-sm text-gray-400">곧 멋진 캠페인으로 찾아뵐게요!</p>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- Best Campaigns Section -->
        <div class="py-8 sm:py-12 bg-gray-50">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-trophy text-yellow-500 mr-2"></i>베스트 캠페인
              </h3>
              ${bestCampaigns.length > 0 ? '<span class="text-sm text-gray-500">좌우로 스크롤하세요</span>' : ''}
            </div>
            <div class="overflow-x-auto pb-4 -mx-3 px-3 scrollbar-hide">
              <div class="flex space-x-4" style="width: max-content;">
                ${bestCampaigns.length > 0 ? bestCampaigns.map((c, idx) => {
                  const channelIcon = UIUtils.getChannelIcon(c.channel_type);
                  return `
                  <div onclick="app.viewCampaignDetail(${c.id})" class="bg-white border-2 border-yellow-200 rounded-xl overflow-hidden hover:shadow-xl transition cursor-pointer flex-shrink-0" style="width: 280px;">
                    ${c.thumbnail_image ? `
                      <div class="w-full h-40 overflow-hidden bg-gray-100 relative">
                        <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-full object-cover">
                        <div class="absolute top-2 left-2">
                          <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold shadow-md">
                            <i class="fas fa-crown mr-1"></i>Top ${idx + 1}
                          </span>
                        </div>
                      </div>
                    ` : `
                      <div class="w-full h-40 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center relative">
                        <i class="fas fa-trophy text-white text-5xl opacity-50"></i>
                        <div class="absolute top-2 left-2">
                          <span class="px-3 py-1 bg-white text-yellow-800 rounded-full text-xs font-semibold shadow-md">
                            <i class="fas fa-crown mr-1"></i>Top ${idx + 1}
                          </span>
                        </div>
                      </div>
                    `}
                    <div class="p-4 flex flex-col" style="min-height: 220px;">
                      <div class="flex items-start justify-between mb-2">
                        <h4 class="font-bold text-base line-clamp-1 flex-1">${c.title}</h4>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${this.getStatusBadge(c.status, c)} ml-2 whitespace-nowrap">
                          ${this.getStatusText(c.status, c)}
                        </span>
                      </div>
                      <p class="text-gray-600 text-sm mb-3 line-clamp-2" style="height: 40px;">${c.description || '캠페인 설명이 없습니다'}</p>
                      
                      <!-- 과금 방식 정보 -->
                      <div class="bg-purple-50 px-3 py-2 rounded-lg mb-2 space-y-1">
                        ${c.pricing_type === 'points_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">포인트만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'purchase_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">구매 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">구매금</span>
                            <span class="font-bold text-orange-600">${c.product_value ? c.product_value.toLocaleString() + '원' : '-'}</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'product_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">상품 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">상품</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'voucher_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">이용권 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">이용권</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'product_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">상품만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">상품</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-gray-500">- P</span>
                          </div>
                        ` : c.pricing_type === 'voucher_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">이용권만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">이용권</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-gray-500">- P</span>
                          </div>
                        ` : `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points > 0 || c.point_reward > 0) ? (c.sphere_points || c.point_reward).toLocaleString() + ' P' : '- P'}</span>
                          </div>
                        `}
                      </div>
                      
                      <div class="flex items-center justify-between pt-2 border-t mt-auto">
                        <span>${channelIcon}</span>
                        <span class="text-sm text-gray-600"><i class="fas fa-users mr-1"></i><span class="font-semibold text-purple-600">${c.application_count || 0}</span>/${c.slots}명</span>
                      </div>
                    </div>
                  </div>
                  `;
                }).join('') : `
                  <div class="w-full text-center py-16">
                    <i class="fas fa-star text-6xl text-gray-300 mb-4"></i>
                    <p class="text-xl text-gray-500 mb-2">선정된 베스트 캠페인이 아직 없어요</p>
                    <p class="text-sm text-gray-400">많은 참여 부탁드려요!</p>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- Best Reviews Section -->
        <div class="py-8 sm:py-12 bg-white">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-heart text-red-500 mr-2"></i>베스트 리뷰
              </h3>
              ${bestReviews.length > 0 ? '<span class="text-sm text-gray-500">좌우로 스크롤하세요</span>' : ''}
            </div>
            <div class="overflow-x-auto pb-4 -mx-3 px-3 scrollbar-hide">
              <div class="flex space-x-4" style="width: max-content;">
                ${bestReviews.length > 0 ? bestReviews.map((r, idx) => {
                  // 이미지 URL 생성 (API 엔드포인트 사용)
                  const imageUrl = r.image_url ? `/api/applications/review-image/${encodeURIComponent(r.image_url)}` : null;
                  
                  return `
                  <div class="bg-white border-2 border-red-200 rounded-xl overflow-hidden hover:shadow-xl transition flex-shrink-0 cursor-pointer" style="width: 280px;" onclick="app.viewCampaignDetail(${r.campaign_id})">
                    ${imageUrl ? `
                      <div class="w-full h-64 overflow-hidden bg-gray-100 relative">
                        <img src="${imageUrl}" alt="리뷰" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center\\'><i class=\\'fas fa-heart text-white text-5xl opacity-50\\'></i></div>'">
                        <div class="absolute top-2 left-2">
                          <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold shadow-md">
                            <i class="fas fa-heart mr-1"></i>BEST
                          </span>
                        </div>
                      </div>
                    ` : `
                      <div class="w-full h-64 bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center relative">
                        <i class="fas fa-heart text-white text-5xl opacity-50"></i>
                        <div class="absolute top-2 left-2">
                          <span class="px-3 py-1 bg-white text-red-800 rounded-full text-xs font-semibold shadow-md">
                            <i class="fas fa-heart mr-1"></i>BEST
                          </span>
                        </div>
                      </div>
                    `}
                    <div class="p-4 flex flex-col" style="min-height: 160px;">
                      <h4 class="font-bold text-base mb-2 line-clamp-2 hover:text-purple-600 transition" style="height: 48px; overflow: hidden;">${r.campaign_title}</h4>
                      <div class="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span class="truncate flex-1 mr-2"><i class="fas fa-user-circle mr-1"></i>${r.influencer_nickname}</span>
                        <span class="text-xs whitespace-nowrap">${new Date(r.submitted_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      ${r.post_url ? `
                        <a href="${r.post_url}" target="_blank" rel="noopener noreferrer" 
                           class="block w-full bg-red-600 text-white text-center py-2 rounded-lg hover:bg-red-700 transition text-sm mt-auto"
                           onclick="event.stopPropagation()">
                          <i class="fas fa-external-link-alt mr-1"></i>리뷰 보기
                        </a>
                      ` : ''}
                    </div>
                  </div>
                  `;
                }).join('') : `
                  <div class="w-full text-center py-16">
                    <i class="fas fa-comment-dots text-6xl text-gray-300 mb-4"></i>
                    <p class="text-xl text-gray-500 mb-2">베스트 리뷰를 기다리고 있어요</p>
                    <p class="text-sm text-gray-400">인플루언서들의 멋진 콘텐츠가 곧 이곳에 표시됩니다!</p>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Section -->
        <div class="py-8 sm:py-12 bg-gradient-to-r from-purple-600 to-blue-500">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div class="text-center text-white">
                <div class="text-3xl sm:text-4xl font-bold mb-2">${ongoingCampaigns.length}</div>
                <div class="text-sm sm:text-base opacity-90">진행중인 캠페인</div>
              </div>
              <div class="text-center text-white">
                <div class="text-3xl sm:text-4xl font-bold mb-2">${bestCampaigns.length}</div>
                <div class="text-sm sm:text-base opacity-90">인기 캠페인</div>
              </div>
              <div class="text-center text-white">
                <div class="text-3xl sm:text-4xl font-bold mb-2">1,000+</div>
                <div class="text-sm sm:text-base opacity-90">활동 인플루언서</div>
              </div>
              <div class="text-center text-white">
                <div class="text-3xl sm:text-4xl font-bold mb-2">100+</div>
                <div class="text-sm sm:text-base opacity-90">협력 브랜드</div>
              </div>
            </div>
          </div>
        </div>

        ${UIUtils.renderBottomNav(this.user, 'home')}
        ${this.renderFooter()}
      </div>
    `;
    
    // 히어로 슬라이더 초기화
    this.initHeroSlider();
  }

  // 뒤로가기
  goBack() {
    // 현재 상태 확인
    const currentState = window.history.state;
    
    // 로그인이나 회원가입 페이지에서는 무조건 홈으로
    if (currentState && (currentState.page === 'login' || currentState.page === 'register')) {
      this.showHome();
      return;
    }
    
    // 그 외의 경우 히스토리 back
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.showHome();
    }
  }

  // 검색창 토글
  toggleSearch() {
    const searchBox = document.getElementById('searchBox');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBox) {
      if (searchBox.classList.contains('hidden')) {
        searchBox.classList.remove('hidden');
        setTimeout(() => searchInput?.focus(), 100);
      } else {
        searchBox.classList.add('hidden');
        if (searchInput) searchInput.value = '';
      }
    }
  }

  // 좋아요 체크
  isFavorite(campaignId) {
    const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns') || '[]');
    return favorites.includes(campaignId);
  }

  // 좋아요 토글
  toggleFavorite(campaignId) {
    let favorites = JSON.parse(localStorage.getItem('favoriteCampaigns') || '[]');
    const btn = document.getElementById(`favoriteBtn-${campaignId}`);
    
    if (favorites.includes(campaignId)) {
      // 좋아요 제거
      favorites = favorites.filter(id => id !== campaignId);
      if (btn) {
        btn.innerHTML = '<i class="far fa-heart text-gray-400"></i>';
      }
    } else {
      // 좋아요 추가
      favorites.push(campaignId);
      if (btn) {
        btn.innerHTML = '<i class="fas fa-heart text-red-500"></i>';
      }
    }
    
    localStorage.setItem('favoriteCampaigns', JSON.stringify(favorites));
  }

  // 검색 기능
  async searchCampaigns(keyword) {
    if (!keyword || keyword.trim() === '') {
      this.showHome();
      return;
    }
    
    try {
      const response = await axios.get('/api/campaigns', this.getAuthHeaders());
      const campaigns = response.data.filter(c => 
        c.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(keyword.toLowerCase()))
      );
      
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
              <h2 class="text-2xl font-bold mb-4">검색 결과: "${keyword}"</h2>
              <p class="text-gray-600 mb-6">${campaigns.length}개의 캠페인을 찾았습니다</p>
              
              ${campaigns.length === 0 ? `
                <div class="text-center py-12">
                  <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                  <p class="text-gray-600">검색 결과가 없습니다</p>
                </div>
              ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  ${campaigns.map(c => `
                    <div onclick="app.viewCampaignDetail(${c.id})" class="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer">
                      ${c.thumbnail_image ? `
                        <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-48 object-cover">
                      ` : `
                        <div class="w-full h-48 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                          <i class="fas fa-image text-white text-6xl opacity-50"></i>
                        </div>
                      `}
                      <div class="p-4 flex flex-col" style="height: 180px;">
                        <h3 class="font-bold text-base mb-2 line-clamp-1">${c.title}</h3>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2" style="height: 40px;">${c.description || ''}</p>
                        <div class="bg-purple-50 px-3 py-2 rounded-lg" style="height: 32px;">
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700"><i class="fas fa-coins mr-1"></i>포인트</span>
                            <span class="font-bold text-purple-600">${c.point_reward > 0 ? c.point_reward.toLocaleString() + ' P' : '-'}</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between pt-2 border-t mt-auto">
                          <span>${channelIcon}</span>
                          <span class="text-sm text-gray-600"><i class="fas fa-users mr-1"></i><span class="font-semibold text-purple-600">${c.application_count || 0}</span>/${c.slots}명</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
          
          ${bottomNavHtml}
          ${footerHtml}
        </div>
      `;
    } catch (error) {
      console.error('Search error:', error);
      alert('검색 중 오류가 발생했습니다');
    }
  }

  // 베스트 캠페인
  async showBestCampaigns() {
    try {
      const response = await axios.get('/api/campaigns?type=best', this.getAuthHeaders());
      const campaigns = response.data;
      
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow pt-6 pb-20">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <h2 class="text-2xl font-bold mb-2">
                <i class="fas fa-crown text-yellow-500 mr-2"></i>베스트 캠페인
              </h2>
              <p class="text-gray-600 mb-6">지원자가 많은 인기 캠페인을 확인하세요</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${campaigns.map((c, idx) => `
                  <div onclick="app.viewCampaignDetail(${c.id})" class="bg-white border-2 border-yellow-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer relative">
                    <div class="absolute top-2 left-2 z-10">
                      <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold shadow">
                        <i class="fas fa-crown mr-1"></i>Top ${idx + 1}
                      </span>
                    </div>
                    ${c.thumbnail_image ? `
                      <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-48 object-cover">
                    ` : `
                      <div class="w-full h-48 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <i class="fas fa-trophy text-white text-6xl opacity-50"></i>
                      </div>
                    `}
                    <div class="p-4 flex flex-col" style="min-height: 220px;">
                      <h3 class="font-bold text-base mb-2 line-clamp-1">${c.title}</h3>
                      <p class="text-gray-600 text-sm mb-3 line-clamp-2" style="height: 40px;">${c.description || ''}</p>
                      
                      <!-- 과금 방식 정보 -->
                      <div class="bg-purple-50 px-3 py-2 rounded-lg mb-2 space-y-1">
                        ${c.pricing_type === 'points_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">포인트만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'purchase_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">구매 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">구매금</span>
                            <span class="font-bold text-orange-600">${c.product_value ? c.product_value.toLocaleString() + '원' : '-'}</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'product_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">상품 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">상품</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'voucher_with_points' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">이용권 + 포인트</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">이용권</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points || c.point_reward).toLocaleString()} P</span>
                          </div>
                        ` : c.pricing_type === 'product_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">상품만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">상품</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-gray-500">- P</span>
                          </div>
                        ` : c.pricing_type === 'voucher_only' ? `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-purple-700 font-semibold">이용권만</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">이용권</span>
                            <span class="font-bold text-green-600">제공</span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-gray-500">- P</span>
                          </div>
                        ` : `
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-600">포인트</span>
                            <span class="font-bold text-purple-600">${(c.sphere_points > 0 || c.point_reward > 0) ? (c.sphere_points || c.point_reward).toLocaleString() + ' P' : '- P'}</span>
                          </div>
                        `}
                      </div>
                      
                      <div class="pt-2 border-t mt-auto flex items-center justify-between">
                        <span class="text-xs text-gray-500">지원 현황</span>
                        <span class="text-sm text-gray-600">
                          <i class="fas fa-users mr-1"></i>
                          <span class="font-semibold text-purple-600">${c.application_count || 0}</span>/${c.slots}명
                        </span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          ${UIUtils.renderBottomNav(this.user, 'best')}
          ${this.renderFooter()}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load best campaigns:', error);
    }
  }

  // 베스트 리뷰
  async showBestReviews() {
    const app = document.getElementById('app');
    
    try {
      // 베스트 리뷰 목록 가져오기
      const response = await axios.get('/api/applications/reviews/best', this.getAuthHeaders());
      const reviews = response.data;
      
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow pt-6 pb-20">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <h2 class="text-2xl font-bold mb-2">
                <i class="fas fa-star text-yellow-500 mr-2"></i>베스트 리뷰
              </h2>
              <p class="text-gray-600 mb-6">관리자가 선정한 우수한 리뷰를 확인하세요</p>
              
              ${reviews.length === 0 ? `
                <div class="text-center py-12">
                  <i class="fas fa-star text-6xl text-gray-300 mb-4"></i>
                  <p class="text-gray-600 mb-2">아직 선정된 베스트 리뷰가 없습니다</p>
                  <p class="text-sm text-gray-500">곧 멋진 리뷰들을 만나보실 수 있습니다</p>
                </div>
              ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  ${reviews.map(review => `
                    <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                      ${review.review_image ? `
                        <div class="relative h-48 bg-gray-100">
                          <img src="/api/applications/review-image/${encodeURIComponent(review.review_image)}" 
                            alt="리뷰 이미지" 
                            class="w-full h-full object-cover"
                            onerror="this.parentElement.style.display='none'">
                          <div class="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            <i class="fas fa-star mr-1"></i>BEST
                          </div>
                        </div>
                      ` : ''}
                      
                      <div class="p-4">
                        <div class="flex items-center gap-2 mb-2">
                          ${review.campaign_thumbnail ? `
                            <img src="${review.campaign_thumbnail}" alt="캠페인" class="w-8 h-8 rounded-full object-cover">
                          ` : ''}
                          <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-sm text-gray-800 truncate">${review.campaign_title}</h3>
                            <p class="text-xs text-gray-500">${review.influencer_nickname}</p>
                          </div>
                        </div>
                        
                        <p class="text-sm text-gray-700 mb-3 line-clamp-3">${review.review_text || ''}</p>
                        
                        ${review.post_url ? `
                          <a href="${review.post_url}" target="_blank" 
                            class="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm">
                            <i class="fas fa-external-link-alt mr-1"></i>게시물 보기
                          </a>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
          
          ${UIUtils.renderBottomNav(this.user, 'reviews')}
          ${this.renderFooter()}
        </div>
      `;
    } catch (error) {
      console.error('Load best reviews error:', error);
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow pt-6 pb-20">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <h2 class="text-2xl font-bold mb-2">
                <i class="fas fa-star text-yellow-500 mr-2"></i>베스트 리뷰
              </h2>
              <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-6xl text-red-300 mb-4"></i>
                <p class="text-red-600 mb-2">베스트 리뷰를 불러오는데 실패했습니다</p>
                <button onclick="app.showBestReviews()" class="text-blue-600 hover:underline text-sm">
                  다시 시도
                </button>
              </div>
            </div>
          </div>
          
          ${UIUtils.renderBottomNav(this.user, 'reviews')}
          ${this.renderFooter()}
        </div>
      `;
    }
  }

  showLogin(pushHistory = true) {
    if (pushHistory) {
      this.pushHistory('login');
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <div class="flex-grow bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center px-4 py-12">
          <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div class="text-center mb-8">
              <img src="/static/logo.png" alt="R.SPHERE" class="h-24 sm:h-28 mx-auto mb-4">
              <p class="text-gray-600 text-lg font-semibold">로그인</p>
            </div>

            <!-- 로그인 에러 메시지 -->
            <div id="loginError" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-600 text-sm flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span id="loginErrorMessage"></span>
              </p>
            </div>

            <form id="loginForm" onsubmit="event.preventDefault(); app.handleLogin();">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                  <input type="email" id="loginEmail" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                  <input type="password" id="loginPassword" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                </div>

                <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                  로그인
                </button>
              </div>
            </form>

            <div class="mt-6 text-center space-y-2">
              <button onclick="app.showForgotPassword()" class="text-purple-600 hover:underline text-sm">
                비밀번호를 잊으셨나요?
              </button>
              <div class="text-gray-600 text-sm">
                계정이 없으신가요? <button onclick="app.showRegister(null, false)" class="text-purple-600 hover:underline font-semibold">회원가입</button>
              </div>
              <button onclick="window.history.back();" class="text-gray-500 hover:text-gray-700 text-sm">
                <i class="fas fa-arrow-left mr-1"></i>뒤로가기
              </button>
            </div>
          </div>
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  showRegister(preselectedRole = null, pushHistory = true) {
    if (pushHistory) {
      this.pushHistory('register');
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <div class="flex-grow bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center px-4 py-12">
          <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div class="text-center mb-8">
              <img src="/static/logo.png" alt="R.SPHERE" class="h-24 sm:h-28 mx-auto mb-4">
              <p class="text-gray-600 text-lg font-semibold">회원가입</p>
            </div>

            <form id="registerForm" onsubmit="event.preventDefault(); app.handleRegister();">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                  <input type="email" id="registerEmail" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                  <input type="text" id="registerNickname" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 (최소 8자)</label>
                  <input type="password" id="registerPassword" required minlength="8"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                  <input type="password" id="registerPasswordConfirm" required minlength="8"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                  <p id="passwordMatchError" class="text-red-500 text-xs mt-1 hidden">비밀번호가 일치하지 않습니다</p>
                  <p id="passwordMatchSuccess" class="text-green-500 text-xs mt-1 hidden">비밀번호가 일치합니다</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">역할</label>
                  <select id="registerRole" required ${preselectedRole ? 'disabled' : ''}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                    <option value="">선택하세요</option>
                    <option value="advertiser" ${preselectedRole === 'advertiser' ? 'selected' : ''}>광고주</option>
                    <option value="agency" ${preselectedRole === 'agency' ? 'selected' : ''}>대행사</option>
                    <option value="rep" ${preselectedRole === 'rep' ? 'selected' : ''}>렙사</option>
                    <option value="influencer" ${preselectedRole === 'influencer' ? 'selected' : ''}>인플루언서</option>
                  </select>
                  ${preselectedRole ? `<input type="hidden" id="registerRoleHidden" value="${preselectedRole}">` : ''}
                </div>

                <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                  회원가입
                </button>
              </div>
            </form>

            <div class="mt-6 text-center space-y-2">
              <div class="text-gray-600 text-sm">
                이미 계정이 있으신가요? <button onclick="app.showLogin(false)" class="text-purple-600 hover:underline font-semibold">로그인</button>
              </div>
              <button onclick="window.history.back();" class="text-gray-500 hover:text-gray-700 text-sm">
                <i class="fas fa-arrow-left mr-1"></i>뒤로가기
              </button>
            </div>
          </div>
        </div>
        ${this.renderFooter()}
      </div>
    `;
    
    // Add real-time password confirmation validation
    setTimeout(() => {
      const password = document.getElementById('registerPassword');
      const passwordConfirm = document.getElementById('registerPasswordConfirm');
      const errorElement = document.getElementById('passwordMatchError');
      const successElement = document.getElementById('passwordMatchSuccess');
      
      const checkPasswordMatch = () => {
        if (passwordConfirm.value.length > 0) {
          if (password.value !== passwordConfirm.value) {
            errorElement.classList.remove('hidden');
            successElement.classList.add('hidden');
            passwordConfirm.classList.add('border-red-500');
            passwordConfirm.classList.remove('border-green-500');
          } else {
            errorElement.classList.add('hidden');
            successElement.classList.remove('hidden');
            passwordConfirm.classList.remove('border-red-500');
            passwordConfirm.classList.add('border-green-500');
          }
        } else {
          errorElement.classList.add('hidden');
          successElement.classList.add('hidden');
          passwordConfirm.classList.remove('border-red-500');
          passwordConfirm.classList.remove('border-green-500');
        }
      };
      
      passwordConfirm?.addEventListener('input', checkPasswordMatch);
      password?.addEventListener('input', checkPasswordMatch);
    }, 0);
  }

  showRegisterWithRole(role) {
    this.showRegister(role);
  }

  async viewCampaignDetail(campaignId, pushHistory = true) {
    // 로그인 체크 - 로그인하지 않았으면 리턴 URL 저장 후 바로 로그인 페이지로 이동
    if (!this.token || !this.user) {
      // 현재 캠페인 ID를 저장하여 로그인 후 돌아올 수 있도록 함
      localStorage.setItem('returnUrl', `campaign:${campaignId}`);
      // 히스토리에 campaignDetail을 추가하지 않고 바로 로그인 페이지로
      this.showLogin();
      return;
    }
    
    if (pushHistory) {
      this.pushHistory('campaignDetail', { id: campaignId });
    }
    
    try {
      const response = await axios.get(`/api/campaigns/${campaignId}`, this.getAuthHeaders());
      const campaign = response.data;
      
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow">
            <div class="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
              <!-- 로고 -->
              <div class="mb-4 flex items-center justify-between">
                <button onclick="app.goBack()" class="text-purple-600 hover:text-purple-800 flex items-center">
                  <i class="fas fa-arrow-left mr-2"></i>뒤로가기
                </button>
                <div class="text-2xl font-bold text-purple-600">
                  리뷰스피어
                </div>
              </div>
              
              <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <!-- 썸네일/상세 이미지 -->
                ${campaign.thumbnail_image ? `
                  <div class="w-full bg-gray-100">
                    <img src="${campaign.thumbnail_image}" alt="${campaign.title}" class="w-full max-h-[500px] object-contain">
                  </div>
                ` : `
                  <div class="w-full h-64 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                    <i class="fas fa-image text-white text-6xl opacity-50"></i>
                  </div>
                `}
                
                <div class="p-6 sm:p-8">
                  <!-- 상태와 모집인원 -->
                  <div class="flex items-center justify-between mb-4">
                    <span class="px-4 py-2 rounded-full text-sm font-semibold ${this.getStatusBadge(campaign.status, campaign)}">
                      ${this.getStatusText(campaign.status, campaign)}
                    </span>
                    <span class="text-gray-500">
                      <i class="fas fa-users mr-1"></i>${campaign.slots || 1}명 모집
                    </span>
                  </div>
                  
                  <!-- 제목과 좋아요 버튼 -->
                  <div class="flex items-start justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-800 flex-1">${campaign.title}</h1>
                    <button 
                      onclick="app.toggleFavorite(${campaign.id})" 
                      class="ml-4 text-3xl transition-transform hover:scale-110 flex-shrink-0"
                      id="favoriteBtn-${campaign.id}"
                    >
                      ${this.isFavorite(campaign.id) ? 
                        '<i class="fas fa-heart text-red-500"></i>' : 
                        '<i class="far fa-heart text-gray-400"></i>'
                      }
                    </button>
                  </div>
                  
                  <!-- 채널 타입 -->
                  ${campaign.channel_type ? `
                    <div class="mb-6">
                      <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                        campaign.channel_type === 'instagram' ? 'bg-pink-100 text-pink-800' :
                        campaign.channel_type === 'blog' ? 'bg-green-100 text-green-800' :
                        campaign.channel_type === 'youtube' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }">
                        <i class="fab fa-${campaign.channel_type} mr-2"></i>
                        ${campaign.channel_type === 'instagram' ? '인스타그램' :
                          campaign.channel_type === 'blog' ? '블로그' :
                          campaign.channel_type === 'youtube' ? '유튜브' : campaign.channel_type}
                      </span>
                    </div>
                  ` : ''}
                  
                  <!-- 설명 -->
                  <div class="mb-8">
                    <h2 class="text-xl font-bold text-gray-800 mb-3">
                      <i class="fas fa-file-alt mr-2"></i>캠페인 설명
                    </h2>
                    <div class="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg text-left leading-relaxed">
                      ${campaign.description || '캠페인 설명이 없습니다.'}
                    </div>
                  </div>
                  
                  <!-- 미션 -->
                  ${campaign.mission ? `
                    <div class="mb-8">
                      <h2 class="text-xl font-bold text-gray-800 mb-3">
                        <i class="fas fa-bullseye mr-2"></i>미션
                      </h2>
                      <div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                        <div class="text-orange-900 space-y-2">
                          ${campaign.mission.split('\n').filter(line => line.trim()).map((line, index) => `
                            <div class="flex">
                              <span class="font-bold mr-2 flex-shrink-0">${index + 1}.</span>
                              <span>${line.trim()}</span>
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    </div>
                  ` : ''}
                  
                  <!-- 키워드 -->
                  ${campaign.keywords ? `
                    <div class="mb-8">
                      <h2 class="text-xl font-bold text-gray-800 mb-3">
                        <i class="fas fa-tags mr-2"></i>필수 키워드
                      </h2>
                      <div class="flex flex-wrap gap-2">
                        ${campaign.keywords.split(',').map(keyword => `
                          <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                            #${keyword.trim()}
                          </span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                  
                  <!-- 제공 내역 -->
                  ${campaign.provided_items ? `
                    <div class="mb-8">
                      <h2 class="text-xl font-bold text-gray-800 mb-3">
                        <i class="fas fa-gift mr-2"></i>제공 내역
                      </h2>
                      <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                        <p class="text-green-900 whitespace-pre-wrap">${campaign.provided_items}</p>
                      </div>
                    </div>
                  ` : ''}
                  
                  <!-- 요구사항/가이드라인 -->
                  ${campaign.requirements ? `
                    <div class="mb-8">
                      <h2 class="text-xl font-bold text-gray-800 mb-3">
                        <i class="fas fa-list-check mr-2"></i>요구사항
                      </h2>
                      <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <p class="text-blue-900 whitespace-pre-wrap">${campaign.requirements}</p>
                      </div>
                    </div>
                  ` : ''}
                  
                  <!-- 유의사항 -->
                  ${campaign.notes ? `
                    <div class="mb-8">
                      <h2 class="text-xl font-bold text-gray-800 mb-3">
                        <i class="fas fa-exclamation-triangle mr-2"></i>유의사항
                      </h2>
                      <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                        <p class="text-red-900 whitespace-pre-wrap">${campaign.notes}</p>
                      </div>
                    </div>
                  ` : ''}
                  
                  <!-- 기본 정보 그리드 -->
                  <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                    ${campaign.product_name ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">제품명</span>
                        <p class="font-semibold">${campaign.product_name}</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.budget ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">판매가</span>
                        <p class="font-semibold text-purple-600">${campaign.budget.toLocaleString()}원</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.pricing_type ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">과금 방식</span>
                        <p class="font-semibold">${
                          campaign.pricing_type === 'points_only' ? '포인트만 제공' :
                          campaign.pricing_type === 'product_only' ? '상품만 제공' :
                          campaign.pricing_type === 'product_with_points' ? '상품 + 포인트' :
                          campaign.pricing_type === 'purchase_with_points' ? '구매 + 포인트' :
                          campaign.pricing_type === 'voucher_only' ? '이용권만 제공' :
                          campaign.pricing_type === 'voucher_with_points' ? '이용권 + 포인트' :
                          '상품만 제공'
                        }</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.product_value > 0 ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">상품/이용권 가치</span>
                        <p class="font-semibold text-green-600">${campaign.product_value.toLocaleString()}원</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.application_start_date ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">모집 시작일</span>
                        <p class="font-semibold">${campaign.application_start_date}</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.application_end_date ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">모집 종료일</span>
                        <p class="font-semibold">${campaign.application_end_date}</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.announcement_date ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">인플루언서 선정 발표일</span>
                        <p class="font-semibold">${campaign.announcement_date}</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.content_start_date ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">컨텐츠 등록 시작일</span>
                        <p class="font-semibold">${campaign.content_start_date}</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.content_end_date ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">컨텐츠 등록 종료일</span>
                        <p class="font-semibold">${campaign.content_end_date}</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.result_announcement_date ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">결과 발표일</span>
                        <p class="font-semibold">${campaign.result_announcement_date}</p>
                      </div>
                    ` : ''}
                  </div>
                  
                  <!-- 채널별 링크 정보 -->
                  ${campaign.instagram_mention_account || campaign.blog_product_url || campaign.youtube_purchase_link ? `
                    <div class="mb-8">
                      <h2 class="text-xl font-bold text-gray-800 mb-3">
                        <i class="fas fa-link mr-2"></i>링크 정보
                      </h2>
                      <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                        ${campaign.instagram_mention_account ? `
                          <div>
                            <span class="text-sm text-gray-500">인스타그램 멘션 계정</span>
                            <p class="font-semibold text-pink-600">${campaign.instagram_mention_account.startsWith('@') ? campaign.instagram_mention_account : '@' + campaign.instagram_mention_account}</p>
                          </div>
                        ` : ''}
                        ${campaign.blog_product_url ? `
                          <div>
                            <span class="text-sm text-gray-500">블로그 상품 URL</span>
                            <p class="font-semibold">
                              <a href="${campaign.blog_product_url}" target="_blank" class="text-green-600 hover:text-green-800">
                                ${campaign.blog_product_url}
                                <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                              </a>
                            </p>
                          </div>
                        ` : ''}
                        ${campaign.youtube_purchase_link ? `
                          <div>
                            <span class="text-sm text-gray-500">유튜브 구매 링크</span>
                            <p class="font-semibold">
                              <a href="${campaign.youtube_purchase_link}" target="_blank" class="text-red-600 hover:text-red-800">
                                ${campaign.youtube_purchase_link}
                                <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                              </a>
                            </p>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${campaign.product_url ? `
                    <div class="mb-8">
                      <a href="${campaign.product_url}" target="_blank" class="inline-flex items-center text-purple-600 hover:text-purple-800 font-semibold">
                        <i class="fas fa-external-link-alt mr-2"></i>제품 페이지 바로가기
                      </a>
                    </div>
                  ` : ''}
                  
                  <!-- 포인트 보상 -->
                  ${(campaign.sphere_points > 0 || campaign.point_reward > 0) ? `
                    <div class="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg mb-8 border-2 border-yellow-300">
                      <h3 class="font-semibold text-orange-900 mb-4 flex items-center text-lg">
                        <i class="fas fa-coins text-yellow-600 mr-2"></i>스피어포인트 보상
                      </h3>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <span class="text-sm text-orange-700">인당 지급</span>
                          <p class="text-2xl font-bold text-orange-600">${(campaign.sphere_points || campaign.point_reward).toLocaleString()} P</p>
                        </div>
                        <div>
                          <span class="text-sm text-orange-700">총 포인트</span>
                          <p class="text-2xl font-bold text-orange-600">${((campaign.sphere_points || campaign.point_reward) * campaign.slots).toLocaleString()} P</p>
                        </div>
                      </div>
                      <p class="text-xs text-orange-700 mt-4">
                        <i class="fas fa-info-circle mr-1"></i>리뷰 승인 후 자동으로 지급됩니다 (1P = 1원)
                      </p>
                    </div>
                  ` : ''}
                  
                  <!-- 지원하기 버튼 -->
                  <div class="mt-8">
                    ${campaign.status === 'pending' ? `
                      <div class="w-full bg-blue-100 border-2 border-blue-300 text-blue-800 py-4 rounded-lg text-lg font-bold text-center">
                        <i class="fas fa-hourglass-half mr-2"></i>관리자 승인 대기중
                      </div>
                      <p class="text-sm text-blue-600 text-center mt-2">
                        <i class="fas fa-info-circle mr-1"></i>승인 후 곧 모집이 시작됩니다!
                      </p>
                    ` : campaign.status === 'recruiting' && campaign.payment_status === 'unpaid' ? `
                      <div class="w-full bg-orange-100 border-2 border-orange-300 text-orange-800 py-4 rounded-lg text-lg font-bold text-center">
                        <i class="fas fa-credit-card mr-2"></i>결제 대기중
                      </div>
                      <p class="text-sm text-orange-600 text-center mt-2">
                        <i class="fas fa-info-circle mr-1"></i>광고주의 결제 완료 후 지원 가능합니다!
                      </p>
                    ` : campaign.payment_status === 'paid' && (campaign.status === 'recruiting' || campaign.status === 'in_progress') ? `
                      ${this.user?.role === 'influencer' ? `
                        ${campaign.has_applied ? `
                          <div class="w-full bg-gray-400 text-white py-4 rounded-lg text-lg font-bold text-center cursor-not-allowed">
                            <i class="fas fa-check-circle mr-2"></i>지원 완료
                          </div>
                          <p class="text-sm text-gray-500 text-center mt-2">이미 지원한 캠페인입니다</p>
                        ` : campaign.can_apply === false ? `
                          <div class="w-full bg-gray-400 text-white py-4 rounded-lg text-lg font-bold text-center cursor-not-allowed">
                            <i class="fas fa-calendar-times mr-2"></i>신청 기간이 아닙니다
                          </div>
                          <p class="text-sm text-gray-500 text-center mt-2">
                            ${campaign.application_start_date ? `신청 기간: ${campaign.application_start_date} ~ ${campaign.application_end_date || '미정'}` : '신청 기간이 설정되지 않았습니다'}
                          </p>
                        ` : `
                          <button onclick="app.applyCampaign(${campaign.id})" class="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-purple-700 transition shadow-lg">
                            <i class="fas fa-paper-plane mr-2"></i>이 캠페인에 지원하기
                          </button>
                          <p class="text-sm text-gray-500 text-center mt-2">지원 후 광고주가 확인하면 알림을 받으실 수 있습니다</p>
                        `}
                      ` : !this.user ? `
                        <button onclick="app.applyCampaign(${campaign.id})" class="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-purple-700 transition shadow-lg">
                          <i class="fas fa-paper-plane mr-2"></i>이 캠페인에 지원하기
                        </button>
                        <p class="text-sm text-gray-500 text-center mt-2">지원하려면 인플루언서 계정으로 로그인해주세요</p>
                      ` : `
                        <div class="w-full bg-gray-300 text-gray-600 py-4 rounded-lg text-lg font-bold text-center">
                          <i class="fas fa-info-circle mr-2"></i>인플루언서만 지원 가능합니다
                        </div>
                      `}
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          ${this.renderFooter()}
        </div>
      `;
    } catch (error) {
      // 401 에러면 토큰 만료 또는 유효하지 않음 - 다시 로그인
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        this.logout();
        return;
      }
      
      const errorMsg = error.response?.data?.error || error.message || '캠페인 정보를 불러오는데 실패했습니다';
      alert(`캠페인 정보를 불러오는데 실패했습니다\n\n에러: ${errorMsg}`);
      this.showHome();
    }
  }

  async applyCampaign(campaignId) {
    // 로그인 체크 - 로그인하지 않았으면 리턴 URL 저장 후 로그인 페이지로 이동
    if (!this.token || !this.user) {
      // 현재 캠페인 ID를 저장하여 로그인 후 돌아올 수 있도록 함
      localStorage.setItem('returnUrl', `campaign:${campaignId}`);
      if (confirm('캠페인에 지원하려면 로그인이 필요합니다. 로그인 하시겠습니까?')) {
        this.showLogin();
      }
      return;
    }
    
    // 인플루언서 권한 체크
    if (this.user.role !== 'influencer') {
      alert('캠페인 지원은 인플루언서만 가능합니다.');
      return;
    }
    
    const message = prompt('지원 메시지를 입력해주세요 (선택사항):');
    
    try {
      await axios.post(`/api/campaigns/${campaignId}/apply`, 
        { message }, 
        this.getAuthHeaders()
      );
      alert('캠페인에 성공적으로 지원되었습니다!');
      this.showMyPage();
    } catch (error) {
      alert(error.response?.data?.error || '지원에 실패했습니다');
    }
  }

  showForgotPassword() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <div class="flex-grow bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center px-4 py-12">
          <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-gray-800">비밀번호 찾기</h2>
              <p class="text-gray-600 mt-2">이메일로 재설정 링크를 보내드립니다</p>
            </div>

            <form id="forgotPasswordForm" onsubmit="event.preventDefault(); app.handleForgotPassword();">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                  <input type="email" id="forgotEmail" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                </div>

                <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                  재설정 링크 보내기
                </button>
              </div>
            </form>

            <div class="mt-6 text-center">
              <button onclick="app.showLogin()" class="text-gray-500 hover:text-gray-700 text-sm">
                <i class="fas fa-arrow-left mr-1"></i>로그인으로 돌아가기
              </button>
            </div>
          </div>
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  // 마이페이지
  showMyPage(pushHistory = true) {
    if (pushHistory) {
      this.pushHistory('myPage');
    }
    
    switch (this.user.role) {
      case 'advertiser':
      case 'agency':
      case 'rep':
        this.showAdvertiserMyPage();
        break;
      case 'influencer':
        this.showInfluencerMyPage();
        break;
      case 'admin':
        this.showAdminMyPage();
        break;
    }
  }
  
  // 하위 호환성을 위해 showDashboard는 showMyPage로 리다이렉트
  showDashboard() {
    this.showMyPage();
  }

  // ============================================
  // Advertiser Dashboard
  // ============================================

  async showAdvertiserMyPage() {
    // 프로필 완성도 체크
    let profileIncomplete = false;
    let profileData = null;
    try {
      const response = await axios.get('/api/profile/advertiser', this.getAuthHeaders());
      profileData = response.data;
      // 필수 항목 체크: 회사명, 사업자등록번호, 대표자명, 연락처
      if (!profileData.company_name || !profileData.business_number || 
          !profileData.representative_name || !profileData.contact_phone) {
        profileIncomplete = true;
      }
    } catch (error) {
      console.error('Failed to check profile:', error);
    }

    const app = document.getElementById('app');
    const roleTitle = this.user.role === 'advertiser' ? '광고주' : 
                      this.user.role === 'agency' ? '대행사' : '렙사';
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow pb-20">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-user-circle text-purple-600 mr-2"></i>마이페이지
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">${this.user.nickname}님 (${roleTitle})</p>
            </div>

            <!-- 아코디언 메뉴 -->
            <div class="space-y-3 mb-4 sm:mb-8">
              <!-- 프로필 관리 -->
              <div class="bg-white rounded-lg shadow ${profileIncomplete ? 'border-2 border-orange-400' : ''}">
                <button onclick="app.toggleAdvertiserAccordion('profile')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-user ${profileIncomplete ? 'text-orange-500' : 'text-purple-600'} text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg ${profileIncomplete ? 'text-orange-600' : ''}">프로필 관리 ${profileIncomplete ? '<span class="text-red-600">*</span>' : ''}</h3>
                        <p class="text-xs sm:text-sm ${profileIncomplete ? 'text-orange-600 font-semibold' : 'text-gray-600'}">
                          ${profileIncomplete ? '⚠️ 필수 정보를 입력해주세요 (세금계산서 발행용)' : '사업자 정보 관리'}
                        </p>
                      </div>
                    </div>
                    <i id="profile-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="profile-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>

              <!-- 1:1 문의 -->
              <div class="bg-white rounded-lg shadow border-2 border-blue-200">
                <button onclick="app.showContactInquiry()" class="w-full p-5 sm:p-6 text-left hover:bg-blue-50 transition">
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-envelope text-blue-600 text-xl sm:text-2xl"></i>
                    <div>
                      <h3 class="font-semibold text-base sm:text-lg text-blue-600">1:1 문의</h3>
                      <p class="text-xs sm:text-sm text-gray-600">궁금한 사항을 문의해주세요</p>
                    </div>
                  </div>
                </button>
              </div>

              <!-- 로그아웃 -->
              <div class="bg-white rounded-lg shadow border-2 border-red-200">
                <button onclick="app.logout()" class="w-full p-5 sm:p-6 text-left hover:bg-red-50 transition">
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-sign-out-alt text-red-600 text-xl sm:text-2xl"></i>
                    <div>
                      <h3 class="font-semibold text-base sm:text-lg text-red-600">로그아웃</h3>
                      <p class="text-xs sm:text-sm text-gray-600">계정에서 로그아웃</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'mypage')}
        ${this.renderFooter()}
      </div>
    `;
    
    // 프로필이 미완성이면 자동으로 프로필 열기
    if (profileIncomplete) {
      setTimeout(async () => {
        await this.toggleAdvertiserAccordion('profile');
      }, 100);
    }
  }

  async toggleAdvertiserAccordion(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const icon = document.getElementById(`${sectionId}-icon`);
    const allSections = ['profile'];
    
    const isOpen = !content.classList.contains('hidden');
    
    // 모든 섹션 닫기
    allSections.forEach(id => {
      const c = document.getElementById(`${id}-content`);
      const i = document.getElementById(`${id}-icon`);
      if (c) c.classList.add('hidden');
      if (i) i.classList.remove('rotate-180');
    });
    
    // 현재 섹션이 닫혀있었으면 열기
    if (!isOpen) {
      content.classList.remove('hidden');
      icon.classList.add('rotate-180');
      await this.loadAdvertiserAccordionContent(sectionId);
    }
  }

  async loadAdvertiserAccordionContent(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    if (!content) return;

    try {
      switch (sectionId) {
        case 'profile':
          await this.loadAdvertiserProfileContent(content);
          break;
      }
    } catch (error) {
      console.error('Failed to load accordion content:', error);
      content.innerHTML = '<p class="text-red-600 p-4">콘텐츠를 불러오는데 실패했습니다</p>';
    }
  }

  async loadAdvertiserProfileContent(container) {
    try {
      const response = await axios.get('/api/profile/advertiser', this.getAuthHeaders());
      const profile = response.data;

      container.innerHTML = `
        <div class="p-4 sm:p-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-start">
              <i class="fas fa-info-circle text-blue-600 mt-0.5 mr-3"></i>
              <div class="text-sm text-blue-800">
                <p class="font-semibold mb-1">캠페인 결제를 위한 필수 정보입니다</p>
                <p class="text-xs">• 캠페인 등록 후 입금 시 <strong>세금계산서 발행</strong>에 필요한 정보입니다</p>
                <p class="text-xs">• <span class="text-red-600">*</span> 표시는 필수 입력 항목입니다</p>
              </div>
            </div>
          </div>

          <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">사업자 정보 관리</h2>
          <form id="advertiserProfileForm" onsubmit="event.preventDefault(); app.handleUpdateAdvertiserProfile();" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                회사명 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="companyName" value="${profile.company_name || ''}" required
                placeholder="예: (주)모빈"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                사업자등록번호 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="businessNumber" value="${profile.business_number || ''}" required
                placeholder="222-88-96904"
                maxlength="12"
                oninput="this.value = UIUtils.formatBusinessNumber(this.value)"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              <p class="text-xs text-gray-500 mt-1">형식: XXX-XX-XXXXX (자동으로 하이픈이 입력됩니다)</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                대표자명 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="representativeName" value="${profile.representative_name || ''}" required
                placeholder="예: 홍길동"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">사업자 주소</label>
              <input type="text" id="businessAddress" value="${profile.business_address || ''}"
                placeholder="예: 서울시 구로구 디지털로31길 12"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  연락처 <span class="text-red-600">*</span>
                </label>
                <input type="tel" id="contactPhone" value="${profile.contact_phone || ''}" required
                  placeholder="010-1234-5678"
                  maxlength="13"
                  oninput="this.value = UIUtils.formatPhoneNumber(this.value)"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                <p class="text-xs text-gray-500 mt-1">자동으로 하이픈이 입력됩니다</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">담당자 이메일</label>
                <input type="email" id="contactEmail" value="${profile.contact_email || ''}"
                  placeholder="example@company.com"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
            </div>

            <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
              저장
            </button>
          </form>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load advertiser profile:', error);
      container.innerHTML = '<p class="text-red-600 p-4">프로필을 불러오는데 실패했습니다</p>';
    }
  }

  // ============================================
  // Admin Pages (관리자 전용 페이지)
  // ============================================

  showAdminDashboard() {
    // 관리자 홈 페이지 - 일반 사용자와 동일한 홈 화면 표시
    this.showHome();
  }

  async showAdminCampaigns() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow pb-20">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-bullhorn text-purple-600 mr-2"></i>캠페인 관리
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">전체 캠페인 승인 및 관리</p>
            </div>

            <div id="adminCampaignsContent">
              <p class="text-gray-600">로딩 중...</p>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'campaigns')}
        ${this.renderFooter()}
      </div>
    `;

    // 캠페인 목록 로드
    await this.loadAdminCampaignsPageContent();
  }

  async loadAdminCampaignsPageContent() {
    try {
      // Load system settings
      const settingsResponse = await axios.get('/api/settings');
      const settingsArray = settingsResponse.data;
      const settings = {};
      settingsArray.forEach(s => {
        settings[s.setting_key] = Number(s.setting_value);
      });
      const pointsFeeRate = (settings.points_fee_rate || 30) / 100;
      
      const response = await axios.get('/api/admin/campaigns', this.getAuthHeaders());
      const campaigns = response.data;
      const container = document.getElementById('adminCampaignsContent');
      
      console.log('=== 관리자 캠페인 관리 디버깅 ===');
      console.log('총 캠페인 수:', campaigns.length);
      if (campaigns.length > 0) {
        console.log('첫 번째 캠페인 데이터:', campaigns[0]);
        console.log('is_best 필드:', campaigns[0].is_best);
        console.log('is_best 타입:', typeof campaigns[0].is_best);
      }
      console.log('포인트 수수료율:', pointsFeeRate * 100 + '%');

      container.innerHTML = `
        <div class="space-y-3 sm:space-y-4">
          ${campaigns.length === 0 ? '<p class="text-gray-600">등록된 캠페인이 없습니다</p>' : ''}
          ${campaigns.map(c => {
            const channelIcon = UIUtils.getChannelIcon(c.channel_type);
            
            return `
            <div class="border rounded-lg p-3 sm:p-4 bg-white">
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-base sm:text-lg text-blue-600 hover:text-blue-800 cursor-pointer" onclick="app.editCampaignAsAdmin(${c.id})">
                      <i class="fas fa-edit mr-1"></i>${c.title}
                    </h3>
                    <span>${channelIcon}</span>
                  </div>
                  <p class="text-xs sm:text-sm text-gray-600">광고주: ${c.advertiser_nickname} (${c.advertiser_email})</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs sm:text-sm ${this.getStatusBadge(c.status, c)} whitespace-nowrap self-start">
                  ${this.getStatusText(c.status, c)}
                </span>
              </div>

              <p class="text-sm sm:text-base text-gray-600 mb-2">${c.description || ''}</p>
              
              <div class="bg-blue-50 border border-blue-200 rounded p-2 sm:p-3 mb-2 text-xs sm:text-sm">
                <div class="grid grid-cols-2 gap-2">
                  ${c.product_value > 0 ? `
                    <div>
                      <p class="text-gray-600">상품/이용권 가치</p>
                      <p class="font-semibold text-base sm:text-lg">${c.product_value.toLocaleString()}원</p>
                    </div>
                  ` : ''}
                  ${c.sphere_points > 0 || c.point_reward > 0 ? `
                    <div>
                      <p class="text-gray-600">인당 포인트</p>
                      <p class="font-semibold text-base sm:text-lg">${(c.sphere_points || c.point_reward).toLocaleString()}P</p>
                    </div>
                  ` : ''}
                  ${c.sphere_points > 0 || c.point_reward > 0 ? `
                    <div>
                      <p class="text-gray-600">총 포인트</p>
                      <p class="font-semibold text-base sm:text-lg">${((c.sphere_points || c.point_reward) * c.slots).toLocaleString()}P</p>
                    </div>
                  ` : ''}
                  ${c.sphere_points > 0 || c.point_reward > 0 ? `
                    <div>
                      <p class="text-gray-600">포인트 수수료 (${Math.round(pointsFeeRate * 100)}%)</p>
                      <p class="font-semibold text-base sm:text-lg">${(((c.sphere_points || c.point_reward) * c.slots) * pointsFeeRate).toLocaleString()}원</p>
                    </div>
                  ` : ''}
                  <div>
                    <p class="text-gray-600">과금 방식</p>
                    <p class="font-semibold">${c.pricing_type === 'points_only' ? '포인트만' : c.pricing_type === 'purchase_with_points' ? '구매+포인트' : c.pricing_type === 'product_only' ? '상품만' : c.pricing_type === 'product_with_points' ? '상품+포인트' : c.pricing_type === 'voucher_only' ? '이용권만' : c.pricing_type === 'voucher_with_points' ? '이용권+포인트' : '상품만'}</p>
                  </div>
                  <div>
                    <p class="text-gray-600">결제 상태</p>
                    <p>
                      <span class="px-2 py-1 rounded text-xs font-semibold ${c.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${c.payment_status === 'paid' ? '✓ 결제 완료' : '⏳ 결제 대기'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-wrap gap-2 mt-3">
                ${c.status === 'pending' || c.status === 'cancelled' ? `
                  <button onclick="app.updateCampaignStatus(${c.id}, 'recruiting')" 
                    class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs sm:text-sm">
                    <i class="fas fa-check mr-1"></i>승인
                  </button>
                ` : c.status === 'recruiting' || c.status === 'approved' ? `
                  <button onclick="app.updateCampaignStatus(${c.id}, 'pending')" 
                    class="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 text-xs sm:text-sm">
                    <i class="fas fa-undo mr-1"></i>승인취소
                  </button>
                ` : ''}
                ${(c.status === 'recruiting' || c.status === 'in_progress') && c.payment_status === 'unpaid' ? `
                  <button onclick="app.markAsPaid(${c.id})" 
                    class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs sm:text-sm">
                    <i class="fas fa-credit-card mr-1"></i>결제 완료 처리
                  </button>
                ` : ''}
                ${(() => {
                  const actualStatus = UIUtils.calculateCampaignStatus(c);
                  
                  // 완료된 캠페인은 일시중지/취소 불가
                  if (actualStatus === 'completed') {
                    return `
                      <span class="text-gray-500 text-xs sm:text-sm">
                        <i class="fas fa-check-circle mr-1"></i>완료된 캠페인
                      </span>
                    `;
                  }
                  
                  // 일시중지 버튼 (recruiting, in_progress만)
                  let buttons = '';
                  if (c.status === 'recruiting' || c.status === 'in_progress') {
                    buttons += `
                      <button onclick="app.updateCampaignStatus(${c.id}, 'suspended')" 
                        class="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 text-xs sm:text-sm">
                        <i class="fas fa-pause mr-1"></i>일시중지
                      </button>
                    `;
                  }
                  
                  // 재개 버튼 (suspended만)
                  if (c.status === 'suspended') {
                    buttons += `
                      <button onclick="app.updateCampaignStatus(${c.id}, 'recruiting')" 
                        class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs sm:text-sm">
                        <i class="fas fa-play mr-1"></i>재개
                      </button>
                    `;
                  }
                  
                  // 취소 버튼 (completed 아닌 경우만)
                  buttons += `
                    <button onclick="app.updateCampaignStatus(${c.id}, 'cancelled')" 
                      class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs sm:text-sm">
                      <i class="fas fa-ban mr-1"></i>취소
                    </button>
                  `;
                  
                  return buttons;
                })()}
                <!-- 베스트 설정 버튼 (항상 표시) -->
                <button onclick="app.toggleBestCampaign(${c.id}, ${c.is_best ? 'false' : 'true'})" 
                  class="${c.is_best ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-3 py-1 rounded text-xs sm:text-sm"
                  data-campaign-id="${c.id}" data-is-best="${c.is_best}">
                  <i class="fas fa-star mr-1"></i>${c.is_best ? '베스트 해제' : '베스트 설정'}
                </button>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load admin campaigns:', error);
      const container = document.getElementById('adminCampaignsContent');
      container.innerHTML = '<p class="text-red-600 p-4">캠페인 목록을 불러오는데 실패했습니다</p>';
    }
  }

  async showAdminReviews() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow pb-20">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-star text-purple-600 mr-2"></i>리뷰 관리
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">전체 리뷰 승인 및 베스트 리뷰 선정</p>
            </div>

            <div id="adminReviewsContent">
              <p class="text-gray-600">로딩 중...</p>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'reviews')}
        ${this.renderFooter()}
      </div>
    `;

    // 리뷰 목록 로드
    await this.loadAdminReviewsContent();
  }

  async loadAdminReviewsContent() {
    try {
      // 모든 캠페인의 리뷰 가져오기
      const response = await axios.get('/api/admin/reviews', this.getAuthHeaders());
      const reviews = response.data;
      const container = document.getElementById('adminReviewsContent');

      if (reviews.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 sm:py-12">
            <i class="fas fa-inbox text-4xl sm:text-6xl text-gray-300 mb-4"></i>
            <p class="text-sm sm:text-base text-gray-600 mb-2">제출된 리뷰가 없습니다</p>
            <p class="text-xs sm:text-sm text-gray-500">인플루언서가 리뷰를 제출하면 여기에 표시됩니다</p>
          </div>
        `;
        return;
      }

      // 캠페인별로 그룹화
      const reviewsByCampaign = {};
      reviews.forEach(review => {
        if (!reviewsByCampaign[review.campaign_id]) {
          reviewsByCampaign[review.campaign_id] = {
            campaign_title: review.campaign_title,
            reviews: []
          };
        }
        reviewsByCampaign[review.campaign_id].reviews.push(review);
      });

      container.innerHTML = `
        <div class="space-y-6">
          ${Object.entries(reviewsByCampaign).map(([campaignId, data]) => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
              <button onclick="app.toggleCampaignReviews('campaign-${campaignId}')" 
                class="w-full text-left p-4 hover:bg-gray-50 transition flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <i class="fas fa-bullhorn text-purple-600 text-lg"></i>
                  <h2 class="text-xl font-bold text-gray-800">${data.campaign_title}</h2>
                  <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    ${data.reviews.length}개
                  </span>
                </div>
                <i id="campaign-${campaignId}-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
              </button>
              <div id="campaign-${campaignId}" class="hidden border-t">
                <div class="p-4 space-y-4">
                ${data.reviews.map(review => {
                  const statusBadge = review.approval_status === 'approved' 
                    ? '<span class="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>승인완료</span>'
                    : review.approval_status === 'rejected'
                    ? '<span class="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800"><i class="fas fa-times-circle mr-1"></i>거절됨</span>'
                    : '<span class="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800"><i class="fas fa-clock mr-1"></i>검토대기</span>';
                  
                  return `
                  <div class="border rounded-lg p-4 hover:shadow-md transition ${review.approval_status === 'rejected' ? 'bg-red-50' : ''}">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <p class="font-semibold text-gray-800">${review.influencer_nickname}</p>
                          ${statusBadge}
                          ${review.is_best ? '<span class="inline-block px-2 py-1 text-xs rounded bg-orange-100 text-orange-800"><i class="fas fa-star mr-1"></i>BEST</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-500">${review.influencer_email}</p>
                      </div>
                      <span class="text-xs text-gray-500">${new Date(review.submitted_at || review.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    
                    ${review.review_image ? `
                      <div class="mb-3">
                        <img src="/api/applications/review-image/${encodeURIComponent(review.review_image)}" alt="리뷰 이미지" class="w-48 h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition" onclick="window.open(this.src, '_blank')" onerror="this.style.display='none'">
                      </div>
                    ` : ''}
                    
                    <div class="mb-3">
                      <p class="text-sm text-gray-700 whitespace-pre-wrap">${review.review_text || '리뷰 내용 없음'}</p>
                    </div>
                    
                    ${review.post_url ? `
                      <div class="mb-3">
                        <a href="${review.post_url}" target="_blank" class="text-blue-600 hover:underline text-sm">
                          <i class="fas fa-external-link-alt mr-1"></i>게시물 보기
                        </a>
                      </div>
                    ` : ''}
                    
                    ${review.approval_status === 'rejected' && review.rejection_reason ? `
                      <div class="mb-3 p-3 bg-red-100 rounded-lg">
                        <p class="text-sm font-semibold text-red-800 mb-1">거절 사유:</p>
                        <p class="text-sm text-red-700">${review.rejection_reason}</p>
                      </div>
                    ` : ''}
                    
                    <div class="flex gap-2 mt-4">
                      ${review.approval_status === 'pending' ? `
                        <button onclick="app.approveReview(${review.id})" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
                          <i class="fas fa-check mr-1"></i>승인
                        </button>
                        <button onclick="app.rejectReviewWithReason(${review.id})" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                          <i class="fas fa-times mr-1"></i>거절
                        </button>
                      ` : review.approval_status === 'approved' ? `
                        <button onclick="app.cancelReviewApprovalFromAdmin(${review.id})" class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm">
                          <i class="fas fa-undo mr-1"></i>승인취소
                        </button>
                        <button onclick="app.toggleBestReviewFromAdmin(${review.id}, ${review.is_best ? 'false' : 'true'})" 
                          class="${review.is_best ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-4 py-2 rounded text-sm">
                          <i class="fas fa-star mr-1"></i>${review.is_best ? '베스트 해제' : '베스트 설정'}
                        </button>
                      ` : `
                        <button onclick="app.cancelReviewApprovalFromAdmin(${review.id})" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                          <i class="fas fa-undo mr-1"></i>거절취소
                        </button>
                      `}
                    </div>
                  </div>
                  `;
                }).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load admin reviews:', error);
      const container = document.getElementById('adminReviewsContent');
      container.innerHTML = '<p class="text-red-600 p-4">리뷰 목록을 불러오는데 실패했습니다</p>';
    }
  }

  // 캠페인 리뷰 토글 함수 추가
  toggleCampaignReviews(campaignId) {
    const content = document.getElementById(campaignId);
    const icon = document.getElementById(`${campaignId}-icon`);
    
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
      icon.classList.add('rotate-180');
    } else {
      content.classList.add('hidden');
      icon.classList.remove('rotate-180');
    }
  }

  async cancelReviewApprovalFromAdmin(reviewId) {
    if (!confirm('이 리뷰의 승인을 취소하시겠습니까?')) return;
    
    try {
      await axios.put(`/api/reviews/${reviewId}/cancel`, {}, this.getAuthHeaders());
      alert('승인이 취소되었습니다');
      await this.loadAdminReviewsContent();
    } catch (error) {
      alert(error.response?.data?.error || '승인 취소에 실패했습니다');
    }
  }

  async toggleBestReviewFromAdmin(reviewId, isBest) {
    try {
      await axios.put(`/api/admin/reviews/${reviewId}/best`, { is_best: isBest }, this.getAuthHeaders());
      await this.loadAdminReviewsContent();
    } catch (error) {
      alert(error.response?.data?.error || '베스트 리뷰 설정에 실패했습니다');
    }
  }

  async showAdminSettlements() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow pb-20">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-money-bill-wave text-purple-600 mr-2"></i>정산 관리
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">출금 승인 및 정산 내역 관리</p>
            </div>

            <div id="adminSettlementsContent">
              <p class="text-gray-600">로딩 중...</p>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'settlements')}
        ${this.renderFooter()}
      </div>
    `;

    // 정산 내역 로드
    await this.loadAdminSettlementsPageContent();
  }

  async loadAdminSettlementsPageContent() {
    // adminSettlementsContent (정산 관리 페이지) 또는 settlements-content (마이페이지 아코디언) 찾기
    const container = document.getElementById('adminSettlementsContent') || document.getElementById('settlements-content');
    
    try {
      // 출금 요청 목록 가져오기
      const response = await axios.get('/api/admin/withdrawals', this.getAuthHeaders());
      const withdrawals = response.data;

      container.innerHTML = `
        <div class="space-y-4">
          ${withdrawals.length === 0 ? `
            <div class="text-center py-8 sm:py-12">
              <i class="fas fa-inbox text-4xl sm:text-6xl text-gray-300 mb-4"></i>
              <p class="text-sm sm:text-base text-gray-600 mb-2">출금 요청이 없습니다</p>
              <p class="text-xs sm:text-sm text-gray-500">대기 중인 출금 요청이 없습니다</p>
            </div>
          ` : ''}
          
          ${withdrawals.map(w => `
            <div class="border rounded-lg p-4 bg-white">
              <!-- PC 최적화: 정보를 가로로 배치 -->
              <div class="flex items-start justify-between mb-3 gap-4">
                <!-- 사용자 정보 -->
                <div class="flex-shrink-0" style="min-width: 180px;">
                  <h3 class="font-bold text-base">${w.user_nickname || '사용자'}</h3>
                  <p class="text-sm text-gray-600">${w.user_email || ''}</p>
                </div>

                <!-- 금액 정보 (가로 배치) -->
                <div class="flex-1 grid grid-cols-4 gap-4">
                  <div class="text-center">
                    <p class="text-xs text-gray-600 mb-1">출금 금액</p>
                    <p class="font-semibold text-base">${w.amount.toLocaleString()}P</p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-gray-600 mb-1">세금 (22%)</p>
                    <p class="font-semibold text-base text-red-600">-${w.tax_amount.toLocaleString()}P</p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-gray-600 mb-1">실지급액</p>
                    <p class="font-bold text-lg text-green-600">${w.net_amount.toLocaleString()}원</p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-gray-600 mb-1">상태</p>
                    <span class="inline-block px-3 py-1 rounded-full text-xs ${
                      w.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      w.status === 'approved' ? 'bg-green-100 text-green-800' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }">
                      ${w.status === 'pending' ? '⏳ 대기' : w.status === 'approved' ? '✓ 승인' : w.status === 'rejected' ? '✗ 거절' : w.status}
                    </span>
                  </div>
                </div>

                <!-- 액션 버튼 -->
                <div class="flex-shrink-0 flex gap-2">
                  ${w.status === 'pending' ? `
                    <button onclick="app.approveWithdrawal(${w.id})" 
                      class="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm">
                      <i class="fas fa-check"></i>
                    </button>
                    <button onclick="app.rejectWithdrawal(${w.id})" 
                      class="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm">
                      <i class="fas fa-times"></i>
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- 계좌 정보 및 날짜 (가로 배치) -->
              <div class="flex items-center justify-between text-sm border-t pt-3 gap-6">
                <div class="flex items-center gap-6 text-gray-600">
                  <span><i class="fas fa-university mr-1"></i>${w.bank_name}</span>
                  <span><i class="fas fa-credit-card mr-1"></i>${w.account_number}</span>
                  <span><i class="fas fa-user mr-1"></i>${w.account_holder}</span>
                  ${w.contact_phone ? `<span><i class="fas fa-phone mr-1"></i>${w.contact_phone}</span>` : ''}
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                  <span>신청: ${new Date(w.created_at).toLocaleDateString('ko-KR')}</span>
                  ${w.processed_at ? `<span>처리: ${new Date(w.processed_at).toLocaleDateString('ko-KR')}</span>` : ''}
                </div>
              </div>

              <!-- 세금 신고 정보 -->
              ${w.real_name || w.resident_number_partial ? `
                <div class="flex items-center gap-6 text-sm text-gray-600 border-t pt-3 mt-3">
                  ${w.real_name ? `<span><i class="fas fa-id-card mr-1"></i>실명: ${w.real_name}</span>` : ''}
                  ${w.resident_number_partial ? `<span><i class="fas fa-birthday-cake mr-1"></i>생년월일: ${w.resident_number_partial}</span>` : ''}
                  <div class="ml-auto flex items-center gap-2">
                    ${w.id_card_image_url ? `
                      <a href="${w.id_card_image_url}" download="신분증_${w.user_nickname}_${w.id}.jpg" 
                         class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">
                        <i class="fas fa-id-card mr-1"></i>신분증
                      </a>
                    ` : ''}
                    ${w.bankbook_image_url ? `
                      <a href="${w.bankbook_image_url}" download="통장사본_${w.user_nickname}_${w.id}.jpg" 
                         class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs">
                        <i class="fas fa-book mr-1"></i>통장
                      </a>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
              
              ${w.admin_memo ? `
                <div class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <span class="font-semibold text-yellow-800">메모:</span>
                  <span class="text-yellow-700 ml-2">${w.admin_memo}</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load admin settlements:', error);
      container.innerHTML = '<p class="text-red-600 p-4">정산 내역을 불러오는데 실패했습니다</p>';
    }
  }

  async approveWithdrawal(withdrawalId) {
    if (!confirm('이 출금 요청을 승인하시겠습니까?')) return;
    
    const memo = prompt('관리자 메모 (선택사항):');
    
    try {
      await axios.put(`/api/admin/withdrawals/${withdrawalId}/approve`, 
        { memo }, 
        this.getAuthHeaders()
      );
      alert('출금 요청이 승인되었습니다');
      await this.loadAdminSettlementsPageContent();
    } catch (error) {
      alert(error.response?.data?.error || '승인에 실패했습니다');
    }
  }

  async rejectWithdrawal(withdrawalId) {
    const memo = prompt('거절 사유를 입력해주세요:');
    if (!memo) {
      alert('거절 사유를 입력해야 합니다');
      return;
    }
    
    try {
      await axios.put(`/api/admin/withdrawals/${withdrawalId}/reject`, 
        { memo }, 
        this.getAuthHeaders()
      );
      alert('출금 요청이 거절되었습니다');
      await this.loadAdminSettlementsPageContent();
    } catch (error) {
      alert(error.response?.data?.error || '거절에 실패했습니다');
    }
  }

  // 출금 신청 서류 확인 모달
  async showWithdrawalDocuments(withdrawalId) {
    try {
      const response = await axios.get(`/api/admin/withdrawals/${withdrawalId}`, this.getAuthHeaders());
      const w = response.data;

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold">출금 신청 서류 확인</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <!-- 기본 정보 -->
          <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="text-gray-600">신청자:</span> <span class="font-semibold">${w.user_nickname}</span></div>
              <div><span class="text-gray-600">이메일:</span> ${w.user_email}</div>
              <div><span class="text-gray-600">실명:</span> <span class="font-semibold">${w.real_name || '-'}</span></div>
              <div><span class="text-gray-600">생년월일:</span> ${w.resident_number_partial || '-'}</div>
              <div><span class="text-gray-600">연락처:</span> ${w.contact_phone || '-'}</div>
              <div><span class="text-gray-600">신청일:</span> ${new Date(w.created_at).toLocaleString('ko-KR')}</div>
            </div>
          </div>

          <!-- 금액 정보 -->
          <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-sm text-gray-600 mb-1">출금 금액</p>
                <p class="text-lg font-bold">${w.amount.toLocaleString()}P</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">세금 (22%)</p>
                <p class="text-lg font-bold text-red-600">-${w.tax_amount.toLocaleString()}원</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">실지급액</p>
                <p class="text-xl font-bold text-green-600">${w.net_amount.toLocaleString()}원</p>
              </div>
            </div>
          </div>

          <!-- 계좌 정보 -->
          <div class="bg-yellow-50 p-4 rounded-lg mb-4">
            <h3 class="font-semibold mb-2">계좌 정보</h3>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div><span class="text-gray-600">은행:</span> ${w.bank_name}</div>
              <div><span class="text-gray-600">계좌번호:</span> ${w.account_number}</div>
              <div><span class="text-gray-600">예금주:</span> ${w.account_holder}</div>
            </div>
          </div>

          <!-- 서류 이미지 -->
          <div class="space-y-4">
            ${w.id_card_image_url ? `
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold flex items-center">
                    <i class="fas fa-id-card mr-2 text-blue-600"></i>
                    신분증 사본
                  </h3>
                  <a href="${w.id_card_image_url}" download="신분증_${w.user_nickname}_${w.id}.jpg" 
                     class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    <i class="fas fa-download mr-1"></i>다운로드
                  </a>
                </div>
                <div class="border rounded-lg p-2 bg-gray-50">
                  <img src="${w.id_card_image_url}" alt="신분증" class="max-w-full h-auto rounded">
                </div>
              </div>
            ` : '<p class="text-gray-500 text-sm">신분증 사본이 없습니다</p>'}

            ${w.bankbook_image_url ? `
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold flex items-center">
                    <i class="fas fa-book mr-2 text-green-600"></i>
                    통장 사본
                  </h3>
                  <a href="${w.bankbook_image_url}" download="통장사본_${w.user_nickname}_${w.id}.jpg" 
                     class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    <i class="fas fa-download mr-1"></i>다운로드
                  </a>
                </div>
                <div class="border rounded-lg p-2 bg-gray-50">
                  <img src="${w.bankbook_image_url}" alt="통장" class="max-w-full h-auto rounded">
                </div>
              </div>
            ` : '<p class="text-gray-500 text-sm">통장 사본이 없습니다</p>'}
          </div>

          <!-- 닫기 버튼 -->
          <div class="mt-6 flex justify-end">
            <button onclick="this.closest('.fixed').remove()" 
              class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              닫기
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    } catch (error) {
      console.error('Failed to load withdrawal documents:', error);
      alert('서류를 불러오는데 실패했습니다');
    }
  }

  // ============================================
  // Advertiser Pages (광고주 전용 페이지)
  // ============================================

  async showAdvertiserCampaigns() {
    this.pushHistory('advertiserCampaigns');
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow pb-20">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8 flex justify-between items-center">
              <div>
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                  <i class="fas fa-bullhorn text-purple-600 mr-2"></i>캠페인 관리
                </h1>
                <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">내 캠페인 목록 및 관리</p>
              </div>
              <button onclick="app.showCreateCampaign()" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                <i class="fas fa-plus mr-2"></i>캠페인 등록
              </button>
            </div>

            <div id="advertiserCampaignsContent">
              <p class="text-gray-600">로딩 중...</p>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'campaigns')}
        ${this.renderFooter()}
      </div>
    `;

    // 캠페인 목록 로드
    await this.loadAdvertiserCampaignsPageContent();
  }

  async loadAdvertiserCampaignsPageContent() {
    try {
      const response = await axios.get('/api/campaigns/my', this.getAuthHeaders());
      const campaigns = response.data;
      const container = document.getElementById('advertiserCampaignsContent');

      container.innerHTML = `
        <div class="space-y-3 sm:space-y-4">
          ${campaigns.length === 0 ? '<p class="text-gray-600">등록된 캠페인이 없습니다</p>' : ''}
          ${campaigns.map(c => `
            <div onclick="app.viewCampaignDetail(${c.id})" class="border rounded-lg hover:shadow-md transition overflow-hidden bg-white cursor-pointer">
              <div class="flex flex-col sm:flex-row">
                <!-- 썸네일 이미지 -->
                ${c.thumbnail_image ? `
                  <div class="w-full sm:w-32 h-32 flex-shrink-0">
                    <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-full object-cover">
                  </div>
                ` : `
                  <div class="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-200 flex items-center justify-center">
                    <i class="fas fa-image text-gray-400 text-3xl"></i>
                  </div>
                `}
                
                <!-- 캠페인 정보 -->
                <div class="flex-1 p-3 sm:p-4">
                  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="font-bold text-base sm:text-lg">${c.title}</h3>
                      ${c.channel_type ? `
                        <span class="text-xs font-semibold text-gray-700 flex items-center">
                          ${UIUtils.getChannelWithIcon(c.channel_type)}
                        </span>
                      ` : ''}
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs sm:text-sm ${this.getStatusBadge(c.status, c)} whitespace-nowrap self-start">
                      ${this.getStatusText(c.status, c)}
                    </span>
                  </div>
                  <p class="text-gray-600 mb-2 text-sm line-clamp-2">${c.description || ''}</p>
                  <div class="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                    <span>
                      ${(() => {
                        const pricingTypeText = c.pricing_type === 'points_only' ? '포인트만' :
                          c.pricing_type === 'product_only' ? '상품만' :
                          c.pricing_type === 'product_with_points' ? '상품+포인트' :
                          c.pricing_type === 'purchase_with_points' ? '구매+포인트' :
                          c.pricing_type === 'voucher_only' ? '이용권만' :
                          c.pricing_type === 'voucher_with_points' ? '이용권+포인트' : '상품만';
                        
                        const totalWithVAT = c.payment_amount || c.budget || 0;
                        
                        return `${pricingTypeText} = ${totalWithVAT.toLocaleString()}원(부가세포함)`;
                      })()}
                    </span>
                    <span>모집인원: <span class="font-semibold ${c.application_count > 0 ? 'text-purple-600' : ''}">${c.application_count || 0}</span>/${c.slots}명</span>
                    ${c.point_reward > 0 ? `
                      <span class="col-span-2 text-purple-600 font-semibold">
                        <i class="fas fa-coins mr-1"></i>포인트: ${c.point_reward.toLocaleString()}P/인 (총 ${(c.point_reward * c.slots).toLocaleString()}P)
                      </span>
                    ` : ''}
                  </div>
                  <div class="mt-3 sm:mt-4 flex flex-wrap gap-2">
                    ${c.status === 'pending' ? `
                      <button onclick="event.stopPropagation(); app.editCampaign(${c.id})" class="text-blue-600 hover:underline text-xs sm:text-sm">
                        <i class="fas fa-edit mr-1"></i>수정
                      </button>
                    ` : `
                      <button class="text-gray-400 cursor-not-allowed text-xs sm:text-sm" disabled title="승인된 캠페인은 수정할 수 없습니다">
                        <i class="fas fa-edit mr-1"></i>수정
                      </button>
                    `}
                    <button onclick="event.stopPropagation(); app.copyCampaign(${c.id})" class="text-green-600 hover:underline text-xs sm:text-sm">
                      <i class="fas fa-copy mr-1"></i>복사하기
                    </button>
                    <button onclick="event.stopPropagation(); app.viewApplications(${c.id})" class="text-purple-600 hover:underline text-xs sm:text-sm">
                      <i class="fas fa-users mr-1"></i>지원자 보기 (${c.application_count || 0})
                    </button>
                    ${(() => {
                      // 실제 상태 계산 (UIUtils 사용)
                      const actualStatus = UIUtils.calculateCampaignStatus(c);
                      // recruiting 상태이고 지원자가 있을 때만 표시
                      const canProceed = actualStatus === 'recruiting' && (c.application_count || 0) > 0;
                      return canProceed ? `
                        <button onclick="event.stopPropagation(); app.proceedCampaign(${c.id})" class="text-green-600 hover:underline text-xs sm:text-sm font-semibold">
                          <i class="fas fa-play-circle mr-1"></i>이대로 진행
                        </button>
                      ` : '';
                    })()}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load advertiser campaigns:', error);
      const container = document.getElementById('advertiserCampaignsContent');
      container.innerHTML = '<p class="text-red-600 p-4">캠페인 목록을 불러오는데 실패했습니다</p>';
    }
  }

  async showAdvertiserReviews() {
    this.pushHistory('advertiserReviews');
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow pb-20">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-star text-purple-600 mr-2"></i>리뷰 관리
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">제출된 리뷰 확인 및 평가</p>
            </div>

            <div id="advertiserReviewsContent">
              <p class="text-gray-600">로딩 중...</p>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'reviews')}
        ${this.renderFooter()}
      </div>
    `;

    // 리뷰 목록 로드
    await this.loadAdvertiserReviewsPageContent();
  }

  async loadAdvertiserReviewsPageContent() {
    try {
      // 내 캠페인의 모든 리뷰 가져오기
      const response = await axios.get('/api/campaigns/my/reviews', this.getAuthHeaders());
      const reviews = response.data;
      const container = document.getElementById('advertiserReviewsContent');

      if (reviews.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 sm:py-12">
            <i class="fas fa-inbox text-4xl sm:text-6xl text-gray-300 mb-4"></i>
            <p class="text-sm sm:text-base text-gray-600 mb-2">제출된 리뷰가 없습니다</p>
            <p class="text-xs sm:text-sm text-gray-500">인플루언서가 리뷰를 제출하면 여기에 표시됩니다</p>
          </div>
        `;
        return;
      }

      // 캠페인별로 그룹화
      const reviewsByCampaign = {};
      reviews.forEach(review => {
        if (!reviewsByCampaign[review.campaign_id]) {
          reviewsByCampaign[review.campaign_id] = {
            campaign_title: review.campaign_title,
            reviews: []
          };
        }
        reviewsByCampaign[review.campaign_id].reviews.push(review);
      });

      container.innerHTML = `
        <div class="space-y-6">
          ${Object.entries(reviewsByCampaign).map(([campaignId, data]) => `
            <div class="bg-white rounded-lg shadow-md p-4">
              <h2 class="text-xl font-bold mb-4 text-gray-800">
                <i class="fas fa-bullhorn text-purple-600 mr-2"></i>${data.campaign_title}
              </h2>
              <div class="space-y-4">
                ${data.reviews.map(review => {
                  const statusBadge = review.approval_status === 'approved' 
                    ? '<span class="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>승인완료</span>'
                    : review.approval_status === 'rejected'
                    ? '<span class="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800"><i class="fas fa-times-circle mr-1"></i>거절됨</span>'
                    : '<span class="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800"><i class="fas fa-clock mr-1"></i>검토대기</span>';
                  
                  return `
                  <div class="border rounded-lg p-4 hover:shadow-md transition ${review.approval_status === 'rejected' ? 'bg-red-50' : ''}">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <p class="font-semibold text-gray-800">${review.influencer_nickname}</p>
                          ${statusBadge}
                        </div>
                        <p class="text-sm text-gray-500">${review.influencer_email}</p>
                      </div>
                      <span class="text-xs text-gray-500">${new Date(review.submitted_at || review.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    
                    ${review.review_image ? `
                      <div class="mb-3">
                        <img src="/api/applications/review-image/${encodeURIComponent(review.review_image)}" alt="리뷰 이미지" class="w-48 h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition" onclick="window.open(this.src, '_blank')" onerror="this.style.display='none'">
                      </div>
                    ` : ''}
                    
                    <div class="mb-3">
                      <p class="text-sm text-gray-700 whitespace-pre-wrap">${review.review_text || '리뷰 내용 없음'}</p>
                    </div>
                    
                    ${review.post_url ? `
                      <div class="mb-3">
                        <a href="${review.post_url}" target="_blank" class="text-blue-600 hover:underline text-sm">
                          <i class="fas fa-external-link-alt mr-1"></i>게시물 보기
                        </a>
                      </div>
                    ` : ''}
                    
                    ${review.approval_status === 'rejected' && review.rejection_reason ? `
                      <div class="mb-3 p-3 bg-red-100 rounded-lg">
                        <p class="text-sm font-semibold text-red-800 mb-1">거절 사유:</p>
                        <p class="text-sm text-red-700">${review.rejection_reason}</p>
                      </div>
                    ` : ''}
                    
                    <div class="flex gap-2 mt-4">
                      ${review.approval_status === 'pending' ? `
                        <button onclick="app.approveReview(${review.id})" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
                          <i class="fas fa-check mr-1"></i>승인
                        </button>
                        <button onclick="app.rejectReviewWithReason(${review.id})" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                          <i class="fas fa-times mr-1"></i>거절
                        </button>
                      ` : review.approval_status === 'approved' ? `
                        <button onclick="app.cancelReviewApproval(${review.id})" class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm">
                          <i class="fas fa-undo mr-1"></i>승인취소
                        </button>
                        ${this.user.role === 'admin' ? `
                          <button onclick="app.toggleBestReview(${review.id}, ${review.is_best ? 'false' : 'true'})" 
                            class="${review.is_best ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-4 py-2 rounded text-sm">
                            <i class="fas fa-star mr-1"></i>${review.is_best ? '베스트 해제' : '베스트 설정'}
                          </button>
                        ` : ''}
                      ` : `
                        <button onclick="app.cancelReviewApproval(${review.id})" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                          <i class="fas fa-undo mr-1"></i>거절취소
                        </button>
                      `}
                    </div>
                  </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load advertiser reviews:', error);
      const container = document.getElementById('advertiserReviewsContent');
      container.innerHTML = '<p class="text-red-600 p-4">리뷰 목록을 불러오는데 실패했습니다</p>';
    }
  }

  async approveReview(reviewId) {
    if (!confirm('이 리뷰를 승인하시겠습니까?')) return;
    
    try {
      await axios.put(`/api/reviews/${reviewId}/approve`, {}, this.getAuthHeaders());
      alert('리뷰가 승인되었습니다');
      await this.loadAdvertiserReviewsPageContent();
    } catch (error) {
      alert(error.response?.data?.error || '리뷰 승인에 실패했습니다');
    }
  }

  async rejectReviewWithReason(reviewId) {
    // 사유 입력 모달 생성
    const modalHtml = `
      <div id="rejectReasonModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold mb-4 text-gray-800">
            <i class="fas fa-times-circle text-red-600 mr-2"></i>리뷰 거절 사유
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            인플루언서가 수정할 수 있도록 구체적인 사유를 입력해주세요.
          </p>
          <textarea 
            id="rejectionReasonInput" 
            class="w-full border rounded-lg p-3 mb-4 h-32 resize-none"
            placeholder="예: 제품명이 명확하게 표시되지 않았습니다.\n예: 필수 해시태그가 누락되었습니다.\n예: 이미지 품질이 낮습니다."
          ></textarea>
          <div class="flex gap-2 justify-end">
            <button onclick="document.getElementById('rejectReasonModal').remove()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
              취소
            </button>
            <button onclick="app.submitReviewRejection(${reviewId})" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              <i class="fas fa-times mr-1"></i>거절하기
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('rejectionReasonInput').focus();
  }

  async submitReviewRejection(reviewId) {
    const reason = document.getElementById('rejectionReasonInput').value.trim();
    
    if (!reason) {
      alert('거절 사유를 입력해주세요');
      return;
    }
    
    try {
      await axios.put(`/api/reviews/${reviewId}/reject`, { reason }, this.getAuthHeaders());
      document.getElementById('rejectReasonModal').remove();
      alert('리뷰가 거절되었습니다');
      await this.loadAdvertiserReviewsPageContent();
    } catch (error) {
      alert(error.response?.data?.error || '리뷰 거절에 실패했습니다');
    }
  }

  async rejectReview(reviewId) {
    const reason = prompt('거절 사유를 입력해주세요:');
    if (!reason) {
      alert('거절 사유를 입력해야 합니다');
      return;
    }
    
    try {
      await axios.put(`/api/reviews/${reviewId}/reject`, { reason }, this.getAuthHeaders());
      alert('리뷰가 거절되었습니다');
      await this.loadAdvertiserReviewsPageContent();
    } catch (error) {
      alert(error.response?.data?.error || '리뷰 거절에 실패했습니다');
    }
  }

  async cancelReviewApproval(reviewId) {
    if (!confirm('승인/거절을 취소하고 검토 대기 상태로 되돌리시겠습니까?')) return;
    
    try {
      await axios.put(`/api/reviews/${reviewId}/cancel-approval`, {}, this.getAuthHeaders());
      alert('상태가 검토 대기로 변경되었습니다');
      await this.loadAdvertiserReviewsPageContent();
    } catch (error) {
      alert(error.response?.data?.error || '취소에 실패했습니다');
    }
  }

  async showCreateCampaign() {
    // Load system settings first
    let pointsFeeRate = 30;
    try {
      const settingsResponse = await axios.get('/api/settings');
      const settingsArray = settingsResponse.data;
      const settings = {};
      settingsArray.forEach(s => {
        settings[s.setting_key] = Number(s.setting_value);
      });
      pointsFeeRate = settings.points_fee_rate || 30;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    
    // 컨테이너 찾기: adminContent, advertiserContent, 또는 전체 페이지
    let content = document.getElementById('adminContent') || document.getElementById('advertiserContent');
    let isFullPage = false;
    
    if (!content) {
      // 컨테이너가 없으면 전체 페이지로 렌더링
      isFullPage = true;
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow pb-20">
            <div class="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
              <button onclick="app.user.role === 'admin' ? app.showAdminCampaigns() : (app.user.role === 'advertiser' || app.user.role === 'agency' || app.user.role === 'rep') ? app.showAdvertiserCampaigns() : app.showMyPage()" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>캠페인관리로
              </button>
              
              <div id="campaignFormContainer"></div>
            </div>
          </div>
          
          ${this.renderFooter()}
        </div>
      `;
      content = document.getElementById('campaignFormContainer');
    }
    
    content.innerHTML = `
      <h2 class="text-2xl font-bold mb-6">캠페인 등록</h2>
      <form id="createCampaignForm" onsubmit="event.preventDefault(); app.handleCreateCampaign();" class="space-y-6">
        
        <!-- 기본 정보 섹션 -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-info-circle text-blue-600 mr-2"></i>기본 정보
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 채널 *</label>
              <select id="campaignChannelType" required onchange="app.handleChannelChange()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                <option value="">채널을 선택하세요</option>
                <option value="instagram">인스타그램</option>
                <option value="blog">네이버 블로그</option>
                <option value="youtube">유튜브</option>
                <option value="smartstore">스마트스토어</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">⚠️ 한 캠페인은 하나의 채널만 선택 가능합니다. 여러 채널을 진행하려면 캠페인을 따로 등록해주세요.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 제목 *</label>
              <input type="text" id="campaignTitle" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 설명</label>
              <textarea id="campaignDescription" rows="4" placeholder="캠페인에 대한 간단한 소개를 작성해주세요"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">모집인원 *</label>
              <input type="number" id="campaignSlots" placeholder="10" min="10" required
                onfocus="this.dataset.prevValue=this.value; this.value=''"
                onblur="if(this.value=='') {this.value=this.dataset.prevValue||'10'}; if(parseInt(this.value) < 10) {alert('모집인원은 최소 10명 이상이어야 합니다'); this.value='10'}; app.calculateNewPricingCost()"
                oninput="if(parseInt(this.value) >= 10) app.calculateNewPricingCost()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              <p class="text-xs text-gray-500 mt-1">최소 10명부터 모집 가능합니다</p>
            </div>
          </div>
        </div>

        <!-- 썸네일 이미지 섹션 -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-image text-indigo-600 mr-2"></i>썸네일 이미지
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">이미지 업로드</label>
              <input type="file" id="campaignThumbnail" accept=".jpg,.jpeg,.png,.gif,.bmp"
                onchange="app.handleThumbnailUpload(event)"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              <div class="mt-2 text-xs text-gray-600">
                <p class="font-semibold mb-1">📋 이미지 요구사항:</p>
                <ul class="list-disc list-inside space-y-1 ml-2">
                  <li>권장 크기: 1000px × 1000px</li>
                  <li>최소 크기: 300px × 300px 초과</li>
                  <li>최대 크기: 4000px × 4000px 미만</li>
                  <li>가로:세로 비율: 1:2 이내</li>
                  <li>최대 용량: 10MB</li>
                  <li>형식: JPG, JPEG, PNG, GIF, BMP</li>
                </ul>
              </div>
            </div>
            
            <!-- 이미지 미리보기 -->
            <div id="thumbnailPreview" style="display: none;" class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">미리보기</label>
              <div class="relative inline-block">
                <img id="thumbnailPreviewImage" src="" alt="썸네일 미리보기" 
                  class="max-w-xs max-h-64 border-2 border-gray-300 rounded-lg">
                <button type="button" onclick="app.removeThumbnail()" 
                  class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <p id="thumbnailInfo" class="text-xs text-gray-500 mt-2"></p>
            </div>
          </div>
        </div>

        <!-- 채널별 상세 정보 섹션 (동적 표시) -->
        <div id="channelSpecificSection" style="display: none;" class="bg-white border-2 border-indigo-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-hashtag text-indigo-600 mr-2"></i><span id="channelSectionTitle">채널 상세 정보</span>
          </h3>
          
          <div id="channelSpecificFields" class="space-y-4">
            <!-- 채널별 필드가 여기에 동적으로 추가됩니다 -->
          </div>
        </div>

        <!-- 일정 관리 섹션 -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-calendar-alt text-green-600 mr-2"></i>일정 관리
          </h3>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">모집 시작일 *</label>
                <input type="text" id="campaignApplicationStartDate" required readonly
                  placeholder="날짜를 선택하세요"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">모집 종료일 *</label>
                <input type="text" id="campaignApplicationEndDate" required readonly
                  placeholder="날짜를 선택하세요"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">인플루언서 선정발표일 *</label>
              <input type="text" id="campaignAnnouncementDate" required readonly
                placeholder="날짜를 선택하세요"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">컨텐츠 등록 시작일 *</label>
                <input type="text" id="campaignContentStartDate" required readonly
                  placeholder="날짜를 선택하세요"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">컨텐츠 등록 종료일 *</label>
                <input type="text" id="campaignContentEndDate" required readonly
                  placeholder="날짜를 선택하세요"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">결과 발표일 *</label>
              <input type="text" id="campaignResultAnnouncementDate" required readonly
                placeholder="날짜를 선택하세요"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer">
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <i class="fas fa-info-circle mr-2"></i>
              날짜는 순서대로 입력되어야 합니다: 신청시작 → 신청마감 → 선정발표 → 등록시작 → 등록마감 → 결과발표
            </div>
          </div>
        </div>

        <!-- 제공 내역 섹션 -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-gift text-pink-600 mr-2"></i>제공 내역
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">제공 내역</label>
              <textarea id="campaignProvidedItems" rows="3" placeholder="예: 제품 1개 제공, 서비스 이용권 제공 등"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"></textarea>
              <p class="text-xs text-gray-500 mt-1">상품, 이용권, 서비스 등 제공하는 항목을 상세히 기재해주세요</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">제품/서비스명</label>
                <input type="text" id="campaignProductName" placeholder="예: 프리미엄 화장품 세트"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">제품/서비스 URL</label>
                <input type="url" id="campaignProductUrl" placeholder="https://..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">예상 가액 (원)</label>
              <input type="text" id="campaignBudget" placeholder="제공 항목의 예상 가액을 입력해주세요"
                oninput="app.formatNumberInput(this)"
                onfocus="app.clearDefaultZero(this)"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              <p class="text-xs text-gray-500 mt-1">제품 또는 서비스 제공 시 해당 금액 입력</p>
            </div>
          </div>
        </div>

        <!-- 미션 및 요구사항 섹션 -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-tasks text-orange-600 mr-2"></i>미션 및 요구사항
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">미션 (최대 10개)</label>
              <div id="missionContainer" class="space-y-2">
                <!-- 미션 입력 필드들이 여기에 동적으로 추가됩니다 -->
              </div>
              <button type="button" id="addMissionBtn" onclick="app.addMissionField()" 
                class="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium">
                <i class="fas fa-plus-circle mr-1"></i>미션 추가
              </button>
              <p class="text-xs text-gray-500 mt-1">인플루언서가 수행해야 할 미션을 명확히 작성해주세요</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">요구사항</label>
              <textarea id="campaignRequirements" rows="3" placeholder="예: 최소 팔로워 1000명 이상, 뷰티 카테고리 인플루언서"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"></textarea>
              <p class="text-xs text-gray-500 mt-1">인플루언서 선정 기준이나 조건을 작성해주세요</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">키워드</label>
              <div id="keywordContainer" class="w-full min-h-[100px] px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-600 flex flex-wrap gap-2 items-start cursor-text"
                onclick="document.getElementById('keywordInput').focus()">
                <!-- 해시태그 버튼들이 여기에 추가됩니다 -->
                <input type="text" id="keywordInput" placeholder="키워드 입력 후 엔터, 쉼표, 스페이스"
                  onkeydown="app.handleKeywordInput(event)"
                  class="flex-1 min-w-[200px] outline-none border-none">
              </div>
              <input type="hidden" id="campaignKeywords">
              <p class="text-xs text-gray-500 mt-1">키워드 입력 후 엔터, 쉼표(,), 스페이스로 추가됩니다</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">유의사항</label>
              <textarea id="campaignNotes" rows="8"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">1. 제공받은 제품은 타인에게 양도 및 판매, 교환이 불가능 하며 적발 시 제품 가격 환불 및 캠페인 참여가 제한됩니다.

2. 리뷰 콘텐츠 등록 기간 내 리뷰 콘텐츠 미등록 시 제품 가격에 대하여 비용이 청구됩니다.

3. 선정 후 단순 변심에 의한 제공내역 옵션 및 배송지 변경은 어렵습니다.

4. 안내된 제공 내역과 다르거나, 별도 공지 없이 3일 이상 배송이 진행되지 않을 경우에는 1:1문의로 연락해주세요.

5. 업체측 요청에 따라 리뷰어 선정 인원수가 변경될 수 있습니다.

6. 리뷰 콘텐츠 작성 시 선정 된 리뷰 캠페인의 제품으로만 촬영이 이루어져야 합니다.

7. 작성한 리뷰 콘텐츠는 캠페인 마감일을 기준으로 6개월간 유지되어야 하며, 유지되지 않을 경우 페널티가 부과됩니다.

8. 체험하신 블로거분들의 리뷰 콘텐츠는 업체 홍보로 이용될 수 있습니다.</textarea>
              <p class="text-xs text-gray-500 mt-1">기본 유의사항이 자동 입력됩니다. 필요시 수정 또는 추가 가능합니다</p>
            </div>
          </div>
        </div>

        <!-- 과금 방식 선택 섹션 -->
        <div class="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 class="font-bold text-blue-900 mb-3 flex items-center">
            <i class="fas fa-dollar-sign mr-2"></i>과금 방식 선택 *
          </h3>
          
          <!-- 포인트 지급 추천 안내 -->
          <div class="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-3 mb-4">
            <div class="flex items-start gap-2">
              <i class="fas fa-star text-orange-500 mt-0.5"></i>
              <div class="flex-1">
                <p class="text-sm font-semibold text-orange-900 mb-1">
                  💡 포인트 지급을 추천합니다!
                </p>
                <p class="text-xs text-orange-800 leading-relaxed">
                  포인트를 많이 지급할수록 <strong>완성도 높은 리뷰</strong>를 받을 수 있습니다. 
                  인플루언서들은 포인트 보상이 클수록 더 정성스럽고 퀄리티 높은 콘텐츠를 제작합니다.
                </p>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <!-- 1. 포인트만 지급 -->
            <label class="cursor-pointer">
              <input type="radio" name="pricingType" value="points_only" onchange="app.handlePricingTypeChange()" 
                class="peer sr-only" checked>
              <div class="bg-white border-2 border-gray-300 rounded-lg p-3 peer-checked:border-orange-600 peer-checked:bg-orange-50 hover:border-orange-400 transition">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-800">포인트만 지급</span>
                  <div class="flex items-center gap-1">
                    <span class="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded">추천</span>
                    <i class="fas fa-coins text-orange-600"></i>
                  </div>
                </div>
                <p class="text-xs text-gray-600">스피어포인트만 지급</p>
                <p class="text-xs text-gray-500 mt-1">건당 10,000원 + 포인트 ${pointsFeeRate}% 수수료</p>
                <p class="text-xs text-orange-600 font-semibold mt-1">✨ 가장 높은 리뷰 퀄리티</p>
              </div>
            </label>
            
            <!-- 2. 구매 + 포인트 -->
            <label class="cursor-pointer">
              <input type="radio" name="pricingType" value="purchase_with_points" onchange="app.handlePricingTypeChange()" 
                class="peer sr-only">
              <div class="bg-white border-2 border-gray-300 rounded-lg p-3 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 hover:border-indigo-400 transition">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-800">구매 + 포인트</span>
                  <i class="fas fa-shopping-cart text-indigo-600"></i>
                </div>
                <p class="text-xs text-gray-600">리뷰어가 직접 구매 + 포인트</p>
                <p class="text-xs text-gray-500 mt-1">건당 10,000원 + 포인트 ${pointsFeeRate}% 수수료</p>
                <p class="text-xs text-indigo-600 font-semibold mt-1">💰 포인트로 리뷰 품질 향상</p>
              </div>
            </label>
            
            <!-- 3. 상품만 제공 -->
            <label class="cursor-pointer">
              <input type="radio" name="pricingType" value="product_only" onchange="app.handlePricingTypeChange()" 
                class="peer sr-only">
              <div class="bg-white border-2 border-gray-300 rounded-lg p-3 peer-checked:border-purple-600 peer-checked:bg-purple-50 hover:border-purple-400 transition">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-800">상품만 제공</span>
                  <i class="fas fa-box text-purple-600"></i>
                </div>
                <p class="text-xs text-gray-600">리뷰어에게 상품만 제공</p>
                <p class="text-xs text-gray-500 mt-1">건당 10,000원</p>
              </div>
            </label>
            
            <!-- 4. 상품 + 포인트 -->
            <label class="cursor-pointer">
              <input type="radio" name="pricingType" value="product_with_points" onchange="app.handlePricingTypeChange()" 
                class="peer sr-only">
              <div class="bg-white border-2 border-gray-300 rounded-lg p-3 peer-checked:border-blue-600 peer-checked:bg-blue-50 hover:border-blue-400 transition">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-800">상품 + 포인트</span>
                  <i class="fas fa-gift text-blue-600"></i>
                </div>
                <p class="text-xs text-gray-600">상품 + 스피어포인트</p>
                <p class="text-xs text-gray-500 mt-1">건당 10,000원 + 포인트 ${pointsFeeRate}% 수수료</p>
                <p class="text-xs text-blue-600 font-semibold mt-1">💰 포인트로 리뷰 품질 향상</p>
              </div>
            </label>
            
            <!-- 5. 이용권만 제공 -->
            <label class="cursor-pointer">
              <input type="radio" name="pricingType" value="voucher_only" onchange="app.handlePricingTypeChange()" 
                class="peer sr-only">
              <div class="bg-white border-2 border-gray-300 rounded-lg p-3 peer-checked:border-green-600 peer-checked:bg-green-50 hover:border-green-400 transition">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-800">이용권만 제공</span>
                  <i class="fas fa-ticket-alt text-green-600"></i>
                </div>
                <p class="text-xs text-gray-600">리뷰어에게 이용권만 제공</p>
                <p class="text-xs text-gray-500 mt-1">건당 10,000원</p>
              </div>
            </label>
            
            <!-- 6. 이용권 + 포인트 -->
            <label class="cursor-pointer">
              <input type="radio" name="pricingType" value="voucher_with_points" onchange="app.handlePricingTypeChange()" 
                class="peer sr-only">
              <div class="bg-white border-2 border-gray-300 rounded-lg p-3 peer-checked:border-teal-600 peer-checked:bg-teal-50 hover:border-teal-400 transition">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-800">이용권 + 포인트</span>
                  <i class="fas fa-spa text-teal-600"></i>
                </div>
                <p class="text-xs text-gray-600">이용권 + 스피어포인트</p>
                <p class="text-xs text-gray-500 mt-1">건당 10,000원 + 포인트 ${pointsFeeRate}% 수수료</p>
                <p class="text-xs text-teal-600 font-semibold mt-1">💰 포인트로 리뷰 품질 향상</p>
              </div>
            </label>
          </div>

          <!-- 상품/이용권 가치 입력 -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <span id="productValueLabel">상품/이용권 가치</span> (원) *
            </label>
            <input type="text" id="campaignProductValue" value="0" required
              oninput="app.formatNumberInput(this); app.calculateNewPricingCost()"
              onfocus="app.clearDefaultZero(this)"
              onblur="if(this.value==='') this.value='0'; app.calculateNewPricingCost()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
            <p class="text-xs text-gray-500 mt-1" id="productValueHint">리뷰어에게 제공되는 상품 또는 이용권의 가치를 입력하세요</p>
          </div>

          <!-- 스피어포인트 입력 (포인트 포함 시만 표시) -->
          <div id="spherePointsSection" class="mb-4 hidden">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              스피어포인트 (P) *
            </label>
            <input type="text" id="campaignSpherePoints" value="0"
              oninput="app.formatNumberInput(this); app.calculateNewPricingCost()"
              onfocus="app.clearDefaultZero(this)"
              onblur="if(this.value==='') this.value='0'; app.calculateNewPricingCost()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
            <p class="text-xs text-gray-500 mt-1">1포인트 = 1원 (1만P 이상 현금 출금 가능)</p>
          </div>

          <!-- 비용 계산 미리보기 -->
          <div id="pricingSummary" class="bg-white p-4 rounded-lg border border-blue-200">
            <p class="text-sm text-gray-600 text-center">과금 정보를 입력하면 자동으로 계산됩니다</p>
          </div>
        </div>

        <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          캠페인 등록
        </button>
        
        <p class="text-sm text-gray-600 text-center">* 관리자 승인 후 활성화됩니다</p>
      </form>
    `;
    
    // Initialize cost calculation, date pickers, and mission fields
    setTimeout(() => {
      // 모집인원 기본값 설정
      const slotsInput = document.getElementById('campaignSlots');
      if (slotsInput && !slotsInput.value) {
        slotsInput.value = '10';
      }
      
      this.handlePricingTypeChange(); // 초기 과금 타입에 따른 UI 설정 (내부에서 calculateNewPricingCost 호출)
      this.initializeDatePickers();
      this.initializeMissionFields();
      this.initializeKeywords();
    }, 0);
  }

  handleChannelChange() {
    const channelType = document.getElementById('campaignChannelType').value;
    const section = document.getElementById('channelSpecificSection');
    const titleElement = document.getElementById('channelSectionTitle');
    const fieldsContainer = document.getElementById('channelSpecificFields');
    
    if (!channelType) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    // 채널별 제목 및 필드 설정
    const channelConfigs = {
      instagram: {
        title: '인스타그램 상세 정보',
        fields: `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">멘션할 인스타그램 계정 *</label>
            <input type="text" id="instagramMentionAccount" required placeholder="@your_account"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            <p class="text-xs text-gray-500 mt-1">인플루언서가 포스팅 시 멘션할 계정을 입력해주세요 (예: @brandname)</p>
          </div>
        `
      },
      blog: {
        title: '네이버 블로그 상세 정보',
        fields: `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">상품 구매 URL *</label>
            <input type="url" id="blogProductUrl" required placeholder="https://..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            <p class="text-xs text-gray-500 mt-1">블로그 리뷰에 포함될 상품 구매 링크를 입력해주세요</p>
          </div>
        `
      },
      youtube: {
        title: '유튜브 상세 정보',
        fields: `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">구매 링크 *</label>
            <input type="url" id="youtubePurchaseLink" required placeholder="https://..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            <p class="text-xs text-gray-500 mt-1">영상 설명란에 포함될 구매 링크를 입력해주세요</p>
          </div>
        `
      },
      smartstore: {
        title: '스마트스토어 상세 정보',
        fields: `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">스마트스토어 상품 URL *</label>
            <input type="url" id="smartstoreProductUrl" required placeholder="https://smartstore.naver.com/..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            <p class="text-xs text-gray-500 mt-1">리뷰를 남길 스마트스토어 상품 링크를 입력해주세요</p>
          </div>
        `
      }
    };
    
    const config = channelConfigs[channelType];
    if (config) {
      titleElement.textContent = config.title;
      fieldsContainer.innerHTML = config.fields;
    }
  }

  initializeDatePickers() {
    // Flatpickr가 로드되지 않은 경우 대기
    if (typeof flatpickr === 'undefined') {
      console.error('Flatpickr is not loaded');
      return;
    }

    // 날짜 필드 인스턴스 저장
    const datePickers = {};

    // 공통 설정
    const commonConfig = {
      locale: 'ko',
      dateFormat: 'Y-m-d',
      disableMobile: false,
      allowInput: false,
      clickOpens: true,
      showMonths: 1,
      monthSelectorType: 'static'
    };

    // 1. 캠페인 신청 시작일 (가장 이른 날짜, 오늘 이후만 가능)
    datePickers.applicationStart = flatpickr('#campaignApplicationStartDate', {
      ...commonConfig,
      minDate: 'today',
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          // 신청 마감일의 최소 날짜를 신청 시작일로 설정
          if (datePickers.applicationEnd) {
            datePickers.applicationEnd.set('minDate', selectedDates[0]);
          }
        }
      }
    });

    // 2. 캠페인 신청 마감일 (신청 시작일 이후)
    datePickers.applicationEnd = flatpickr('#campaignApplicationEndDate', {
      ...commonConfig,
      minDate: 'today',
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          // 선정발표일의 최소 날짜를 신청 마감일로 설정
          if (datePickers.announcement) {
            datePickers.announcement.set('minDate', selectedDates[0]);
          }
        }
      }
    });

    // 3. 인플루언서 선정발표일 (신청 마감일 이후)
    datePickers.announcement = flatpickr('#campaignAnnouncementDate', {
      ...commonConfig,
      minDate: 'today',
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          // 컨텐츠 등록 시작일의 최소 날짜를 선정발표일로 설정
          if (datePickers.contentStart) {
            datePickers.contentStart.set('minDate', selectedDates[0]);
          }
        }
      }
    });

    // 4. 컨텐츠 등록 시작일 (선정발표일 이후)
    datePickers.contentStart = flatpickr('#campaignContentStartDate', {
      ...commonConfig,
      minDate: 'today',
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          // 컨텐츠 등록 마감일의 최소 날짜를 등록 시작일로 설정
          if (datePickers.contentEnd) {
            datePickers.contentEnd.set('minDate', selectedDates[0]);
          }
        }
      }
    });

    // 5. 컨텐츠 등록 마감일 (등록 시작일 이후)
    datePickers.contentEnd = flatpickr('#campaignContentEndDate', {
      ...commonConfig,
      minDate: 'today',
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          // 결과 발표일의 최소 날짜를 등록 마감일로 설정
          if (datePickers.resultAnnouncement) {
            datePickers.resultAnnouncement.set('minDate', selectedDates[0]);
          }
        }
      }
    });

    // 6. 결과 발표일 (등록 마감일 이후)
    datePickers.resultAnnouncement = flatpickr('#campaignResultAnnouncementDate', {
      ...commonConfig,
      minDate: 'today'
    });

    // 인스턴스를 클래스 속성에 저장 (나중에 필요시 접근 가능)
    this.campaignDatePickers = datePickers;
  }

  handleThumbnailUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 형식 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      alert('JPG, JPEG, PNG, GIF, BMP 형식의 이미지만 업로드 가능합니다.');
      event.target.value = '';
      return;
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('이미지 크기는 10MB를 초과할 수 없습니다.');
      event.target.value = '';
      return;
    }

    // 이미지 로드 및 크기 검증
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // 크기 검증
        if (width <= 300 || height <= 300) {
          alert('이미지 크기는 300px × 300px을 초과해야 합니다.');
          event.target.value = '';
          return;
        }

        if (width >= 4000 || height >= 4000) {
          alert('이미지 크기는 4000px × 4000px 미만이어야 합니다.');
          event.target.value = '';
          return;
        }

        // 비율 검증 (가로:세로 = 1:2 이내)
        const ratio = width / height;
        if (ratio > 2 || ratio < 0.5) {
          alert('이미지 비율은 가로:세로 = 1:2 이내여야 합니다.\n현재 비율: ' + ratio.toFixed(2));
          event.target.value = '';
          return;
        }

        // 검증 통과 - 미리보기 표시
        document.getElementById('thumbnailPreview').style.display = 'block';
        document.getElementById('thumbnailPreviewImage').src = e.target.result;
        document.getElementById('thumbnailInfo').textContent = 
          `크기: ${width}px × ${height}px | 용량: ${(file.size / 1024 / 1024).toFixed(2)}MB | 비율: ${ratio.toFixed(2)}`;
        
        // Base64 데이터 저장
        this.thumbnailData = e.target.result;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeThumbnail() {
    document.getElementById('campaignThumbnail').value = '';
    document.getElementById('thumbnailPreview').style.display = 'none';
    document.getElementById('thumbnailPreviewImage').src = '';
    document.getElementById('thumbnailInfo').textContent = '';
    this.thumbnailData = null;
  }



  async handleCreateCampaign() {
    try {
      const channelType = document.getElementById('campaignChannelType').value;
      const slots = parseInt(document.getElementById('campaignSlots').value || 10);
      
      if (!channelType) {
        alert('캠페인 채널을 선택해주세요');
        return;
      }
      
      if (slots < 10) {
        alert('모집인원은 최소 10명 이상이어야 합니다');
        return;
      }
      
      // 미션 수집
      const missions = [];
      const missionContainer = document.getElementById('missionContainer');
      if (missionContainer) {
        const missionInputs = missionContainer.querySelectorAll('input[id^="mission"]');
        missionInputs.forEach(input => {
          if (input.value.trim()) {
            missions.push(input.value.trim());
          }
        });
      }
      
      // 과금 방식 데이터 수집
      const pricingType = document.querySelector('input[name="pricingType"]:checked')?.value || 'product_only';
      const productValueInput = document.getElementById('campaignProductValue');
      const spherePointsInput = document.getElementById('campaignSpherePoints');
      const productValue = this.getNumericValue(productValueInput);
      const spherePoints = this.getNumericValue(spherePointsInput);
      
      // 포인트만 지급인 경우
      if (pricingType === 'points_only') {
        if (spherePoints <= 0) {
          alert('스피어포인트를 입력해주세요 (최소 1P 이상)');
          return;
        }
      }
      // 상품/이용권만인 경우
      else if (pricingType === 'product_only' || pricingType === 'voucher_only') {
        if (productValue <= 0) {
          alert('상품/이용권 가치를 입력해주세요');
          return;
        }
      }
      // 포인트 포함 타입인 경우 (구매+포인트, 상품+포인트, 이용권+포인트)
      else if (pricingType === 'purchase_with_points' || pricingType === 'product_with_points' || pricingType === 'voucher_with_points') {
        if (productValue <= 0) {
          alert('상품/이용권 가치를 입력해주세요');
          return;
        }
        if (spherePoints <= 0) {
          alert('스피어포인트를 입력해주세요 (최소 1P 이상)');
          return;
        }
      }
      
      // 숫자 필드에서 콤마 제거하고 순수 숫자만 추출
      const budgetInput = document.getElementById('campaignBudget');
      const budget = budgetInput ? this.getNumericValue(budgetInput) : null;
      
      const data = {
        title: document.getElementById('campaignTitle').value,
        description: document.getElementById('campaignDescription').value,
        product_name: document.getElementById('campaignProductName').value,
        product_url: document.getElementById('campaignProductUrl').value,
        requirements: document.getElementById('campaignRequirements').value,
        budget: budget || null,
        slots: slots,
        point_reward: 0, // 기존 필드는 0으로 설정 (하위 호환성)
        
        // 새로운 과금 방식 필드
        pricing_type: pricingType,
        product_value: productValue,
        sphere_points: spherePoints,
        
        // 썸네일 이미지
        thumbnail_image: this.thumbnailData || null,
        
        // 채널 정보
        channel_type: channelType,
        instagram_mention_account: channelType === 'instagram' ? document.getElementById('instagramMentionAccount')?.value : null,
        blog_product_url: channelType === 'blog' ? document.getElementById('blogProductUrl')?.value : null,
        youtube_purchase_link: channelType === 'youtube' ? document.getElementById('youtubePurchaseLink')?.value : null,
        smartstore_product_url: channelType === 'smartstore' ? document.getElementById('smartstoreProductUrl')?.value : null,
        
        // 일정 관리
        application_start_date: document.getElementById('campaignApplicationStartDate').value || null,
        application_end_date: document.getElementById('campaignApplicationEndDate').value || null,
        announcement_date: document.getElementById('campaignAnnouncementDate').value || null,
        content_start_date: document.getElementById('campaignContentStartDate').value || null,
        content_end_date: document.getElementById('campaignContentEndDate').value || null,
        result_announcement_date: document.getElementById('campaignResultAnnouncementDate').value || null,
        
        // 캠페인 상세 정보
        provided_items: document.getElementById('campaignProvidedItems').value,
        mission: missions.join('\n'), // 미션 배열을 줄바꿈으로 연결
        keywords: document.getElementById('campaignKeywords').value,
        notes: document.getElementById('campaignNotes').value,
      };

      // 비용 정보 계산 및 확인
      try {
        const pricing = await PricingUtils.calculateFullPricing(pricingType, productValue, spherePoints);
        const totalCost = pricing.total_cost * slots;
        
        const pricingTypeName = PricingUtils.getPricingTypeName(pricingType);
        let confirmMessage = `캠페인 등록 신청을 하시겠습니까?\n\n`;
        confirmMessage += `과금 방식: ${pricingTypeName}\n`;
        confirmMessage += `모집인원: ${slots}명\n`;
        confirmMessage += `1명당 비용: ${PricingUtils.formatNumber(pricing.total_cost)}원\n`;
        confirmMessage += `전체 광고주 지출: ${PricingUtils.formatNumber(totalCost)}원\n\n`;
        confirmMessage += `관리자 승인 후 인플루언서들이 참여 신청을 할 수 있습니다.`;
        
        if (!confirm(confirmMessage)) {
          return;
        }
      } catch (error) {
        console.error('Calculate pricing error:', error);
        if (!confirm('캠페인 등록 신청을 하시겠습니까?\n\n관리자 승인 후 인플루언서들이 참여 신청을 할 수 있습니다.')) {
          return;
        }
      }

      const response = await axios.post('/api/campaigns', data, this.getAuthHeaders());
      alert('캠페인 등록 신청이 완료되었습니다.\n관리자 승인 후 진행됩니다.');
      
      // 역할에 따라 적절한 페이지로 이동
      if (this.user.role === 'admin') {
        this.showAdminCampaigns();
      } else if (this.user.role === 'advertiser' || this.user.role === 'agency' || this.user.role === 'rep') {
        this.showAdvertiserCampaigns();
      } else {
        this.showMyPage();
      }
    } catch (error) {
      alert(error.response?.data?.error || '캠페인 등록에 실패했습니다');
    }
  }

  // 캠페인 이대로 진행 (recruiting → in_progress)
  async proceedCampaign(campaignId) {
    if (!confirm('선정을 완료하고 캠페인을 진행하시겠습니까?\n\n진행 후에는 배송정보를 확인할 수 있습니다.')) {
      return;
    }

    try {
      await axios.put(`/api/campaigns/${campaignId}/status`, 
        { status: 'in_progress' }, 
        this.getAuthHeaders()
      );
      alert('캠페인이 진행중 상태로 변경되었습니다.');
      
      // 역할에 따라 적절한 페이지로 이동
      if (this.user.role === 'admin') {
        this.showAdminCampaigns();
      } else if (this.user.role === 'advertiser' || this.user.role === 'agency' || this.user.role === 'rep') {
        this.showAdvertiserCampaigns();
      } else {
        this.showMyPage();
      }
    } catch (error) {
      console.error('Campaign proceed error:', error);
      alert(error.response?.data?.error || '상태 변경에 실패했습니다');
    }
  }

  async editCampaign(campaignId) {
    try {
      // 캠페인 데이터 가져오기
      const response = await axios.get(`/api/campaigns/${campaignId}`, this.getAuthHeaders());
      const campaign = response.data;
      
      // 광고주 권한 체크: 신청 시작일 이후 또는 승인된 캠페인은 수정 불가
      if (this.user.role !== 'admin') {
        const today = new Date().toISOString().split('T')[0];
        
        if (campaign.status === 'recruiting' || campaign.status === 'in_progress' || campaign.status === 'suspended') {
          alert('승인된 캠페인은 수정할 수 없습니다.\n수정이 필요한 경우 관리자에게 문의해주세요.');
          return;
        }
        
        if (campaign.application_start_date && campaign.application_start_date < today) {
          alert('신청 시작일 이후에는 캠페인을 수정할 수 없습니다.\n수정이 필요한 경우 관리자에게 문의해주세요.');
          return;
        }
      }
      
      // showCreateCampaign과 동일한 폼 표시
      await this.showCreateCampaign();
      
      // 폼 제목 변경 및 데이터 채우기 (datepicker 초기화 대기: 300ms)
      setTimeout(() => {
        const formTitle = document.querySelector('h2');
        if (formTitle && formTitle.textContent.includes('캠페인 등록')) {
          formTitle.innerHTML = '<i class="fas fa-edit text-purple-600 mr-2"></i>캠페인 수정';
        }
        
        // 기존 데이터 채우기
        document.getElementById('campaignTitle').value = campaign.title || '';
        document.getElementById('campaignDescription').value = campaign.description || '';
        document.getElementById('campaignSlots').value = campaign.slots || 10;
        
        // 채널 타입 선택
        const channelTypeSelect = document.getElementById('campaignChannelType');
        if (channelTypeSelect && campaign.channel_type) {
          channelTypeSelect.value = campaign.channel_type;
          this.handleChannelChange(); // 채널별 필드 표시
        }
        
        // 채널별 필드 채우기
        setTimeout(() => {
          if (campaign.channel_type === 'instagram' && campaign.instagram_mention_account) {
            const instagramField = document.getElementById('instagramMentionAccount');
            if (instagramField) instagramField.value = campaign.instagram_mention_account;
          } else if (campaign.channel_type === 'blog' && campaign.blog_product_url) {
            const blogField = document.getElementById('blogProductUrl');
            if (blogField) blogField.value = campaign.blog_product_url;
          } else if (campaign.channel_type === 'youtube' && campaign.youtube_purchase_link) {
            const youtubeField = document.getElementById('youtubePurchaseLink');
            if (youtubeField) youtubeField.value = campaign.youtube_purchase_link;
          }
        }, 100);
        
        // 날짜 필드 채우기
        if (this.campaignDatePickers) {
          if (campaign.application_start_date) {
            this.campaignDatePickers.applicationStart.setDate(campaign.application_start_date);
          }
          if (campaign.application_end_date) {
            this.campaignDatePickers.applicationEnd.setDate(campaign.application_end_date);
          }
          if (campaign.announcement_date) {
            this.campaignDatePickers.announcement.setDate(campaign.announcement_date);
          }
          if (campaign.content_start_date) {
            this.campaignDatePickers.contentStart.setDate(campaign.content_start_date);
          }
          if (campaign.content_end_date) {
            this.campaignDatePickers.contentEnd.setDate(campaign.content_end_date);
          }
          if (campaign.result_announcement_date) {
            this.campaignDatePickers.resultAnnouncement.setDate(campaign.result_announcement_date);
          }
        }
        
        // 제공 내역
        document.getElementById('campaignProvidedItems').value = campaign.provided_items || '';
        document.getElementById('campaignProductName').value = campaign.product_name || '';
        document.getElementById('campaignProductUrl').value = campaign.product_url || '';
        
        // 예상 가액 (숫자 포맷)
        const budgetField = document.getElementById('campaignBudget');
        if (budgetField && campaign.budget) {
          budgetField.value = campaign.budget.toLocaleString();
        }
        
        // 미션 필드 초기화 및 채우기
        const missionContainer = document.getElementById('missionContainer');
        if (missionContainer && campaign.mission) {
          missionContainer.innerHTML = ''; // 기존 필드 제거
          const missions = campaign.mission.split('\n').filter(m => m.trim());
          missions.forEach((mission, index) => {
            this.addMissionField();
            const missionInput = document.getElementById(`mission${index + 1}`);
            if (missionInput) missionInput.value = mission.trim();
          });
          // 최소 5개 필드 유지
          while (missionContainer.children.length < 5) {
            this.addMissionField();
          }
        }
        
        // 요구사항
        document.getElementById('campaignRequirements').value = campaign.requirements || '';
        
        // 키워드 (해시태그)
        if (campaign.keywords) {
          this.keywords = []; // 초기화
          const keywords = campaign.keywords.split(',').map(k => k.trim()).filter(k => k);
          keywords.forEach(keyword => {
            this.addKeyword(keyword);
          });
        }
        
        // 유의사항
        document.getElementById('campaignNotes').value = campaign.notes || `1. 제공받은 제품은 타인에게 양도 및 판매, 교환이 불가능 하며 적발 시 제품 가격 환불 및 캠페인 참여가 제한됩니다.

2. 리뷰 콘텐츠 등록 기간 내 리뷰 콘텐츠 미등록 시 제품 가격에 대하여 비용이 청구됩니다.

3. 선정 후 단순 변심에 의한 제공내역 옵션 및 배송지 변경은 어렵습니다.

4. 안내된 제공 내역과 다르거나, 별도 공지 없이 3일 이상 배송이 진행되지 않을 경우에는 1:1문의로 연락해주세요.

5. 업체측 요청에 따라 리뷰어 선정 인원수가 변경될 수 있습니다.

6. 리뷰 콘텐츠 작성 시 선정 된 리뷰 캠페인의 제품으로만 촬영이 이루어져야 합니다.

7. 작성한 리뷰 콘텐츠는 캠페인 마감일을 기준으로 6개월간 유지되어야 하며, 유지되지 않을 경우 페널티가 부과됩니다.

8. 체험하신 블로거분들의 리뷰 콘텐츠는 업체 홍보로 이용될 수 있습니다.`;
        
        // 과금 방식 선택
        console.log('[editCampaign] 캠페인 데이터:', {
          pricing_type: campaign.pricing_type,
          product_value: campaign.product_value,
          sphere_points: campaign.sphere_points,
          point_reward: campaign.point_reward
        });
        
        if (campaign.pricing_type) {
          const pricingRadio = document.querySelector(`input[name="pricingType"][value="${campaign.pricing_type}"]`);
          console.log('[editCampaign] 과금 방식 라디오 버튼:', pricingRadio);
          if (pricingRadio) {
            pricingRadio.checked = true;
            console.log('[editCampaign] handlePricingTypeChange 호출 전');
            this.handlePricingTypeChange(); // 과금 방식에 따른 필드 표시
            console.log('[editCampaign] handlePricingTypeChange 호출 후');
          }
        }
        
        // 과금 방식별 필드 값 설정 (handlePricingTypeChange 후 DOM 업데이트 대기)
        setTimeout(() => {
          console.log('[editCampaign] setTimeout 150ms 후 필드 값 설정 시작');
          
          // 제품 가액
          const productValueField = document.getElementById('campaignProductValue');
          console.log('[editCampaign] 제품 가액 필드:', productValueField, '값:', campaign.product_value);
          if (productValueField && campaign.product_value) {
            productValueField.value = campaign.product_value.toLocaleString();
          }
          
          // 스피어포인트
          const spherePointsField = document.getElementById('campaignSpherePoints');
          console.log('[editCampaign] 스피어포인트 필드:', spherePointsField, '값:', campaign.sphere_points);
          if (spherePointsField && campaign.sphere_points) {
            spherePointsField.value = campaign.sphere_points.toLocaleString();
          }
          
          // 포인트 리워드
          const pointRewardField = document.getElementById('campaignPointReward');
          console.log('[editCampaign] 포인트 리워드 필드:', pointRewardField, '값:', campaign.point_reward);
          if (pointRewardField && campaign.point_reward) {
            pointRewardField.value = campaign.point_reward.toLocaleString();
          }
          
          // 비용 재계산
          console.log('[editCampaign] calculateNewPricingCost 호출');
          this.calculateNewPricingCost();
        }, 150); // DOM 업데이트 완료 대기
        
        // 제출 버튼 변경
        const form = document.getElementById('createCampaignForm');
        if (form) {
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.textContent = '캠페인 수정';
            submitBtn.onclick = (e) => {
              e.preventDefault();
              this.handleUpdateCampaign(campaignId);
            };
          }
        }
      }, 400); // 과금 정보 설정을 위해 시간 늘림
      
    } catch (error) {
      console.error('Edit campaign error:', error);
      alert(error.response?.data?.error || '캠페인 정보를 불러오는데 실패했습니다');
    }
  }

  async copyCampaign(campaignId) {
    try {
      // 캠페인 데이터 가져오기
      const response = await axios.get(`/api/campaigns/${campaignId}`, this.getAuthHeaders());
      const campaign = response.data;
      
      if (!confirm('이 캠페인을 복사하시겠습니까?\n모든 내용이 복사되며, 날짜만 새로 지정하면 됩니다.')) {
        return;
      }
      
      // showCreateCampaign과 동일한 폼 표시
      await this.showCreateCampaign();
      
      // 폼 제목 변경 및 데이터 채우기 (datepicker 초기화 대기: 300ms)
      setTimeout(() => {
        const formTitle = document.querySelector('h2');
        if (formTitle && formTitle.textContent.includes('캠페인 등록')) {
          formTitle.innerHTML = '<i class="fas fa-copy text-green-600 mr-2"></i>캠페인 복사';
        }
        
        // 기존 데이터 채우기 (제목에 "(복사본)" 추가)
        document.getElementById('campaignTitle').value = campaign.title + ' (복사본)';
        document.getElementById('campaignDescription').value = campaign.description || '';
        document.getElementById('campaignSlots').value = campaign.slots || 10;
        
        // 채널 타입 선택
        const channelTypeSelect = document.getElementById('campaignChannelType');
        if (channelTypeSelect && campaign.channel_type) {
          channelTypeSelect.value = campaign.channel_type;
          this.handleChannelChange(); // 채널별 필드 표시
        }
        
        // 채널별 필드 채우기
        setTimeout(() => {
          if (campaign.channel_type === 'instagram' && campaign.instagram_mention_account) {
            const instagramField = document.getElementById('instagramMentionAccount');
            if (instagramField) instagramField.value = campaign.instagram_mention_account;
          } else if (campaign.channel_type === 'blog' && campaign.blog_product_url) {
            const blogField = document.getElementById('blogProductUrl');
            if (blogField) blogField.value = campaign.blog_product_url;
          } else if (campaign.channel_type === 'youtube' && campaign.youtube_purchase_link) {
            const youtubeField = document.getElementById('youtubePurchaseLink');
            if (youtubeField) youtubeField.value = campaign.youtube_purchase_link;
          } else if (campaign.channel_type === 'smartstore' && campaign.smartstore_product_url) {
            const smartstoreField = document.getElementById('smartstoreProductUrl');
            if (smartstoreField) smartstoreField.value = campaign.smartstore_product_url;
          }
        }, 100);
        
        // 날짜 필드도 복사 (광고주가 필요시 수정)
        if (this.campaignDatePickers) {
          if (campaign.application_start_date) {
            this.campaignDatePickers.applicationStart.setDate(campaign.application_start_date);
          }
          if (campaign.application_end_date) {
            this.campaignDatePickers.applicationEnd.setDate(campaign.application_end_date);
          }
          if (campaign.announcement_date) {
            this.campaignDatePickers.announcement.setDate(campaign.announcement_date);
          }
          if (campaign.content_start_date) {
            this.campaignDatePickers.contentStart.setDate(campaign.content_start_date);
          }
          if (campaign.content_end_date) {
            this.campaignDatePickers.contentEnd.setDate(campaign.content_end_date);
          }
          if (campaign.result_announcement_date) {
            this.campaignDatePickers.resultAnnouncement.setDate(campaign.result_announcement_date);
          }
        }
        
        // 제공 내역
        document.getElementById('campaignProvidedItems').value = campaign.provided_items || '';
        document.getElementById('campaignProductName').value = campaign.product_name || '';
        document.getElementById('campaignProductUrl').value = campaign.product_url || '';
        
        // 예상 가액 (숫자 포맷)
        const budgetField = document.getElementById('campaignBudget');
        if (budgetField && campaign.budget) {
          budgetField.value = campaign.budget.toLocaleString();
        }
        
        // 미션 필드 초기화 및 채우기
        const missionContainer = document.getElementById('missionContainer');
        if (missionContainer && campaign.mission) {
          missionContainer.innerHTML = ''; // 기존 필드 제거
          const missions = campaign.mission.split('\n').filter(m => m.trim());
          missions.forEach((mission, index) => {
            this.addMissionField();
            const missionInput = document.getElementById(`mission${index + 1}`);
            if (missionInput) missionInput.value = mission.trim();
          });
          // 최소 5개 필드 유지
          while (missionContainer.children.length < 5) {
            this.addMissionField();
          }
        }
        
        // 요구사항
        document.getElementById('campaignRequirements').value = campaign.requirements || '';
        
        // 키워드 (해시태그)
        if (campaign.keywords) {
          this.keywords = []; // 초기화
          const keywords = campaign.keywords.split(',').map(k => k.trim()).filter(k => k);
          keywords.forEach(keyword => {
            this.addKeyword(keyword);
          });
        }
        
        // 유의사항
        document.getElementById('campaignNotes').value = campaign.notes || `1. 제공받은 제품은 타인에게 양도 및 판매, 교환이 불가능 하며 적발 시 제품 가격 환불 및 캠페인 참여가 제한됩니다.

2. 리뷰 콘텐츠 등록 기간 내 리뷰 콘텐츠 미등록 시 제품 가격에 대하여 비용이 청구됩니다.

3. 선정 후 단순 변심에 의한 제공내역 옵션 및 배송지 변경은 어렵습니다.

4. 안내된 제공 내역과 다르거나, 별도 공지 없이 3일 이상 배송이 진행되지 않을 경우에는 1:1문의로 연락해주세요.

5. 업체측 요청에 따라 리뷰어 선정 인원수가 변경될 수 있습니다.

6. 리뷰 콘텐츠 작성 시 선정 된 리뷰 캠페인의 제품으로만 촬영이 이루어져야 합니다.

7. 작성한 리뷰 콘텐츠는 캠페인 마감일을 기준으로 6개월간 유지되어야 하며, 유지되지 않을 경우 페널티가 부과됩니다.

8. 체험하신 블로거분들의 리뷰 콘텐츠는 업체 홍보로 이용될 수 있습니다.`;
        
        // 과금 방식 선택
        if (campaign.pricing_type) {
          const pricingRadio = document.querySelector(`input[name="pricingType"][value="${campaign.pricing_type}"]`);
          if (pricingRadio) {
            pricingRadio.checked = true;
            this.handlePricingTypeChange(); // 과금 방식에 따른 필드 표시
          }
        }
        
        // 과금 방식별 필드 값 설정 (handlePricingTypeChange 후 DOM 업데이트 대기)
        setTimeout(() => {
          // 제품 가액
          const productValueField = document.getElementById('campaignProductValue');
          if (productValueField && campaign.product_value) {
            productValueField.value = campaign.product_value.toLocaleString();
          }
          
          // 스피어포인트
          const spherePointsField = document.getElementById('campaignSpherePoints');
          if (spherePointsField && campaign.sphere_points) {
            spherePointsField.value = campaign.sphere_points.toLocaleString();
          }
          
          // 포인트 리워드
          const pointRewardField = document.getElementById('campaignPointReward');
          if (pointRewardField && campaign.point_reward) {
            pointRewardField.value = campaign.point_reward.toLocaleString();
          }
          
          // 비용 재계산
          this.calculateNewPricingCost();
        }, 150); // DOM 업데이트 완료 대기
        
        // 제출 버튼은 기본 "캠페인 등록" 그대로 사용
        // 새로운 캠페인으로 등록됨
        
      }, 300);
      
    } catch (error) {
      console.error('Copy campaign error:', error);
      alert(error.response?.data?.error || '캠페인 정보를 불러오는데 실패했습니다');
    }
  }
  
  async handleUpdateCampaign(campaignId) {
    try {
      const channelType = document.getElementById('campaignChannelType').value;
      const slots = parseInt(document.getElementById('campaignSlots').value || 10);
      
      if (!channelType) {
        alert('캠페인 채널을 선택해주세요');
        return;
      }
      
      if (slots < 10) {
        alert('모집인원은 최소 10명 이상이어야 합니다');
        return;
      }
      
      // 미션 수집
      const missions = [];
      const missionContainer = document.getElementById('missionContainer');
      if (missionContainer) {
        const missionInputs = missionContainer.querySelectorAll('input[id^="mission"]');
        missionInputs.forEach(input => {
          if (input.value.trim()) {
            missions.push(input.value.trim());
          }
        });
      }
      
      // 숫자 필드에서 콤마 제거하고 순수 숫자만 추출
      const budgetInput = document.getElementById('campaignBudget');
      const pointRewardInput = document.getElementById('campaignPointReward');
      
      const budget = this.getNumericValue(budgetInput);
      const pointReward = this.getNumericValue(pointRewardInput);
      
      // 과금 방식 관련 필드
      const pricingTypeElement = document.querySelector('input[name="pricingType"]:checked');
      const productValueInput = document.getElementById('campaignProductValue');
      const spherePointsInput = document.getElementById('campaignSpherePoints');
      
      const pricingType = pricingTypeElement ? pricingTypeElement.value : 'product_only';
      const productValue = this.getNumericValue(productValueInput);
      const spherePoints = this.getNumericValue(spherePointsInput);
      
      const data = {
        title: document.getElementById('campaignTitle').value,
        description: document.getElementById('campaignDescription').value,
        product_name: document.getElementById('campaignProductName').value,
        product_url: document.getElementById('campaignProductUrl').value,
        requirements: document.getElementById('campaignRequirements').value,
        budget: budget || null,
        slots: slots,
        point_reward: pointReward,
        
        // 과금 방식
        pricing_type: pricingType,
        product_value: productValue || 0,
        sphere_points: spherePoints || 0,
        
        // 썸네일 이미지 (수정 시 새로 업로드한 경우만)
        thumbnail_image: this.thumbnailData || null,
        
        // 채널 정보
        channel_type: channelType,
        instagram_mention_account: channelType === 'instagram' ? document.getElementById('instagramMentionAccount')?.value : null,
        blog_product_url: channelType === 'blog' ? document.getElementById('blogProductUrl')?.value : null,
        youtube_purchase_link: channelType === 'youtube' ? document.getElementById('youtubePurchaseLink')?.value : null,
        smartstore_product_url: channelType === 'smartstore' ? document.getElementById('smartstoreProductUrl')?.value : null,
        
        // 일정 관리
        application_start_date: document.getElementById('campaignApplicationStartDate').value || null,
        application_end_date: document.getElementById('campaignApplicationEndDate').value || null,
        announcement_date: document.getElementById('campaignAnnouncementDate').value || null,
        content_start_date: document.getElementById('campaignContentStartDate').value || null,
        content_end_date: document.getElementById('campaignContentEndDate').value || null,
        result_announcement_date: document.getElementById('campaignResultAnnouncementDate').value || null,
        
        // 캠페인 상세 정보
        provided_items: document.getElementById('campaignProvidedItems').value,
        mission: missions.join('\n'), // 미션 배열을 줄바꿈으로 연결
        keywords: document.getElementById('campaignKeywords').value,
        notes: document.getElementById('campaignNotes').value,
      };
      
      // 관리자인 경우 결제 상태도 함께 전송
      if (this.user.role === 'admin') {
        const paymentStatusSelect = document.getElementById('campaignPaymentStatus');
        if (paymentStatusSelect) {
          data.payment_status = paymentStatusSelect.value;
        }
      }

      if (!confirm('캠페인을 수정하시겠습니까?')) {
        return;
      }

      const response = await axios.put(`/api/campaigns/${campaignId}`, data, this.getAuthHeaders());
      alert('캠페인이 수정되었습니다.');
      
      // 역할에 따라 적절한 페이지로 이동
      if (this.user.role === 'admin') {
        this.showAdminCampaigns();
      } else if (this.user.role === 'advertiser' || this.user.role === 'agency' || this.user.role === 'rep') {
        this.showAdvertiserCampaigns();
      } else {
        this.showMyPage();
      }
    } catch (error) {
      console.error('Update campaign error:', error);
      alert(error.response?.data?.error || '캠페인 수정에 실패했습니다');
    }
  }
  
  // 관리자 전용 캠페인 수정 함수
  async editCampaignAsAdmin(campaignId) {
    try {
      // 캠페인 데이터 가져오기
      const response = await axios.get(`/api/campaigns/${campaignId}`, this.getAuthHeaders());
      const campaign = response.data;
      
      // showCreateCampaign과 동일한 폼 표시
      await this.showCreateCampaign();
      
      // 폼 제목 변경 및 데이터 채우기 (datepicker 초기화 대기: 300ms)
      setTimeout(() => {
        const formTitle = document.querySelector('h2');
        if (formTitle && formTitle.textContent.includes('캠페인 등록')) {
          formTitle.innerHTML = '<i class="fas fa-edit text-purple-600 mr-2"></i>캠페인 수정 (관리자)';
        }
        
        // 기존 데이터 채우기
        document.getElementById('campaignTitle').value = campaign.title || '';
        document.getElementById('campaignDescription').value = campaign.description || '';
        document.getElementById('campaignSlots').value = campaign.slots || 10;
        
        // 채널 타입 선택
        const channelTypeSelect = document.getElementById('campaignChannelType');
        if (channelTypeSelect && campaign.channel_type) {
          channelTypeSelect.value = campaign.channel_type;
          this.handleChannelChange(); // 채널별 필드 표시
        }
        
        // 채널별 필드 채우기
        setTimeout(() => {
          if (campaign.channel_type === 'instagram' && campaign.instagram_mention_account) {
            const instagramField = document.getElementById('instagramMentionAccount');
            if (instagramField) instagramField.value = campaign.instagram_mention_account;
          } else if (campaign.channel_type === 'blog' && campaign.blog_product_url) {
            const blogField = document.getElementById('blogProductUrl');
            if (blogField) blogField.value = campaign.blog_product_url;
          } else if (campaign.channel_type === 'youtube' && campaign.youtube_purchase_link) {
            const youtubeField = document.getElementById('youtubePurchaseLink');
            if (youtubeField) youtubeField.value = campaign.youtube_purchase_link;
          }
        }, 100);
        
        // 날짜 필드 채우기
        if (this.campaignDatePickers) {
          if (campaign.application_start_date) {
            this.campaignDatePickers.applicationStart.setDate(campaign.application_start_date);
          }
          if (campaign.application_end_date) {
            this.campaignDatePickers.applicationEnd.setDate(campaign.application_end_date);
          }
          if (campaign.announcement_date) {
            this.campaignDatePickers.announcement.setDate(campaign.announcement_date);
          }
          if (campaign.content_start_date) {
            this.campaignDatePickers.contentStart.setDate(campaign.content_start_date);
          }
          if (campaign.content_end_date) {
            this.campaignDatePickers.contentEnd.setDate(campaign.content_end_date);
          }
          if (campaign.result_announcement_date) {
            this.campaignDatePickers.resultAnnouncement.setDate(campaign.result_announcement_date);
          }
        }
        
        // 제공 내역
        document.getElementById('campaignProvidedItems').value = campaign.provided_items || '';
        document.getElementById('campaignProductName').value = campaign.product_name || '';
        document.getElementById('campaignProductUrl').value = campaign.product_url || '';
        
        // 예상 가액 (숫자 포맷)
        const budgetField = document.getElementById('campaignBudget');
        if (budgetField && campaign.budget) {
          budgetField.value = campaign.budget.toLocaleString();
        }
        
        // 미션 필드 초기화 및 채우기
        const missionContainer = document.getElementById('missionContainer');
        if (missionContainer && campaign.mission) {
          missionContainer.innerHTML = ''; // 기존 필드 제거
          const missions = campaign.mission.split('\n').filter(m => m.trim());
          missions.forEach((mission, index) => {
            this.addMissionField();
            const missionInput = document.getElementById(`mission${index + 1}`);
            if (missionInput) missionInput.value = mission.trim();
          });
          // 최소 5개 필드 유지
          while (missionContainer.children.length < 5) {
            this.addMissionField();
          }
        }
        
        // 요구사항
        document.getElementById('campaignRequirements').value = campaign.requirements || '';
        
        // 키워드 (해시태그)
        if (campaign.keywords) {
          this.keywords = []; // 초기화
          const keywords = campaign.keywords.split(',').map(k => k.trim()).filter(k => k);
          keywords.forEach(keyword => {
            this.addKeyword(keyword);
          });
        }
        
        // 유의사항
        document.getElementById('campaignNotes').value = campaign.notes || `1. 제공받은 제품은 타인에게 양도 및 판매, 교환이 불가능 하며 적발 시 제품 가격 환불 및 캠페인 참여가 제한됩니다.

2. 리뷰 콘텐츠 등록 기간 내 리뷰 콘텐츠 미등록 시 제품 가격에 대하여 비용이 청구됩니다.

3. 선정 후 단순 변심에 의한 제공내역 옵션 및 배송지 변경은 어렵습니다.

4. 안내된 제공 내역과 다르거나, 별도 공지 없이 3일 이상 배송이 진행되지 않을 경우에는 1:1문의로 연락해주세요.

5. 업체측 요청에 따라 리뷰어 선정 인원수가 변경될 수 있습니다.

6. 리뷰 콘텐츠 작성 시 선정 된 리뷰 캠페인의 제품으로만 촬영이 이루어져야 합니다.

7. 작성한 리뷰 콘텐츠는 캠페인 마감일을 기준으로 6개월간 유지되어야 하며, 유지되지 않을 경우 페널티가 부과됩니다.

8. 체험하신 블로거분들의 리뷰 콘텐츠는 업체 홍보로 이용될 수 있습니다.`;
        
        // 과금 방식 선택
        if (campaign.pricing_type) {
          const pricingRadio = document.querySelector(`input[name="pricingType"][value="${campaign.pricing_type}"]`);
          if (pricingRadio) {
            pricingRadio.checked = true;
            this.handlePricingTypeChange(); // 과금 방식에 따른 필드 표시
          }
        }
        
        // 과금 방식별 필드 값 설정 (handlePricingTypeChange 후 DOM 업데이트 대기)
        setTimeout(() => {
          // 제품 가액
          const productValueField = document.getElementById('campaignProductValue');
          if (productValueField && campaign.product_value) {
            productValueField.value = campaign.product_value.toLocaleString();
          }
          
          // 스피어포인트
          const spherePointsField = document.getElementById('campaignSpherePoints');
          if (spherePointsField && campaign.sphere_points) {
            spherePointsField.value = campaign.sphere_points.toLocaleString();
          }
          
          // 포인트 리워드
          const pointRewardField = document.getElementById('campaignPointReward');
          if (pointRewardField && campaign.point_reward) {
            pointRewardField.value = campaign.point_reward.toLocaleString();
          }
          
          // 비용 재계산
          this.calculateNewPricingCost();
        }, 150); // DOM 업데이트 완료 대기
        
        // 관리자 전용: 결제 상태 선택 필드 추가
        const pointSection = document.querySelector('.bg-purple-50');
        if (pointSection && campaign.point_reward > 0) {
          const paymentStatusHtml = `
            <div class="mt-4 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <h4 class="font-bold text-yellow-900 mb-2">
                <i class="fas fa-crown mr-1"></i>관리자 전용 - 결제 상태 변경
              </h4>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">결제 상태</label>
                <select id="campaignPaymentStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                  <option value="unpaid" ${campaign.payment_status === 'unpaid' ? 'selected' : ''}>⏳ 결제 대기</option>
                  <option value="paid" ${campaign.payment_status === 'paid' ? 'selected' : ''}>✓ 결제 완료</option>
                </select>
                <p class="text-xs text-gray-600 mt-1">결제 상태를 변경하면 광고주가 캠페인을 활성화할 수 있습니다</p>
              </div>
            </div>
          `;
          pointSection.insertAdjacentHTML('beforeend', paymentStatusHtml);
        }
        
        // 제출 버튼 변경
        const form = document.getElementById('createCampaignForm');
        if (form) {
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.textContent = '캠페인 수정 (관리자)';
            submitBtn.onclick = (e) => {
              e.preventDefault();
              this.handleUpdateCampaign(campaignId);
            };
          }
        }
      }, 300);
      
    } catch (error) {
      console.error('Edit campaign as admin error:', error);
      alert(error.response?.data?.error || '캠페인 정보를 불러오는데 실패했습니다');
    }
  }

  async viewApplications(campaignId) {
    try {
      // 캠페인 정보 가져오기 (상태 확인용)
      const campaignResponse = await axios.get(`/api/campaigns/${campaignId}`, this.getAuthHeaders());
      const campaign = campaignResponse.data;
      
      const response = await axios.get(`/api/campaigns/${campaignId}/applications`, this.getAuthHeaders());
      const applications = response.data;
      
      // Store current campaign ID for detail view
      this.currentCampaignId = campaignId;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow pb-20">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
              <button onclick="app.user.role === 'admin' ? app.showAdminCampaigns() : (app.user.role === 'advertiser' || app.user.role === 'agency' || app.user.role === 'rep') ? app.showAdvertiserCampaigns() : app.showMyPage()" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>캠페인관리로
              </button>

              <div class="flex justify-between items-center mb-6">
                <div>
                  <h2 class="text-2xl sm:text-3xl font-bold">지원자 목록</h2>
                  <span class="text-sm text-gray-600">총 <span class="font-bold text-purple-600">${applications.length}</span>명</span>
                </div>
                ${campaign.status === 'in_progress' && applications.some(a => a.status === 'approved') ? `
                  <button onclick="app.viewShippingInfo(${this.currentCampaignId})" 
                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center text-sm">
                    <i class="fas fa-shipping-fast mr-2"></i>배송정보 보기
                  </button>
                ` : ''}
              </div>
        
        ${applications.length === 0 ? '<p class="text-gray-600">아직 지원자가 없습니다</p>' : `
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          ${applications.map(a => {
            // 선정 취소 가능 여부 체크 (선정일 당일까지만 가능)
            const today = new Date().toISOString().split('T')[0];
            const canCancelSelection = !campaign.announcement_date || campaign.announcement_date >= today;
            
            // 채널 URL 생성
            const makeChannelUrl = (type, handle) => {
              if (!handle) return null;
              switch(type) {
                case 'instagram':
                  return handle.startsWith('http') ? handle : `https://instagram.com/${handle.replace('@', '')}`;
                case 'youtube':
                  return handle.startsWith('http') ? handle : `https://youtube.com/@${handle.replace('@', '')}`;
                case 'blog':
                  return handle.startsWith('http') ? handle : null;
                case 'tiktok':
                  return handle.startsWith('http') ? handle : `https://tiktok.com/@${handle.replace('@', '')}`;
                default:
                  return null;
              }
            };
            
            const instagramUrl = makeChannelUrl('instagram', a.instagram_handle);
            const youtubeUrl = makeChannelUrl('youtube', a.youtube_channel);
            const blogUrl = makeChannelUrl('blog', a.blog_url);
            const tiktokUrl = makeChannelUrl('tiktok', a.tiktok_handle);
            
            return `
            <div class="bg-white border-2 rounded-lg p-4 hover:border-purple-300 hover:shadow-lg transition">
              <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-lg">${a.nickname.replace('익명', '지원자')}</h3>
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${this.getApplicationStatusBadge(a.status)}">
                  ${this.getApplicationStatusText(a.status)}
                </span>
              </div>
              
              <!-- 채널 링크 (클릭 시 새 탭에서 열림) -->
              <div class="text-sm space-y-2 mb-3">
                ${a.instagram_handle ? `
                  <a href="${instagramUrl}" target="_blank" onclick="event.stopPropagation()" 
                    class="flex items-center text-pink-600 hover:text-pink-800 hover:underline">
                    <i class="fab fa-instagram mr-2"></i>
                    <span class="break-all">${a.instagram_handle}</span>
                    <i class="fas fa-external-link-alt text-xs ml-1"></i>
                  </a>
                ` : ''}
                ${a.blog_url ? `
                  <a href="${blogUrl}" target="_blank" onclick="event.stopPropagation()" 
                    class="flex items-center text-green-600 hover:text-green-800 hover:underline">
                    <i class="fas fa-blog mr-2"></i>
                    <span class="break-all">${a.blog_url}</span>
                    <i class="fas fa-external-link-alt text-xs ml-1"></i>
                  </a>
                ` : ''}
                ${a.youtube_channel ? `
                  <a href="${youtubeUrl}" target="_blank" onclick="event.stopPropagation()" 
                    class="flex items-center text-red-600 hover:text-red-800 hover:underline">
                    <i class="fab fa-youtube mr-2"></i>
                    <span class="break-all">${a.youtube_channel}</span>
                    <i class="fas fa-external-link-alt text-xs ml-1"></i>
                  </a>
                ` : ''}
                ${a.tiktok_handle ? `
                  <a href="${tiktokUrl}" target="_blank" onclick="event.stopPropagation()" 
                    class="flex items-center text-purple-600 hover:text-purple-800 hover:underline">
                    <i class="fab fa-tiktok mr-2"></i>
                    <span class="break-all">${a.tiktok_handle}</span>
                    <i class="fas fa-external-link-alt text-xs ml-1"></i>
                  </a>
                ` : ''}
              </div>
              
              <div class="text-xs text-gray-500 space-y-1 mb-3">
                <p>👥 팔로워: ${a.follower_count ? a.follower_count.toLocaleString() : '0'}명</p>
                <p>📂 카테고리: ${a.category || '미설정'}</p>
                <p>📅 ${new Date(a.applied_at).toLocaleDateString('ko-KR')}</p>
              </div>
              
              <!-- 액션 버튼 -->
              <div class="mt-3 pt-3 border-t">
                ${a.status === 'pending' ? `
                  <div class="flex gap-2">
                    <button onclick="event.stopPropagation(); app.updateApplicationStatus(${a.id}, 'approved', ${this.currentCampaignId}); app.viewApplications(${this.currentCampaignId});" 
                      class="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 text-sm font-semibold transition">
                      <i class="fas fa-check mr-1"></i>선정
                    </button>
                    <button onclick="event.stopPropagation(); app.updateApplicationStatus(${a.id}, 'rejected', ${this.currentCampaignId}); app.viewApplications(${this.currentCampaignId});" 
                      class="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 text-sm font-semibold transition">
                      <i class="fas fa-times mr-1"></i>거절
                    </button>
                  </div>
                ` : a.status === 'approved' ? `
                  ${canCancelSelection ? `
                    <button onclick="event.stopPropagation(); app.updateApplicationStatus(${a.id}, 'pending', ${this.currentCampaignId}); app.viewApplications(${this.currentCampaignId});" 
                      class="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 text-sm font-semibold transition">
                      <i class="fas fa-undo mr-1"></i>선정 취소
                    </button>
                  ` : `
                    <div class="text-center text-sm text-gray-500 py-2">
                      <i class="fas fa-lock mr-1"></i>선정발표일 이후 취소 불가
                    </div>
                  `}
                ` : a.status === 'rejected' ? `
                  <button onclick="event.stopPropagation(); app.updateApplicationStatus(${a.id}, 'pending', ${this.currentCampaignId}); app.viewApplications(${this.currentCampaignId});" 
                    class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold transition">
                    <i class="fas fa-redo mr-1"></i>재검토
                  </button>
                ` : ''}
              </div>
            </div>
            `;
          }).join('')}
          </div>
        `}
            </div>
          </div>
          
          ${UIUtils.renderBottomNav(this.user, 'mypage')}
          ${this.renderFooter()}
        </div>
      `;
    } catch (error) {
      alert(error.response?.data?.error || '지원자 목록을 불러오는데 실패했습니다');
    }
  }

  async viewApplicationDetail(applicationId) {
    try {
      // 캠페인 정보 가져오기 (선정 취소 가능 여부 확인용)
      const campaignResponse = await axios.get(`/api/campaigns/${this.currentCampaignId}`, this.getAuthHeaders());
      const campaign = campaignResponse.data;
      
      const response = await axios.get(`/api/campaigns/${this.currentCampaignId}/applications`, this.getAuthHeaders());
      const applications = response.data;
      const application = applications.find(a => a.id === applicationId);
      
      if (!application) {
        alert('지원자 정보를 찾을 수 없습니다');
        return;
      }
      
      // 선정 취소 가능 여부 체크 (선정일 당일까지만 가능)
      const today = new Date().toISOString().split('T')[0];
      const canCancelSelection = !campaign.announcement_date || campaign.announcement_date >= today;

      // SNS URL 생성 함수
      const makeChannelUrl = (type, handle) => {
        if (!handle || handle === '-') return null;
        switch(type) {
          case 'instagram':
            return handle.startsWith('http') ? handle : `https://instagram.com/${handle.replace('@', '')}`;
          case 'youtube':
            return handle.startsWith('http') ? handle : `https://youtube.com/@${handle.replace('@', '')}`;
          case 'blog':
            return handle.startsWith('http') ? handle : null;
          case 'tiktok':
            return handle.startsWith('http') ? handle : `https://tiktok.com/@${handle.replace('@', '')}`;
          default:
            return null;
        }
      };
      
      const instagramUrl = makeChannelUrl('instagram', application.instagram_handle);
      const youtubeUrl = makeChannelUrl('youtube', application.youtube_channel);
      const blogUrl = makeChannelUrl('blog', application.blog_url);
      const tiktokUrl = makeChannelUrl('tiktok', application.tiktok_handle);

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow">
            <div class="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
              <button onclick="app.viewApplications(${this.currentCampaignId})" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>목록으로
              </button>

              <div class="bg-white border-2 rounded-lg p-6 shadow-lg">
                <div class="flex justify-between items-start mb-6">
                  <div>
                    <h2 class="text-2xl font-bold">${application.nickname.replace('익명', '지원자')}</h2>
                  </div>
                  <span class="px-4 py-2 rounded-full text-sm font-semibold ${this.getApplicationStatusBadge(application.status)}">
                    ${this.getApplicationStatusText(application.status)}
                  </span>
                </div>

                <!-- 개인 정보 (보호) -->
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h4 class="font-semibold text-purple-900 mb-3 flex items-center">
                    <i class="fas fa-user-shield mr-2"></i>개인정보 보호
                  </h4>
                  <div class="text-sm text-gray-600">
                    <p class="flex items-center mb-2">
                      <i class="fas fa-lock mr-2 text-gray-400"></i>
                      인플루언서의 개인정보는 보호됩니다
                    </p>
                    <p class="text-xs text-gray-500">채널 정보를 기반으로 선정해주세요. 제품 발송은 배송 정보만으로 가능합니다.</p>
                  </div>
                </div>

                <!-- SNS 채널 -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 class="font-semibold text-blue-900 mb-3 flex items-center">
                    <i class="fas fa-share-alt mr-2"></i>SNS 채널
                  </h4>
                  <div class="space-y-2 text-sm">
                    <p class="flex items-center justify-between">
                      <strong>📸 인스타그램:</strong> 
                      ${instagramUrl ? `<a href="${instagramUrl}" target="_blank" class="text-pink-600 hover:text-pink-800 hover:underline">${application.instagram_handle} <i class="fas fa-external-link-alt text-xs ml-1"></i></a>` : '-'}
                    </p>
                    <p class="flex items-center justify-between">
                      <strong>🎥 유튜브:</strong> 
                      ${youtubeUrl ? `<a href="${youtubeUrl}" target="_blank" class="text-red-600 hover:text-red-800 hover:underline">${application.youtube_channel} <i class="fas fa-external-link-alt text-xs ml-1"></i></a>` : '-'}
                    </p>
                    <p class="flex items-center justify-between">
                      <strong>📝 블로그:</strong> 
                      ${blogUrl ? `<a href="${blogUrl}" target="_blank" class="text-green-600 hover:text-green-800 hover:underline break-all">${application.blog_url} <i class="fas fa-external-link-alt text-xs ml-1"></i></a>` : '-'}
                    </p>
                    <p class="flex items-center justify-between">
                      <strong>📱 틱톡:</strong> 
                      ${tiktokUrl ? `<a href="${tiktokUrl}" target="_blank" class="text-gray-600 hover:text-gray-800 hover:underline">${application.tiktok_handle} <i class="fas fa-external-link-alt text-xs ml-1"></i></a>` : '-'}
                    </p>
                    <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-300">
                      <p><strong>👥 팔로워:</strong> ${application.follower_count ? application.follower_count.toLocaleString() : '0'}명</p>
                      <p><strong>🏷️ 카테고리:</strong> ${application.category || '-'}</p>
                    </div>
                  </div>
                </div>

                <!-- 배송 정보 (보호) -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 class="font-semibold text-green-900 mb-3 flex items-center">
                    <i class="fas fa-truck mr-2"></i>배송 정보
                  </h4>
                  <div class="text-sm text-gray-600">
                    <p class="flex items-center mb-2">
                      <i class="fas fa-lock mr-2 text-gray-400"></i>
                      배송 정보는 보호됩니다
                    </p>
                    <p class="text-xs text-gray-500">
                      선정된 지원자의 배송 정보는 <strong>"배송정보 보기"</strong> 버튼을 통해 일괄 확인 가능합니다.
                    </p>
                  </div>
                </div>

                <!-- 지원 정보 -->
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                  <p class="text-xs text-gray-500">지원일: ${new Date(application.applied_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <!-- 액션 버튼 -->
                ${application.status === 'pending' ? `
                  <div class="flex gap-3">
                    <button onclick="app.updateApplicationStatus(${application.id}, 'approved', ${this.currentCampaignId}); app.viewApplicationDetail(${application.id});" 
                      class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition">
                      <i class="fas fa-check mr-2"></i>선정 확정
                    </button>
                    <button onclick="app.updateApplicationStatus(${application.id}, 'rejected', ${this.currentCampaignId}); app.viewApplicationDetail(${application.id});" 
                      class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition">
                      <i class="fas fa-times mr-2"></i>거절
                    </button>
                  </div>
                ` : application.status === 'approved' ? `
                  <div class="space-y-3">
                    ${canCancelSelection ? `
                      <button onclick="app.updateApplicationStatus(${application.id}, 'pending', ${this.currentCampaignId}); app.viewApplicationDetail(${application.id});" 
                        class="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 font-semibold transition">
                        <i class="fas fa-undo mr-2"></i>선정 취소
                      </button>
                      <p class="text-xs text-gray-500 text-center">
                        <i class="fas fa-info-circle mr-1"></i>선정을 취소하면 대기 상태로 되돌아갑니다
                      </p>
                    ` : `
                      <div class="text-center py-4 bg-gray-50 rounded-lg">
                        <i class="fas fa-lock text-gray-400 text-2xl mb-2"></i>
                        <p class="text-sm text-gray-600 font-medium">선정발표일 이후 취소 불가</p>
                        <p class="text-xs text-gray-500 mt-1">수정이 필요한 경우 관리자에게 문의해주세요</p>
                      </div>
                    `}
                  </div>
                ` : application.status === 'rejected' ? `
                  <div class="space-y-3">
                    <button onclick="app.updateApplicationStatus(${application.id}, 'pending', ${this.currentCampaignId}); app.viewApplicationDetail(${application.id});" 
                      class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition">
                      <i class="fas fa-redo mr-2"></i>재검토
                    </button>
                    <p class="text-xs text-gray-500 text-center">
                      <i class="fas fa-info-circle mr-1"></i>대기 상태로 되돌려 다시 검토할 수 있습니다
                    </p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          
          ${UIUtils.renderBottomNav(this.user, 'mypage')}
          ${this.renderFooter()}
        </div>
      `;
    } catch (error) {
      alert(error.response?.data?.error || '지원자 상세 정보를 불러오는데 실패했습니다');
    }
  }

  async updateApplicationStatus(applicationId, status, campaignId) {
    try {
      await axios.put(`/api/applications/${applicationId}/status`, { status }, this.getAuthHeaders());
      // Don't alert, just silently update
      return true;
    } catch (error) {
      alert(error.response?.data?.error || '처리에 실패했습니다');
      return false;
    }
  }

  async viewShippingInfo(campaignId) {
    try {
      const response = await axios.get(`/api/campaigns/${campaignId}/shipping-info`, this.getAuthHeaders());
      const shippingList = response.data;
      
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow">
            <div class="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
              <button onclick="app.viewApplications(${campaignId})" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>지원자 목록으로
              </button>

              <div class="bg-white border-2 rounded-lg p-6 shadow-lg">
                <h2 class="text-2xl font-bold mb-4 flex items-center">
                  <i class="fas fa-shipping-fast mr-3 text-green-600"></i>
                  선정된 지원자 배송 정보
                </h2>
                
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p class="text-sm text-yellow-800 flex items-start">
                    <i class="fas fa-exclamation-triangle mr-2 mt-1"></i>
                    <span>아래 정보는 선정 확정된 지원자들의 배송 정보만 표시됩니다. 채널 정보와 매칭되지 않도록 별도로 관리해주세요.</span>
                  </p>
                </div>

                ${shippingList.length === 0 ? `
                  <p class="text-gray-600 text-center py-8">아직 선정된 지원자가 없습니다</p>
                ` : `
                  <div class="space-y-4">
                    ${shippingList.map((shipping, index) => `
                      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                          <h3 class="font-bold text-lg text-purple-600">배송지 ${index + 1}</h3>
                          <span class="text-xs text-gray-500">지원번호: #${shipping.application_id}</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <p><strong>수령인:</strong> ${shipping.shipping_recipient}</p>
                          <p><strong>연락처:</strong> ${shipping.shipping_phone}</p>
                          <p><strong>우편번호:</strong> ${shipping.shipping_zipcode}</p>
                          <p class="md:col-span-2"><strong>주소:</strong> ${shipping.shipping_address}</p>
                          ${shipping.shipping_detail ? `<p class="md:col-span-2"><strong>상세주소:</strong> ${shipping.shipping_detail}</p>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>
          </div>
          
          ${UIUtils.renderBottomNav(this.user, 'mypage')}
          ${this.renderFooter()}
        </div>
      `;
    } catch (error) {
      alert(error.response?.data?.error || '배송 정보를 불러오는데 실패했습니다');
    }
  }

  async handleUpdateAdvertiserProfile() {
    try {
      const data = {
        company_name: document.getElementById('companyName').value,
        business_number: document.getElementById('businessNumber').value,
        representative_name: document.getElementById('representativeName').value,
        business_address: document.getElementById('businessAddress').value,
        contact_phone: document.getElementById('contactPhone').value,
        contact_email: document.getElementById('contactEmail').value,
      };

      await axios.put('/api/profile/advertiser', data, this.getAuthHeaders());
      alert('프로필이 업데이트되었습니다');
      
      // 마이페이지로 이동 (프로필 완성도 재확인)
      this.showMyPage();
    } catch (error) {
      alert(error.response?.data?.error || '프로필 업데이트에 실패했습니다');
    }
  }

  // ============================================
  // Influencer Dashboard
  // ============================================

  async showInfluencerMyPage() {
    // Load profile to get points balance and check completeness
    let pointsBalance = 0;
    let profileIncomplete = false;
    let profileData = null;
    try {
      const response = await axios.get('/api/profile/influencer', this.getAuthHeaders());
      profileData = response.data;
      pointsBalance = Number(profileData.sphere_points) || 0;
      console.log('[Mypage] Profile data:', profileData);
      console.log('[Mypage] Points balance:', pointsBalance);
      console.log('[Mypage] Can withdraw?', pointsBalance >= 50000);
      
      // 필수 항목 체크: 실명, 생년월일, 성별, 연락처, 은행명, 계좌번호, 예금주명, 배송지 정보
      if (!profileData.real_name || !profileData.birth_date || !profileData.gender || 
          !profileData.contact_phone || !profileData.bank_name || !profileData.account_number || 
          !profileData.account_holder_name || !profileData.shipping_name || 
          !profileData.shipping_phone || !profileData.shipping_postal_code || !profileData.shipping_address) {
        profileIncomplete = true;
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-user-circle text-purple-600 mr-2"></i>마이페이지
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">${this.user.nickname}님 (인플루언서)</p>
            </div>

            <!-- 포인트 카드 -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-5 sm:p-6 rounded-lg shadow-lg mb-4 sm:mb-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-xs sm:text-sm opacity-90 mb-1">보유 스피어포인트</p>
                  <h2 class="text-3xl sm:text-4xl font-bold">${pointsBalance.toLocaleString()} <span class="text-xl">P</span></h2>
                </div>
                <div class="text-4xl sm:text-5xl opacity-80">
                  <i class="fas fa-coins"></i>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs sm:text-sm opacity-75">
                  <i class="fas fa-info-circle mr-1"></i>포인트는 캠페인 완료 시 지급됩니다
                </p>
                ${pointsBalance >= 10000 ? `
                  <button onclick="app.showWithdrawalRequest()" class="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition">
                    <i class="fas fa-money-bill-wave mr-1"></i>출금 신청
                  </button>
                ` : `
                  <button disabled class="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
                    <i class="fas fa-lock mr-1"></i>10,000P 이상
                  </button>
                `}
              </div>
            </div>

            <!-- 아코디언 메뉴 -->
            <div class="space-y-3 mb-4 sm:mb-8">
              <!-- 1. 나의 캠페인 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAccordion('myCampaigns')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-bullhorn text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">나의 캠페인</h3>
                        <p class="text-xs sm:text-sm text-gray-600">지원 내역 및 진행 현황</p>
                      </div>
                    </div>
                    <i id="myCampaigns-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="myCampaigns-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>

              <!-- 2. 나의 컨텐츠 (리뷰 등록 및 관리) -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAccordion('myContents')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-pen-to-square text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">나의 컨텐츠</h3>
                        <p class="text-xs sm:text-sm text-gray-600">리뷰 등록 및 관리</p>
                      </div>
                    </div>
                    <i id="myContents-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="myContents-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>

              <!-- 3. 관심 캠페인 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAccordion('favoriteCampaigns')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-heart text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">관심 캠페인</h3>
                        <p class="text-xs sm:text-sm text-gray-600">찜한 캠페인 모아보기</p>
                      </div>
                    </div>
                    <i id="favoriteCampaigns-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="favoriteCampaigns-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>

              <!-- 4. 프로필 관리 -->
              <div class="bg-white rounded-lg shadow ${profileIncomplete ? 'border-2 border-orange-400' : ''}">
                <button onclick="app.toggleAccordion('profile')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-user ${profileIncomplete ? 'text-orange-500' : 'text-purple-600'} text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg ${profileIncomplete ? 'text-orange-600' : ''}">프로필 관리 ${profileIncomplete ? '<span class="text-red-600">*</span>' : ''}</h3>
                        <p class="text-xs sm:text-sm ${profileIncomplete ? 'text-orange-600 font-semibold' : 'text-gray-600'}">
                          ${profileIncomplete ? '⚠️ 필수 정보를 입력해주세요 (정산 및 배송용)' : '채널 및 정산 정보'}
                        </p>
                      </div>
                    </div>
                    <i id="profile-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="profile-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>

              <!-- 5. 출금 내역 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAccordion('withdrawalHistory')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-money-bill-wave text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">출금 내역</h3>
                        <p class="text-xs sm:text-sm text-gray-600">포인트 출금 신청 및 내역</p>
                      </div>
                    </div>
                    <i id="withdrawalHistory-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="withdrawalHistory-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>

              <!-- 1:1 문의 -->
              <button onclick="app.showContactInquiry()" class="w-full bg-white p-5 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-95 border-2 border-blue-200">
                <div class="flex items-center space-x-3">
                  <i class="fas fa-envelope text-blue-600 text-xl sm:text-2xl"></i>
                  <div class="text-left">
                    <h3 class="font-semibold text-base sm:text-lg text-blue-600">1:1 문의</h3>
                    <p class="text-xs sm:text-sm text-gray-600">궁금한 사항을 문의해주세요</p>
                  </div>
                </div>
              </button>

              <!-- 로그아웃 -->
              <button onclick="app.logout()" class="w-full bg-white p-5 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-95 border-2 border-red-200">
                <div class="flex items-center space-x-3">
                  <i class="fas fa-sign-out-alt text-red-600 text-xl sm:text-2xl"></i>
                  <div class="text-left">
                    <h3 class="font-semibold text-base sm:text-lg text-red-600">로그아웃</h3>
                    <p class="text-xs sm:text-sm text-gray-600">계정에서 로그아웃</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'mypage')}
        ${this.renderFooter()}
      </div>
    `;
  }

  // 아코디언 토글
  async toggleAccordion(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const icon = document.getElementById(`${sectionId}-icon`);
    const allSections = ['myCampaigns', 'favoriteCampaigns', 'myContents', 'profile', 'withdrawalHistory'];
    
    // 현재 섹션이 열려있는지 확인
    const isOpen = !content.classList.contains('hidden');
    
    // 모든 섹션 닫기
    allSections.forEach(id => {
      const c = document.getElementById(`${id}-content`);
      const i = document.getElementById(`${id}-icon`);
      if (c) c.classList.add('hidden');
      if (i) i.classList.remove('rotate-180');
    });
    
    // 현재 섹션이 닫혀있었다면 열고 내용 로드
    if (!isOpen) {
      content.classList.remove('hidden');
      icon.classList.add('rotate-180');
      
      // 내용 로드
      await this.loadAccordionContent(sectionId);
    }
  }

  // 아코디언 내용 로드
  async loadAccordionContent(sectionId) {
    const contentDiv = document.getElementById(`${sectionId}-content`);
    if (!contentDiv) return;
    
    switch(sectionId) {
      case 'myCampaigns':
        await this.loadMyCampaignsContent(contentDiv);
        break;
      case 'favoriteCampaigns':
        await this.loadFavoriteCampaignsContent(contentDiv);
        break;
      case 'myContents':
        await this.loadMyContentsContent(contentDiv);
        break;
      case 'profile':
        await this.loadProfileContent(contentDiv);
        break;
      case 'withdrawalHistory':
        await this.loadWithdrawalHistoryContent(contentDiv);
        break;
    }
  }

  // 나의 캠페인 내용 로드
  async loadMyCampaignsContent(contentDiv) {
    try {
      const response = await axios.get('/api/applications/my', this.getAuthHeaders());
      const applications = response.data;
      
      contentDiv.innerHTML = `
        <div class="p-4 sm:p-6">
          <h3 class="text-xl font-bold mb-4">나의 캠페인</h3>
          ${applications.length === 0 ? `
            <div class="text-center py-8">
              <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-600">아직 지원한 캠페인이 없습니다</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${applications.map(app => `
                <div class="border rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex items-start justify-between mb-2">
                    <h4 class="font-bold text-lg flex-1">${app.campaign_title}</h4>
                    ${(app.sphere_points || app.point_reward) > 0 ? `
                      <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg px-3 py-1 ml-2">
                        <p class="text-xs text-purple-600 font-semibold">획득 예정</p>
                        <p class="text-lg font-bold text-purple-700">${(app.sphere_points || app.point_reward).toLocaleString()}<span class="text-sm">P</span></p>
                      </div>
                    ` : ''}
                  </div>
                  <div class="flex items-center flex-wrap gap-2 mb-2">
                    <span class="px-3 py-1 rounded-full text-sm font-semibold ${
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }">
                      ${app.status === 'pending' ? '대기중' :
                        app.status === 'approved' ? '확정' : '거절'}
                    </span>
                    ${app.status === 'pending' ? (() => {
                      // 지원 마감일 체크 (23:59:59까지 허용, 한국 시간 기준)
                      if (app.application_end_date) {
                        const nowUTC = new Date();
                        const kstOffset = 9 * 60 * 60 * 1000;
                        const nowKST = new Date(nowUTC.getTime() + kstOffset);
                        
                        const [year, month, day] = app.application_end_date.split('-').map(Number);
                        const endDate = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
                        endDate.setUTCHours(14, 59, 59, 999); // KST 23:59:59
                        
                        if (nowKST > endDate) {
                          return '<span class="text-xs text-gray-500">지원 마감됨</span>';
                        }
                      }
                      return `
                        <button onclick="app.cancelApplication(${app.id})" class="text-red-600 hover:text-red-800 text-sm font-semibold">
                          <i class="fas fa-times mr-1"></i>지원취소
                        </button>
                      `;
                    })() : ''}
                    ${app.status === 'approved' && !app.review_url && !app.review_image_url ? `
                      <button onclick="app.submitReview(${app.id})" class="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold hover:bg-purple-700 transition">
                        <i class="fas fa-pen mr-1"></i>리뷰 등록하기
                      </button>
                    ` : ''}
                    <button onclick="app.viewCampaignDetail(${app.campaign_id})" class="text-purple-600 hover:text-purple-800 text-sm font-semibold">
                      캠페인 보기 →
                    </button>
                  </div>
                  ${app.status === 'approved' && (app.review_url || app.review_image_url) ? `
                    <div class="mt-2">
                      <div class="flex items-center gap-2 mb-2">
                        ${app.review_approval_status === 'approved' ? `
                          <span class="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            <i class="fas fa-check-circle mr-1"></i>광고주 승인완료
                          </span>
                          <span class="text-xs text-gray-500">수정 불가</span>
                        ` : app.review_approval_status === 'rejected' ? `
                          <span class="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                            <i class="fas fa-times-circle mr-1"></i>광고주 거절됨
                          </span>
                          <button 
                            data-app-id="${app.id}"
                            data-review-url="${(app.review_url || '').replace(/"/g, '&quot;')}"
                            data-review-image="${(app.review_image_url || '').replace(/"/g, '&quot;')}"
                            onclick="app.editReview(this.dataset.appId, this.dataset.reviewUrl, this.dataset.reviewImage)" 
                            class="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                            <i class="fas fa-edit mr-1"></i>수정하기
                          </button>
                        ` : `
                          <span class="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                            <i class="fas fa-clock mr-1"></i>검토 대기중
                          </span>
                          <button 
                            data-app-id="${app.id}"
                            data-review-url="${(app.review_url || '').replace(/"/g, '&quot;')}"
                            data-review-image="${(app.review_image_url || '').replace(/"/g, '&quot;')}"
                            onclick="app.editReview(this.dataset.appId, this.dataset.reviewUrl, this.dataset.reviewImage)" 
                            class="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                            <i class="fas fa-edit mr-1"></i>수정하기
                          </button>
                        `}
                      </div>
                      ${app.review_approval_status === 'rejected' && app.rejection_reason ? `
                        <div class="p-2 bg-red-50 rounded text-xs">
                          <p class="font-semibold text-red-800 mb-1">거절 사유:</p>
                          <p class="text-red-700">${app.rejection_reason}</p>
                          <p class="text-red-600 mt-1">💡 사유를 확인하고 리뷰를 수정해주세요</p>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load applications:', error);
      contentDiv.innerHTML = '<div class="p-4 sm:p-6"><p class="text-red-600">데이터를 불러오는데 실패했습니다</p></div>';
    }
  }

  // 관심 캠페인 내용 로드
  async loadFavoriteCampaignsContent(contentDiv) {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns') || '[]');
      
      if (favorites.length === 0) {
        contentDiv.innerHTML = `
          <div class="p-4 sm:p-6 text-center py-8">
            <i class="fas fa-heart text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600 mb-2">아직 관심 캠페인이 없습니다</p>
            <p class="text-sm text-gray-500">캠페인 상세 페이지에서 ♥ 버튼을 눌러 저장하세요</p>
          </div>
        `;
        return;
      }
      
      const response = await axios.get('/api/campaigns', this.getAuthHeaders());
      const allCampaigns = response.data;
      const favoriteCampaigns = allCampaigns.filter(c => favorites.includes(c.id));
      
      contentDiv.innerHTML = `
        <div class="p-4 sm:p-6">
          <h3 class="text-xl font-bold mb-4">관심 캠페인 (${favoriteCampaigns.length})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${favoriteCampaigns.map(c => `
              <div class="border rounded-lg overflow-hidden hover:shadow-md transition">
                ${c.thumbnail_image ? `
                  <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-32 object-cover cursor-pointer" onclick="app.viewCampaignDetail(${c.id})">
                ` : ''}
                <div class="p-4">
                  <div class="flex items-start justify-between mb-2">
                    <h4 class="font-bold cursor-pointer hover:text-purple-600" onclick="app.viewCampaignDetail(${c.id})">${c.title}</h4>
                    <button onclick="app.toggleFavorite(${c.id}); app.loadAccordionContent('favoriteCampaigns');" class="ml-2 text-red-500">
                      <i class="fas fa-heart"></i>
                    </button>
                  </div>
                  ${c.point_reward > 0 ? `<p class="text-purple-600 font-bold text-sm">${c.point_reward.toLocaleString()} P</p>` : ''}
                  <button onclick="app.viewCampaignDetail(${c.id})" class="mt-2 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                    자세히 보기
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load favorites:', error);
      contentDiv.innerHTML = '<div class="p-4 sm:p-6"><p class="text-red-600">데이터를 불러오는데 실패했습니다</p></div>';
    }
  }

  // 나의 컨텐츠 내용 로드
  async loadMyContentsContent(contentDiv) {
    try {
      const response = await axios.get('/api/applications/my', this.getAuthHeaders());
      const applications = response.data.filter(app => app.status === 'approved' && (app.review_url || app.review_image_url));
      
      contentDiv.innerHTML = `
        <div class="p-4 sm:p-6">
          <h3 class="text-xl font-bold mb-4">나의 컨텐츠</h3>
          ${applications.length === 0 ? `
            <div class="text-center py-8">
              <i class="fas fa-pen-to-square text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-600">등록된 컨텐츠가 없습니다</p>
              <p class="text-sm text-gray-500 mt-2">캠페인 확정 후 '나의 캠페인' 메뉴에서 리뷰를 등록하세요</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${applications.map(app => `
                <div class="border rounded-lg p-4">
                  <div class="flex items-start justify-between mb-2">
                    <h4 class="font-bold text-lg flex-1">${app.campaign_title}</h4>
                    ${(app.sphere_points || app.point_reward) > 0 ? `
                      <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg px-2 py-1 ml-2">
                        <p class="text-xs text-green-600">획득 포인트</p>
                        <p class="text-base font-bold text-green-700">${(app.sphere_points || app.point_reward).toLocaleString()}<span class="text-xs">P</span></p>
                      </div>
                    ` : ''}
                  </div>
                  <div class="mt-2">
                    ${app.review_url ? `
                      <a href="${app.review_url}" target="_blank" class="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                        <i class="fas fa-external-link-alt mr-1"></i>컨텐츠 보기
                      </a>
                    ` : ''}
                    ${app.review_image_url ? `
                      <button onclick="app.viewReviewImageByKey('${app.review_image_url}')" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm ml-2">
                        <i class="fas fa-image mr-1"></i>리뷰 캡쳐 보기
                      </button>
                    ` : ''}
                  </div>
                  <div class="text-xs text-gray-500 mt-2">
                    <i class="fas fa-clock mr-1"></i>등록일: ${new Date(app.submitted_at || app.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load contents:', error);
      contentDiv.innerHTML = '<div class="p-4 sm:p-6"><p class="text-red-600">데이터를 불러오는데 실패했습니다</p></div>';
    }
  }

  // 프로필 내용 로드
  async loadProfileContent(contentDiv) {
    try {
      const response = await axios.get('/api/profile/influencer', this.getAuthHeaders());
      const profile = response.data;
      
      // showInfluencerProfile의 내용을 사용하되 contentDiv에 직접 삽입
      contentDiv.innerHTML = `
        <div class="p-4 sm:p-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-start">
              <i class="fas fa-info-circle text-blue-600 mt-0.5 mr-3"></i>
              <div class="text-sm text-blue-800">
                <p class="font-semibold mb-1">캠페인 지원 및 정산을 위한 필수 정보입니다</p>
                <p class="text-xs">• 캠페인 지원 시 배송 정보가 자동으로 입력됩니다</p>
                <p class="text-xs">• 정산 시 <strong>입금 계좌 정보</strong>가 필요합니다</p>
                <p class="text-xs">• <span class="text-red-600">*</span> 표시는 필수 입력 항목입니다</p>
              </div>
            </div>
          </div>

          <form id="influencerProfileForm" onsubmit="event.preventDefault(); app.handleUpdateInfluencerProfile();" class="space-y-6">
            ${this.buildInfluencerProfileForm(profile)}
            
            <div class="flex gap-2">
              <button type="submit" class="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
                저장
              </button>
              <button type="button" onclick="app.toggleAccordion('profile')" class="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                취소
              </button>
            </div>
          </form>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load profile:', error);
      contentDiv.innerHTML = '<div class="p-4 sm:p-6"><p class="text-red-600">데이터를 불러오는데 실패했습니다</p></div>';
    }
  }

  // 인플루언서 프로필 폼 HTML 생성 (재사용 가능)
  buildInfluencerProfileForm(profile) {
    return `
      <!-- 개인 정보 섹션 -->
      <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-id-card text-blue-600 mr-2"></i>개인 정보
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              실명 <span class="text-red-600">*</span>
            </label>
            <input type="text" id="realName" value="${profile.real_name || ''}" placeholder="본명을 입력해주세요" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            <p class="text-xs text-gray-500 mt-1">상품 배송 및 정산을 위해 필요합니다</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                생년월일 <span class="text-red-600">*</span>
              </label>
              <input type="date" id="birthDate" value="${profile.birth_date || ''}" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                성별 <span class="text-red-600">*</span>
              </label>
              <select id="gender" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                <option value="">선택하세요</option>
                <option value="male" ${profile.gender === 'male' ? 'selected' : ''}>남성</option>
                <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>여성</option>
                <option value="other" ${profile.gender === 'other' ? 'selected' : ''}>기타</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              연락처 <span class="text-red-600">*</span>
            </label>
            <input type="tel" id="contactPhone" value="${profile.contact_phone || ''}" placeholder="010-1234-5678" required
              maxlength="13"
              oninput="this.value = UIUtils.formatPhoneNumber(this.value)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            <p class="text-xs text-gray-500 mt-1">자동으로 하이픈이 입력됩니다</p>
          </div>
        </div>
      </div>

      <!-- 채널 정보 섹션 -->
      <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-hashtag text-purple-600 mr-2"></i>채널 정보
        </h3>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">인스타그램 핸들</label>
              <input type="text" id="instagramHandle" value="${profile.instagram_handle || ''}" placeholder="@username"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">유튜브 채널</label>
              <input type="text" id="youtubeChannel" value="${profile.youtube_channel || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">블로그 URL</label>
              <input type="url" id="blogUrl" value="${profile.blog_url || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">틱톡 핸들</label>
              <input type="text" id="tiktokHandle" value="${profile.tiktok_handle || ''}" placeholder="@username"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">팔로워 수</label>
              <input type="number" id="followerCount" value="${profile.follower_count || 0}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <input type="text" id="category" value="${profile.category || ''}" placeholder="예: 뷰티, 패션, 푸드"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>
        </div>
      </div>

      <!-- 정산 정보 섹션 -->
      <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-won-sign text-green-600 mr-2"></i>정산 정보
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              예금주명 <span class="text-red-600">*</span>
            </label>
            <input type="text" id="accountHolderName" value="${profile.account_holder_name || ''}" placeholder="예: 홍길동" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            <p class="text-xs text-gray-500 mt-1">실명과 동일해야 합니다</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                은행명 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="bankName" value="${profile.bank_name || ''}" placeholder="예: 국민은행" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                계좌번호 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="accountNumber" value="${profile.account_number || ''}" placeholder="하이픈 없이 입력" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">사업자등록번호 (선택)</label>
            <input type="text" id="businessNumber" value="${profile.business_number || ''}" placeholder="사업자인 경우 입력"
              maxlength="12"
              oninput="this.value = UIUtils.formatBusinessNumber(this.value)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            <p class="text-xs text-gray-500 mt-1">형식: XXX-XX-XXXXX (자동 입력)</p>
          </div>
        </div>
      </div>

      <!-- 배송 정보 섹션 -->
      <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-truck text-orange-600 mr-2"></i>기본 배송 정보
        </h3>
        <p class="text-sm text-gray-600 mb-4">캠페인 지원 시 자동으로 입력됩니다</p>
        
        <div class="space-y-4">
          <!-- 위의 정보와 동일 체크박스 -->
          <label class="flex items-center cursor-pointer bg-purple-50 border border-purple-200 rounded-lg p-3">
            <input type="checkbox" id="sameAsPersonalInfo" onchange="app.toggleShippingSameAsPersonal(this.checked)"
              class="mr-3 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-600">
            <span class="text-sm font-medium text-purple-900">
              <i class="fas fa-copy mr-1"></i>위의 개인정보와 동일 (이름, 연락처 자동 입력)
            </span>
          </label>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                수령인 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="shippingName" value="${profile.shipping_name || ''}" placeholder="받으실 분 성함" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                연락처 <span class="text-red-600">*</span>
              </label>
              <input type="tel" id="shippingPhone" value="${profile.shipping_phone || ''}" placeholder="010-1234-5678" required
                maxlength="13"
                oninput="this.value = UIUtils.formatPhoneNumber(this.value)"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              우편번호 <span class="text-red-600">*</span>
            </label>
            <div class="flex gap-2">
              <input type="text" id="shippingPostalCode" value="${profile.shipping_postal_code || ''}" placeholder="12345" readonly required
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-gray-50">
              <button type="button" onclick="app.searchAddress('profile')" 
                class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 whitespace-nowrap">
                <i class="fas fa-search mr-1"></i>주소 검색
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              주소 <span class="text-red-600">*</span>
            </label>
            <input type="text" id="shippingAddress" value="${profile.shipping_address || ''}" placeholder="주소 검색 버튼을 클릭하세요" readonly required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-gray-50">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
            <input type="text" id="shippingAddressDetail" value="${profile.shipping_address_detail || ''}" placeholder="아파트 동/호수, 건물명 등"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>
        </div>
      </div>

      <!-- 개인정보 동의 섹션 -->
      <div class="bg-white border-2 border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-shield-alt text-blue-600 mr-2"></i>개인정보 처리 동의
        </h3>
        <p class="text-sm text-gray-600 mb-4">캠페인 지원 시와 동일한 내용입니다. 프로필 저장 시 동의가 필요합니다.</p>
        
        <div class="space-y-3">
          <!-- 전체 동의 체크박스 -->
          <label class="flex items-center cursor-pointer bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mb-3">
            <input type="checkbox" id="agreeAll" onchange="app.toggleAllConsents(this.checked)"
              class="mr-3 w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600">
            <span class="text-base font-bold text-blue-900">
              <i class="fas fa-check-double mr-2"></i>전체 동의
            </span>
          </label>

          <label class="flex items-start cursor-pointer">
            <input type="checkbox" id="portraitRightsConsent" ${profile.portrait_rights_consent ? 'checked' : ''} required
              class="consent-checkbox mt-1 mr-3 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-600">
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">초상권 사용 동의 <span class="text-red-600">*</span></span>
              <p class="text-xs text-gray-600 mt-1">캠페인 홍보 및 마케팅 목적으로 내 초상(사진, 영상)이 사용되는 것에 동의합니다.</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input type="checkbox" id="personalInfoConsent" ${profile.personal_info_consent ? 'checked' : ''} required
              class="consent-checkbox mt-1 mr-3 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-600">
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">개인정보 수집 및 이용 동의 <span class="text-red-600">*</span></span>
              <p class="text-xs text-gray-600 mt-1">이름, 연락처, 배송지 등 개인정보를 수집 및 이용하는 것에 동의합니다. (목적: 캠페인 진행, 상품 배송, 정산)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input type="checkbox" id="contentUsageConsent" ${profile.content_usage_consent ? 'checked' : ''} required
              class="consent-checkbox mt-1 mr-3 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-600">
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">콘텐츠 사용 동의 <span class="text-red-600">*</span></span>
              <p class="text-xs text-gray-600 mt-1">내가 제작한 콘텐츠(리뷰, 포스팅)를 플랫폼 및 광고주가 사용하는 것에 동의합니다.</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer">
            <input type="checkbox" id="thirdPartyProvisionConsent" ${profile.third_party_provision_consent ? 'checked' : ''} required
              class="consent-checkbox mt-1 mr-3 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-600">
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">개인정보 제3자 제공 동의 <span class="text-red-600">*</span></span>
              <p class="text-xs text-gray-600 mt-1">캠페인 진행을 위해 광고주에게 내 개인정보(이름, 연락처, 배송지, SNS 정보)가 제공되는 것에 동의합니다.</p>
            </div>
          </label>
        </div>
      </div>
    `;
  }

  // 관심 캠페인 (TODO: 구현 예정)
  async showFavoriteCampaigns() {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns') || '[]');
      const content = document.getElementById('influencerContent');
      
      if (!content) return;
      
      if (favorites.length === 0) {
        content.innerHTML = `
          <h2 class="text-2xl font-bold mb-6">관심 캠페인</h2>
          <div class="text-center py-12">
            <i class="fas fa-heart text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600 mb-2">아직 관심 캠페인이 없습니다</p>
            <p class="text-sm text-gray-500">캠페인 상세 페이지에서 ♥ 버튼을 눌러 저장하세요</p>
          </div>
        `;
        return;
      }
      
      // 전체 캠페인 목록에서 좋아요한 캠페인만 필터링
      const response = await axios.get('/api/campaigns', this.getAuthHeaders());
      const allCampaigns = response.data;
      const favoriteCampaigns = allCampaigns.filter(c => favorites.includes(c.id));
      
      content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">관심 캠페인 (${favoriteCampaigns.length})</h2>
        ${favoriteCampaigns.length === 0 ? `
          <div class="text-center py-12">
            <i class="fas fa-heart-broken text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600">저장한 캠페인이 더 이상 없습니다</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${favoriteCampaigns.map(c => `
              <div class="border rounded-lg overflow-hidden hover:shadow-lg transition">
                ${c.thumbnail_image ? `
                  <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-48 object-cover cursor-pointer" onclick="app.viewCampaignDetail(${c.id})">
                ` : `
                  <div class="w-full h-48 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center cursor-pointer" onclick="app.viewCampaignDetail(${c.id})">
                    <i class="fas fa-image text-white text-6xl opacity-50"></i>
                  </div>
                `}
                <div class="p-4">
                  <div class="flex items-start justify-between mb-2">
                    <h3 class="font-bold text-lg cursor-pointer hover:text-purple-600" onclick="app.viewCampaignDetail(${c.id})">${c.title}</h3>
                    <button onclick="app.toggleFavorite(${c.id}); app.showFavoriteCampaigns();" class="ml-2 text-xl text-red-500 hover:scale-110 transition-transform">
                      <i class="fas fa-heart"></i>
                    </button>
                  </div>
                  <p class="text-gray-600 text-sm line-clamp-2 mb-3">${c.description || ''}</p>
                  ${c.point_reward > 0 ? `
                    <div class="bg-purple-50 px-3 py-2 rounded-lg">
                      <span class="text-purple-700 font-bold">${c.point_reward.toLocaleString()} P</span>
                    </div>
                  ` : ''}
                  <button onclick="app.viewCampaignDetail(${c.id})" class="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                    자세히 보기
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } catch (error) {
      console.error('Failed to load favorite campaigns:', error);
    }
  }

  // 나의 컨텐츠 (등록한 리뷰)
  async showMyContents() {
    try {
      const response = await axios.get('/api/applications/my', this.getAuthHeaders());
      const applications = response.data.filter(app => app.status === 'approved');
      
      const content = document.getElementById('influencerContent');
      if (content) {
        content.innerHTML = `
          <h2 class="text-2xl font-bold mb-6">나의 컨텐츠</h2>
          ${applications.length === 0 ? `
            <div class="text-center py-12">
              <i class="fas fa-pen-to-square text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-600">등록된 컨텐츠가 없습니다</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${applications.map(app => `
                <div class="border rounded-lg p-4 hover:shadow-lg transition">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg">${app.campaign_title}</h3>
                    ${app.review_url || app.review_image_url ? `
                      ${app.review_approval_status === 'approved' ? `
                        <span class="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          <i class="fas fa-check-circle mr-1"></i>승인완료
                        </span>
                      ` : app.review_approval_status === 'rejected' ? `
                        <span class="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                          <i class="fas fa-times-circle mr-1"></i>거절됨
                        </span>
                      ` : `
                        <span class="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                          <i class="fas fa-clock mr-1"></i>검토중
                        </span>
                      `}
                    ` : ''}
                  </div>
                  ${app.review_url ? `
                    <a href="${app.review_url}" target="_blank" class="text-purple-600 hover:text-purple-800 text-sm">
                      <i class="fas fa-external-link-alt mr-1"></i>컨텐츠 보기
                    </a>
                  ` : app.review_image_url ? `
                    <p class="text-sm text-green-600 mb-2">
                      <i class="fas fa-image mr-1"></i>이미지 리뷰 등록됨
                    </p>
                  ` : `
                    <p class="text-sm text-gray-500">아직 컨텐츠를 등록하지 않았습니다</p>
                    <button onclick="app.submitReview(${app.id})" class="mt-2 text-purple-600 hover:text-purple-800 text-sm font-semibold">
                      <i class="fas fa-plus mr-1"></i>리뷰 등록하기
                    </button>
                  `}
                  ${app.review_approval_status === 'rejected' && app.rejection_reason ? `
                    <div class="mt-2 p-2 bg-red-50 rounded text-xs">
                      <p class="font-semibold text-red-800 mb-1">거절 사유:</p>
                      <p class="text-red-700">${app.rejection_reason}</p>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        `;
      }
    } catch (error) {
      console.error('Failed to load contents:', error);
    }
  }

  async showAvailableCampaigns() {
    try {
      const response = await axios.get('/api/campaigns', this.getAuthHeaders());
      const campaigns = response.data;

      const content = document.getElementById('influencerContent');
      content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">진행 중인 캠페인</h2>
        ${campaigns.length === 0 ? '<p class="text-gray-600">현재 진행 중인 캠페인이 없습니다</p>' : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${campaigns.map(c => {
            const channelIcon = UIUtils.getChannelIcon(c.channel_type);
            const channelName = c.channel_type === 'instagram' ? '인스타그램' : 
                               c.channel_type === 'blog' ? '블로그' : 
                               c.channel_type === 'youtube' ? '유튜브' : '기타';
            
            return `
            <div class="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer" onclick="app.viewCampaignDetail(${c.id})">
              <!-- 썸네일 이미지 -->
              ${c.thumbnail_image ? `
                <div class="w-full h-48 overflow-hidden bg-gray-100">
                  <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-full object-cover">
                </div>
              ` : `
                <div class="w-full h-48 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                  <i class="fas fa-image text-white text-6xl opacity-50"></i>
                </div>
              `}
              
              <!-- 캠페인 정보 -->
              <div class="p-4 flex flex-col" style="height: 240px;">
                <h3 class="font-bold text-base mb-2 line-clamp-1">${c.title}</h3>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2" style="height: 40px;">${c.description || '캠페인 설명이 없습니다'}</p>
                
                <div class="bg-purple-50 px-3 py-2 rounded-lg mb-2" style="height: 32px;">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-purple-700"><i class="fas fa-coins mr-1"></i>포인트</span>
                    <span class="font-bold text-purple-600">${c.point_reward > 0 ? c.point_reward.toLocaleString() + ' P' : '-'}</span>
                  </div>
                </div>
                
                <!-- 하단 정보 -->
                <div class="flex items-center justify-between pt-2 border-t mb-3">
                  <span>${channelIcon}</span>
                  <div class="text-sm text-gray-600">
                    <i class="fas fa-users mr-1"></i>
                    <span class="font-semibold text-purple-600">${c.application_count || 0}</span>/${c.slots}명
                  </div>
                </div>
                
                ${c.status === 'pending' ? `
                  <div class="mt-3 bg-blue-50 border border-blue-200 rounded p-2 text-xs text-center">
                    <i class="fas fa-hourglass-half text-blue-600 mr-1"></i>
                    <span class="text-blue-800">관리자 승인 대기중</span>
                    <div class="text-blue-600 mt-1">곧 모집이 시작됩니다!</div>
                  </div>
                ` : c.payment_status === 'paid' ? `
                  <button onclick="event.stopPropagation(); app.applyCampaign(${c.id})" class="w-full mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm font-semibold">
                    <i class="fas fa-paper-plane mr-1"></i>지원하기
                  </button>
                ` : `
                  <div class="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-center">
                    <i class="fas fa-clock text-yellow-600 mr-1"></i>
                    <span class="text-yellow-800">결제 대기 중</span>
                  </div>
                `}
              </div>
            </div>
          `}).join('')}
        </div>
      `;
    } catch (error) {
      alert('캠페인 목록을 불러오는데 실패했습니다');
    }
  }

  async showApplyCampaignForm(campaignId) {
    // Load campaign info to check channel type
    let campaign = null;
    try {
      const campaignResponse = await axios.get(`/api/campaigns/${campaignId}`, this.getAuthHeaders());
      campaign = campaignResponse.data;
    } catch (error) {
      alert('캠페인 정보를 불러오는데 실패했습니다');
      return;
    }
    
    // Load saved profile info
    let profile = {};
    try {
      const response = await axios.get('/api/profile/influencer', this.getAuthHeaders());
      profile = response.data;
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
    
    // 채널 타입에 맞는 채널이 있는지 체크
    const channelType = campaign.channel_type;
    const channelNames = {
      'instagram': '인스타그램',
      'blog': '블로그',
      'youtube': '유튜브',
      'tiktok': '틱톡'
    };
    
    const hasRequiredChannel = () => {
      switch(channelType) {
        case 'instagram':
          return profile.instagram_handle;
        case 'blog':
          return profile.blog_url;
        case 'youtube':
          return profile.youtube_channel;
        case 'tiktok':
          return profile.tiktok_handle;
        default:
          return true; // 채널 타입이 없으면 허용
      }
    };
    
    if (!hasRequiredChannel()) {
      alert(`이 캠페인은 ${channelNames[channelType] || channelType} 채널이 필요합니다.\n\n프로필에서 ${channelNames[channelType] || channelType} 채널을 먼저 등록해주세요.`);
      this.showMyPage();
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow">
          <div class="max-w-3xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <div class="mb-4">
        <button onclick="app.goBack()" class="text-gray-600 hover:text-gray-800">
          <i class="fas fa-arrow-left mr-2"></i>뒤로가기
        </button>
      </div>
      
      <h2 class="text-2xl font-bold mb-6">캠페인 지원하기</h2>
      <form id="applyCampaignForm" onsubmit="event.preventDefault(); app.handleApplyCampaign(${campaignId});" class="space-y-6">
        
        <!-- 개인 정보 -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-user text-purple-600 mr-2"></i>개인 정보
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            ${profile.real_name ? '<i class="fas fa-check-circle text-green-600 mr-1"></i>프로필에서 자동으로 불러왔습니다' : '캠페인 진행을 위한 필수 정보입니다'}
          </p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
              <input type="text" id="realName" required placeholder="실명을 입력해주세요"
                value="${profile.real_name || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">생년월일 *</label>
                <input type="date" id="birthDate" required
                  value="${profile.birth_date || ''}"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                <select id="gender" required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                  <option value="">선택하세요</option>
                  <option value="male" ${profile.gender === 'male' ? 'selected' : ''}>남성</option>
                  <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>여성</option>
                  <option value="other" ${profile.gender === 'other' ? 'selected' : ''}>기타</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">연락처 *</label>
              <input type="tel" id="contactPhone" required placeholder="010-1234-5678"
                value="${profile.contact_phone || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>
        </div>

        <!-- 동의 사항 -->
        <div class="bg-white border-2 border-red-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-shield-alt text-red-600 mr-2"></i>필수 동의 사항
          </h3>
          
          <div class="space-y-3">
            <!-- 전체 동의 -->
            <div class="bg-purple-50 p-3 rounded-lg">
              <label class="flex items-start cursor-pointer">
                <input type="checkbox" id="allConsent" onchange="app.toggleAllConsent()"
                  class="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                <span class="ml-3">
                  <span class="font-semibold text-purple-900">전체 동의</span>
                  <p class="text-xs text-gray-600 mt-1">아래 모든 필수 동의 항목에 동의합니다</p>
                </span>
              </label>
            </div>
            
            <!-- 개별 동의 항목 -->
            <div class="border-t pt-3 space-y-3">
              <label class="flex items-start cursor-pointer">
                <input type="checkbox" id="portraitRightsConsent" required onchange="app.checkAllConsent()"
                  class="consent-checkbox mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                <span class="ml-3 text-sm">
                  <span class="font-medium">[필수] 초상권 사용 동의</span>
                  <p class="text-xs text-gray-600 mt-1">캠페인 진행 및 홍보를 위한 초상권 사용에 동의합니다</p>
                </span>
              </label>
              
              <label class="flex items-start cursor-pointer">
                <input type="checkbox" id="personalInfoConsent" required onchange="app.checkAllConsent()"
                  class="consent-checkbox mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                <span class="ml-3 text-sm">
                  <span class="font-medium">[필수] 개인정보 제3자 제공 동의</span>
                  <p class="text-xs text-gray-600 mt-1">캠페인 진행을 위해 광고주에게 개인정보를 제공하는 것에 동의합니다</p>
                </span>
              </label>
              
              <label class="flex items-start cursor-pointer">
                <input type="checkbox" id="contentUsageConsent" required onchange="app.checkAllConsent()"
                  class="consent-checkbox mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                <span class="ml-3 text-sm">
                  <span class="font-medium">[필수] 저작물 이용 동의</span>
                  <p class="text-xs text-gray-600 mt-1">생성한 콘텐츠를 광고주가 활용하는 것에 동의합니다</p>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- 지원 메시지 -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-comment text-blue-600 mr-2"></i>지원 메시지
          </h3>
          <textarea id="applyMessage" rows="4" placeholder="지원 동기나 자기소개를 작성해주세요 (선택사항)"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"></textarea>
        </div>

        <!-- 배송 정보 -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-truck text-green-600 mr-2"></i>배송 정보
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            ${profile.shipping_name ? '<i class="fas fa-check-circle text-green-600 mr-1"></i>프로필에서 자동으로 불러왔습니다' : '상품 배송을 위한 정보를 입력해주세요'}
          </p>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">수령인 *</label>
                <input type="text" id="shippingRecipient" required placeholder="받으실 분 성함" 
                  value="${profile.shipping_name || ''}"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">연락처 *</label>
                <input type="tel" id="shippingPhone" required placeholder="010-1234-5678"
                  value="${profile.shipping_phone || ''}"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">우편번호 *</label>
              <div class="flex gap-2">
                <input type="text" id="shippingZipcode" required placeholder="12345" readonly
                  value="${profile.shipping_postal_code || ''}"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-gray-50">
                <button type="button" onclick="app.searchAddress('apply')" 
                  class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 whitespace-nowrap">
                  <i class="fas fa-search mr-1"></i>주소 검색
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">주소 *</label>
              <input type="text" id="shippingAddress" required placeholder="주소 검색 버튼을 클릭하세요" readonly
                value="${profile.shipping_address || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-gray-50">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
              <input type="text" id="shippingDetail" placeholder="아파트 동/호수, 건물명 등"
                value="${profile.shipping_address_detail || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>
        </div>

        <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          지원하기
        </button>
      </form>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'home')}
        ${this.renderFooter()}
      </div>
    `;
  }

  // 전체 동의 체크박스 토글
  toggleAllConsent() {
    const allConsent = document.getElementById('allConsent');
    const consentCheckboxes = document.querySelectorAll('.consent-checkbox');
    
    consentCheckboxes.forEach(checkbox => {
      checkbox.checked = allConsent.checked;
    });
  }

  // 개별 체크박스 확인 후 전체 동의 자동 체크
  checkAllConsent() {
    const allConsent = document.getElementById('allConsent');
    const consentCheckboxes = document.querySelectorAll('.consent-checkbox');
    const allChecked = Array.from(consentCheckboxes).every(checkbox => checkbox.checked);
    
    allConsent.checked = allChecked;
  }

  async handleApplyCampaign(campaignId) {
    try {
      // 개인 정보 수집
      const realName = document.getElementById('realName').value.trim();
      const birthDate = document.getElementById('birthDate').value;
      const gender = document.getElementById('gender').value;
      const contactPhone = document.getElementById('contactPhone').value.trim();

      // 동의 항목 확인
      const portraitRightsConsent = document.getElementById('portraitRightsConsent').checked;
      const personalInfoConsent = document.getElementById('personalInfoConsent').checked;
      const contentUsageConsent = document.getElementById('contentUsageConsent').checked;

      // 필수 정보 확인
      if (!realName || !birthDate || !gender || !contactPhone) {
        alert('개인 정보를 모두 입력해주세요');
        return;
      }

      // 필수 동의 확인
      if (!portraitRightsConsent || !personalInfoConsent || !contentUsageConsent) {
        alert('모든 필수 동의 항목에 동의해주세요');
        return;
      }

      const data = {
        // 개인 정보
        real_name: realName,
        birth_date: birthDate,
        gender: gender,
        contact_phone: contactPhone,
        // 동의 항목
        portrait_rights_consent: portraitRightsConsent,
        personal_info_consent: personalInfoConsent,
        content_usage_consent: contentUsageConsent,
        // 기존 필드들
        message: document.getElementById('applyMessage').value,
        shipping_recipient: document.getElementById('shippingRecipient').value,
        shipping_phone: document.getElementById('shippingPhone').value,
        shipping_zipcode: document.getElementById('shippingZipcode').value,
        shipping_address: document.getElementById('shippingAddress').value,
        shipping_detail: document.getElementById('shippingDetail').value,
      };

      await axios.post(`/api/campaigns/${campaignId}/apply`, data, this.getAuthHeaders());
      alert('캠페인 지원이 완료되었습니다!');
      // 저장 후 홈으로 자연스럽게 이동
      this.showHome();
    } catch (error) {
      alert(error.response?.data?.error || '지원에 실패했습니다');
    }
  }

  async applyCampaign(campaignId) {
    // 지원 폼 표시
    await this.showApplyCampaignForm(campaignId);
  }

  async showMyApplications() {
    try {
      const response = await axios.get('/api/applications/my', this.getAuthHeaders());
      const applications = response.data;

      const content = document.getElementById('influencerContent');
      content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">내 지원 내역</h2>
        ${applications.length === 0 ? '<p class="text-gray-600">지원 내역이 없습니다</p>' : ''}
        <div class="space-y-4">
          ${applications.map(a => `
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h3 class="font-bold">${a.campaign_title}</h3>
                  <p class="text-sm text-gray-600">지원일: ${new Date(a.applied_at).toLocaleDateString()}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm ${this.getApplicationStatusBadge(a.status)}">
                  ${this.getApplicationStatusText(a.status)}
                </span>
              </div>

              ${a.product_name ? `<p class="text-sm mb-2"><strong>제품:</strong> ${a.product_name}</p>` : ''}
              ${a.budget ? `<p class="text-sm mb-2"><strong>예산:</strong> ${a.budget.toLocaleString()}원</p>` : ''}

              <div class="flex gap-2 mt-2">
                ${a.status === 'pending' ? (() => {
                  // 지원 마감일 체크 (23:59:59까지 허용, 한국 시간 기준)
                  if (a.application_end_date) {
                    const nowUTC = new Date();
                    const kstOffset = 9 * 60 * 60 * 1000;
                    const nowKST = new Date(nowUTC.getTime() + kstOffset);
                    
                    const [year, month, day] = a.application_end_date.split('-').map(Number);
                    const endDate = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
                    endDate.setUTCHours(14, 59, 59, 999); // KST 23:59:59
                    
                    if (nowKST > endDate) {
                      return '<span class="text-sm text-gray-500 px-4 py-2">지원 마감됨</span>';
                    }
                  }
                  return `
                    <button onclick="app.cancelApplication(${a.id})" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                      <i class="fas fa-times mr-1"></i>지원 취소
                    </button>
                  `;
                })() : ''}
                ${a.status === 'approved' ? `
                  <p class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-1"></i>리뷰 등록은 마이페이지 > 나의 컨텐츠에서 진행해주세요
                  </p>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      alert('지원 내역을 불러오는데 실패했습니다');
    }
  }

  async submitReview(applicationId) {
    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 class="text-xl font-bold mb-4">리뷰 등록하기</h3>
        
        <form id="reviewForm" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-2">
              게시물 링크
              <span class="text-xs text-gray-500 font-normal">(선택사항)</span>
            </label>
            <input type="url" id="reviewPostUrl" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://blog.naver.com/...">
            <p class="text-xs text-gray-500 mt-1">블로그, 인스타그램, 유튜브 등 게시물 링크를 입력하세요</p>
          </div>
          
          <div>
            <label class="block text-sm font-semibold mb-2">
              리뷰 캡쳐 이미지
              <span class="text-xs text-gray-500 font-normal">(선택사항 - 스마트스토어 리뷰 등)</span>
            </label>
            <input type="file" id="reviewImage" accept="image/*"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <p class="text-xs text-gray-500 mt-1">스마트스토어 리뷰 캡쳐 이미지를 업로드하세요 (자동 압축)</p>
          </div>
          
          <div id="imagePreview" class="hidden mt-2">
            <img id="previewImg" class="max-w-full h-auto rounded-lg border">
          </div>
          
          <p class="text-xs text-orange-600">
            <i class="fas fa-exclamation-circle mr-1"></i>
            게시물 링크 또는 리뷰 캡쳐 이미지 중 최소 1개는 필수입니다
          </p>
          
          <div class="flex gap-2 pt-4">
            <button type="submit" class="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold">
              등록하기
            </button>
            <button type="button" onclick="this.closest('.fixed').remove()" class="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-semibold">
              취소
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 이미지 미리보기
    const imageInput = document.getElementById('reviewImage');
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        // 자동 압축 및 미리보기
        try {
          const compressedData = await this.compressImage(file);
          previewImg.src = compressedData;
          preview.classList.remove('hidden');
        } catch (error) {
          console.error('Image compression error:', error);
          alert('이미지 처리 중 오류가 발생했습니다');
          imageInput.value = '';
        }
      } else {
        preview.classList.add('hidden');
      }
    });
    
    // 폼 제출
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const postUrl = document.getElementById('reviewPostUrl').value.trim();
      const imageFile = imageInput.files[0];
      
      if (!postUrl && !imageFile) {
        alert('게시물 링크 또는 리뷰 캡쳐 이미지 중 최소 1개를 입력해주세요');
        return;
      }
      
      try {
        const payload = { post_url: postUrl || null };
        
        // 이미지가 있으면 압축 후 base64로 인코딩
        if (imageFile) {
          const imageData = await this.compressImage(imageFile);
          payload.image_data = imageData;
        }
        
        await axios.post(`/api/applications/${applicationId}/review`, payload, this.getAuthHeaders());
        alert('리뷰가 등록되었습니다!');
        modal.remove();
        
        // 마이페이지 나의 캠페인 섹션 다시 로드
        await this.showMyPage();
        setTimeout(() => {
          this.toggleAccordion('myCampaigns');
        }, 100);
      } catch (error) {
        console.error('Review submission error:', error);
        console.error('Error response:', error.response?.data);
        const errorMsg = error.response?.data?.error || '리뷰 등록에 실패했습니다';
        const details = error.response?.data?.details;
        alert(errorMsg + (details ? `\n\n상세: ${details}` : ''));
      }
    });
  }
  
  // 이미지 압축 함수 (2MB 미만으로)
  async compressImage(file, maxSizeMB = 2) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 최대 크기 제한 (긴 변 기준 2048px)
          const maxDimension = 2048;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // 압축 품질 조절
          let quality = 0.9;
          const maxSize = maxSizeMB * 1024 * 1024;
          
          const tryCompress = () => {
            canvas.toBlob((blob) => {
              if (blob.size > maxSize && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
              } else {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              }
            }, 'image/jpeg', quality);
          };
          
          tryCompress();
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  async editReview(applicationId, existingUrl, existingImageKey) {
    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 class="text-xl font-bold mb-4">리뷰 수정하기</h3>
        
        <form id="reviewEditForm" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-2">
              게시물 링크
              <span class="text-xs text-gray-500 font-normal">(선택사항)</span>
            </label>
            <input type="url" id="reviewPostUrl" value="${existingUrl}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://blog.naver.com/...">
            <p class="text-xs text-gray-500 mt-1">블로그, 인스타그램, 유튜브 등 게시물 링크를 입력하세요</p>
          </div>
          
          <div>
            <label class="block text-sm font-semibold mb-2">
              리뷰 캡쳐 이미지
              <span class="text-xs text-gray-500 font-normal">(선택사항 - 스마트스토어 리뷰 등)</span>
            </label>
            ${existingImageKey ? `
              <div class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p class="text-xs text-blue-800">
                  <i class="fas fa-check-circle mr-1"></i>기존 이미지가 등록되어 있습니다
                </p>
                <button type="button" onclick="app.viewReviewImageByKey('${existingImageKey}')" class="text-blue-600 hover:text-blue-800 text-xs mt-1">
                  <i class="fas fa-eye mr-1"></i>기존 이미지 보기
                </button>
              </div>
            ` : ''}
            <input type="file" id="reviewImage" accept="image/*"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <p class="text-xs text-gray-500 mt-1">새 이미지를 선택하면 기존 이미지가 교체됩니다 (자동 압축)</p>
          </div>
          
          <div id="imagePreview" class="hidden mt-2">
            <img id="previewImg" class="max-w-full h-auto rounded-lg border">
          </div>
          
          <p class="text-xs text-orange-600">
            <i class="fas fa-exclamation-circle mr-1"></i>
            게시물 링크 또는 리뷰 캡쳐 이미지 중 최소 1개는 필수입니다
          </p>
          
          <p class="text-xs text-blue-600">
            <i class="fas fa-info-circle mr-1"></i>
            컨텐츠 등록 기간 내에만 수정 가능합니다
          </p>
          
          <div class="flex gap-2 pt-4">
            <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
              수정하기
            </button>
            <button type="button" onclick="this.closest('.fixed').remove()" class="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-semibold">
              취소
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 이미지 미리보기
    const imageInput = document.getElementById('reviewImage');
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        // 자동 압축 및 미리보기
        try {
          const compressedData = await this.compressImage(file);
          previewImg.src = compressedData;
          preview.classList.remove('hidden');
        } catch (error) {
          console.error('Image compression error:', error);
          alert('이미지 처리 중 오류가 발생했습니다');
          imageInput.value = '';
        }
      } else {
        preview.classList.add('hidden');
      }
    });
    
    // 폼 제출
    document.getElementById('reviewEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const postUrl = document.getElementById('reviewPostUrl').value.trim();
      const imageFile = imageInput.files[0];
      
      if (!postUrl && !imageFile && !existingImageKey) {
        alert('게시물 링크 또는 리뷰 캡쳐 이미지 중 최소 1개를 입력해주세요');
        return;
      }
      
      try {
        const payload = { post_url: postUrl || null };
        
        // 이미지가 있으면 압축 후 base64로 인코딩
        if (imageFile) {
          const imageData = await this.compressImage(imageFile);
          payload.image_data = imageData;
        }
        
        await axios.put(`/api/applications/${applicationId}/review`, payload, this.getAuthHeaders());
        alert('리뷰가 수정되었습니다!');
        modal.remove();
        
        // 마이페이지 나의 캠페인 섹션 다시 로드
        await this.showMyPage();
        setTimeout(() => {
          this.toggleAccordion('myCampaigns');
        }, 100);
      } catch (error) {
        console.error('Review update error:', error);
        console.error('Error response:', error.response?.data);
        const errorMsg = error.response?.data?.error || '리뷰 수정에 실패했습니다';
        const details = error.response?.data?.details;
        alert(errorMsg + (details ? `\n\n상세: ${details}` : ''));
      }
    });
  }
  
  viewReviewImage(imageUrl) {
    // 이미지 모달 표시 (URL 직접)
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.onclick = () => modal.remove();
    modal.innerHTML = `
      <div class="max-w-4xl max-h-full">
        <img src="${imageUrl}" class="max-w-full max-h-screen object-contain rounded-lg">
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  viewReviewImageByKey(imageKey) {
    // R2 이미지 키로 표시
    const imageUrl = `/api/applications/review-image/${encodeURIComponent(imageKey)}`;
    this.viewReviewImage(imageUrl);
  }

  async cancelApplication(applicationId) {
    if (!confirm('정말로 지원을 취소하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/api/applications/${applicationId}`, this.getAuthHeaders());
      alert('지원이 취소되었습니다.');
      
      // 마이페이지의 "나의 캠페인" 섹션 다시 로드
      const contentDiv = document.getElementById('myCampaigns-content');
      if (contentDiv) {
        await this.loadMyCampaignsContent(contentDiv);
      } else {
        // 혹시 다른 페이지에 있다면 마이페이지로 이동
        this.showMyPage();
      }
    } catch (error) {
      alert(error.response?.data?.error || '지원 취소에 실패했습니다');
    }
  }

  // 배송지 정보를 개인정보와 동일하게 채우기
  toggleShippingSameAsPersonal(checked) {
    if (checked) {
      const realName = document.getElementById('realName').value;
      const contactPhone = document.getElementById('contactPhone').value;
      
      if (realName) {
        document.getElementById('shippingName').value = realName;
      }
      if (contactPhone) {
        document.getElementById('shippingPhone').value = contactPhone;
      }
    }
  }

  // 전체 동의 체크박스 토글
  toggleAllConsents(checked) {
    const consentCheckboxes = document.querySelectorAll('.consent-checkbox');
    consentCheckboxes.forEach(checkbox => {
      checkbox.checked = checked;
    });
  }

  async handleUpdateInfluencerProfile() {
    try {
      const data = {
        // 개인 정보
        real_name: document.getElementById('realName').value,
        birth_date: document.getElementById('birthDate').value,
        gender: document.getElementById('gender').value,
        contact_phone: document.getElementById('contactPhone').value,
        
        // 채널 정보
        instagram_handle: document.getElementById('instagramHandle').value,
        youtube_channel: document.getElementById('youtubeChannel').value,
        blog_url: document.getElementById('blogUrl').value,
        tiktok_handle: document.getElementById('tiktokHandle').value,
        follower_count: document.getElementById('followerCount').value || 0,
        category: document.getElementById('category').value,
        
        // 정산 정보
        account_holder_name: document.getElementById('accountHolderName').value,
        bank_name: document.getElementById('bankName').value,
        account_number: document.getElementById('accountNumber').value,
        business_number: document.getElementById('businessNumber').value,
        
        // 배송 정보
        shipping_name: document.getElementById('shippingName').value,
        shipping_phone: document.getElementById('shippingPhone').value,
        shipping_postal_code: document.getElementById('shippingPostalCode').value,
        shipping_address: document.getElementById('shippingAddress').value,
        shipping_address_detail: document.getElementById('shippingAddressDetail').value,
        
        // 동의 정보
        portrait_rights_consent: document.getElementById('portraitRightsConsent').checked,
        personal_info_consent: document.getElementById('personalInfoConsent').checked,
        content_usage_consent: document.getElementById('contentUsageConsent').checked,
        third_party_provision_consent: document.getElementById('thirdPartyProvisionConsent').checked,
      };

      await axios.put('/api/profile/influencer', data, this.getAuthHeaders());
      alert('프로필이 업데이트되었습니다');
      
      // 마이페이지로 이동 (프로필 완성도 재확인)
      this.showMyPage();
    } catch (error) {
      alert(error.response?.data?.error || '프로필 업데이트에 실패했습니다');
    }
  }

  // ============================================
  // Admin Dashboard
  // ============================================

  async showAdminMyPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow pb-20">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-user-circle text-purple-600 mr-2"></i>마이페이지
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">${this.user.nickname}님 (관리자)</p>
            </div>

            <!-- 아코디언 메뉴 -->
            <div class="space-y-3 mb-4 sm:mb-8">
              <!-- 가입자 목록 -->
              <div class="bg-white rounded-lg shadow border-2 border-green-200">
                <button onclick="app.toggleAdminAccordion('userList')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-users text-green-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg text-green-600">가입자 목록</h3>
                        <p class="text-xs sm:text-sm text-gray-600">전체 회원 조회 및 관리</p>
                      </div>
                    </div>
                    <i id="userList-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="userList-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>
              
              <!-- 정산 관리 -->
              <div class="bg-white rounded-lg shadow border-2 border-orange-200">
                <button onclick="app.toggleAdminAccordion('settlements')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-money-bill-wave text-orange-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg text-orange-600">정산 관리</h3>
                        <p class="text-xs sm:text-sm text-gray-600">출금 승인 및 정산 내역 관리</p>
                      </div>
                    </div>
                    <i id="settlements-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="settlements-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>
              
              <!-- 시스템 설정 -->
              <div class="bg-white rounded-lg shadow border-2 border-blue-200">
                <button onclick="app.toggleAdminAccordion('systemSettings')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-cog text-blue-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg text-blue-600">시스템 설정</h3>
                        <p class="text-xs sm:text-sm text-gray-600">수수료율 및 시스템 설정 관리</p>
                      </div>
                    </div>
                    <i id="systemSettings-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="systemSettings-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>

              <!-- 로그아웃 -->
              <div class="bg-white rounded-lg shadow border-2 border-red-200">
                <button onclick="app.logout()" class="w-full p-5 sm:p-6 text-left hover:bg-red-50 transition">
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-sign-out-alt text-red-600 text-xl sm:text-2xl"></i>
                    <div>
                      <h3 class="font-semibold text-base sm:text-lg text-red-600">로그아웃</h3>
                      <p class="text-xs sm:text-sm text-gray-600">계정에서 로그아웃</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'mypage')}
        ${this.renderFooter()}
      </div>
    `;
  }

  async toggleAdminAccordion(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const icon = document.getElementById(`${sectionId}-icon`);
    const allSections = ['userList', 'settlements', 'systemSettings'];
    
    const isOpen = !content.classList.contains('hidden');
    
    // 모든 섹션 닫기
    allSections.forEach(id => {
      const c = document.getElementById(`${id}-content`);
      const i = document.getElementById(`${id}-icon`);
      if (c) c.classList.add('hidden');
      if (i) i.classList.remove('rotate-180');
    });
    
    // 현재 섹션이 닫혀있었으면 열기
    if (!isOpen) {
      content.classList.remove('hidden');
      icon.classList.add('rotate-180');
      await this.loadAdminAccordionContent(sectionId);
    }
  }

  async loadAdminAccordionContent(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    if (!content) return;

    try {
      switch (sectionId) {
        case 'userList':
          await this.loadUserListContent(content);
          break;
        case 'settlements':
          await this.loadAdminSettlementsPageContent();
          break;
        case 'systemSettings':
          await this.loadSystemSettingsContent(content);
          break;
      }
    } catch (error) {
      console.error('Failed to load accordion content:', error);
      content.innerHTML = '<p class="text-red-600 p-4">콘텐츠를 불러오는데 실패했습니다</p>';
    }
  }

  async loadUserListContent(contentDiv) {
    try {
      const response = await axios.get('/api/admin/users', this.getAuthHeaders());
      const users = response.data;
      
      // 역할별로 분류
      const advertisers = users.filter(u => u.role === 'advertiser' || u.role === 'agency' || u.role === 'rep');
      const influencers = users.filter(u => u.role === 'influencer');
      const admins = users.filter(u => u.role === 'admin');
      
      contentDiv.innerHTML = `
        <div class="p-4 sm:p-6">
          <div class="mb-6">
            <h3 class="text-lg font-bold mb-2">가입자 통계</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-blue-50 p-3 rounded-lg">
                <p class="text-sm text-blue-600">전체</p>
                <p class="text-2xl font-bold text-blue-700">${users.length}명</p>
              </div>
              <div class="bg-purple-50 p-3 rounded-lg">
                <p class="text-sm text-purple-600">광고주</p>
                <p class="text-2xl font-bold text-purple-700">${advertisers.length}명</p>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <p class="text-sm text-green-600">인플루언서</p>
                <p class="text-2xl font-bold text-green-700">${influencers.length}명</p>
              </div>
              <div class="bg-orange-50 p-3 rounded-lg">
                <p class="text-sm text-orange-600">관리자</p>
                <p class="text-2xl font-bold text-orange-700">${admins.length}명</p>
              </div>
            </div>
          </div>
          
          <div class="mb-4">
            <h3 class="text-lg font-bold mb-2">전체 가입자 목록</h3>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold">이메일</th>
                  <th class="px-4 py-3 text-left font-semibold">닉네임</th>
                  <th class="px-4 py-3 text-left font-semibold">역할</th>
                  <th class="px-4 py-3 text-right font-semibold">포인트</th>
                  <th class="px-4 py-3 text-left font-semibold">가입일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${users.map(user => {
                  const roleBadge = user.role === 'advertiser' || user.role === 'agency' || user.role === 'rep' ? 
                    '<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">광고주</span>' :
                    user.role === 'influencer' ? 
                    '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">인플루언서</span>' :
                    '<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">관리자</span>';
                  
                  return `
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3">${user.email}</td>
                      <td class="px-4 py-3 font-semibold">${user.nickname}</td>
                      <td class="px-4 py-3">${roleBadge}</td>
                      <td class="px-4 py-3 text-right font-semibold ${user.sphere_points > 0 ? 'text-orange-600' : 'text-gray-400'}">${(user.sphere_points || 0).toLocaleString()} P</td>
                      <td class="px-4 py-3 text-gray-600">${new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load user list:', error);
      contentDiv.innerHTML = '<div class="p-4 sm:p-6"><p class="text-red-600">사용자 목록을 불러오는데 실패했습니다</p></div>';
    }
  }

  async loadSettlementsContent(container) {
    container.innerHTML = `
      <div class="p-4 sm:p-6">
        <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">정산 내역</h2>
        <div class="text-center py-8 sm:py-12">
          <i class="fas fa-file-excel text-4xl sm:text-6xl text-gray-300 mb-4"></i>
          <p class="text-sm sm:text-base text-gray-600 mb-2">정산 내역 기능 준비 중입니다</p>
          <p class="text-xs sm:text-sm text-gray-500">곧 만나보실 수 있습니다</p>
        </div>
      </div>
    `;
  }

  async updateCampaignStatus(campaignId, status) {
    try {
      await axios.put(`/api/admin/campaigns/${campaignId}/status`, { status }, this.getAuthHeaders());
      alert('상태가 변경되었습니다');
      
      // adminCampaignsContent 요소가 있는지 확인 (새로운 캠페인관리 페이지)
      const adminCampaignsContent = document.getElementById('adminCampaignsContent');
      if (adminCampaignsContent) {
        // 캠페인관리 페이지에 있으면 목록만 새로고침
        await this.loadAdminCampaignsPageContent();
      } else {
        // 그 외의 경우 관리자라면 캠페인관리 페이지로 이동
        if (this.user.role === 'admin') {
          this.showAdminCampaigns();
        } else {
          this.showMyPage();
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || '상태 변경에 실패했습니다');
    }
  }

  async markAsPaid(campaignId) {
    if (!confirm('이 캠페인의 결제를 완료 처리하시겠습니까?')) {
      return;
    }
    
    try {
      await axios.put(`/api/admin/campaigns/${campaignId}/payment`, { payment_status: 'paid' }, this.getAuthHeaders());
      alert('결제 완료 처리되었습니다. 이제 인플루언서들이 참여 신청을 할 수 있습니다.');
      
      // adminCampaignsContent 요소가 있는지 확인 (새로운 캠페인관리 페이지)
      const adminCampaignsContent = document.getElementById('adminCampaignsContent');
      if (adminCampaignsContent) {
        // 캠페인관리 페이지에 있으면 목록만 새로고침
        await this.loadAdminCampaignsPageContent();
      } else {
        // 그 외의 경우 관리자라면 캠페인관리 페이지로 이동
        if (this.user.role === 'admin') {
          this.showAdminCampaigns();
        } else {
          this.showMyPage();
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || '결제 처리에 실패했습니다');
    }
  }

  async toggleBestCampaign(campaignId, isBest) {
    try {
      await axios.put(`/api/admin/campaigns/${campaignId}/best`, { is_best: isBest }, this.getAuthHeaders());
      
      // 캠페인관리 페이지 새로고침
      const adminCampaignsContent = document.getElementById('adminCampaignsContent');
      if (adminCampaignsContent) {
        await this.loadAdminCampaignsPageContent();
      }
    } catch (error) {
      alert(error.response?.data?.error || '베스트 캠페인 설정에 실패했습니다');
    }
  }

  async toggleBestReview(reviewId, isBest) {
    try {
      await axios.put(`/api/admin/reviews/${reviewId}/best`, { is_best: isBest }, this.getAuthHeaders());
      
      // 리뷰관리 페이지 새로고침
      await this.loadAdvertiserReviewsPageContent();
    } catch (error) {
      alert(error.response?.data?.error || '베스트 리뷰 설정에 실패했습니다');
    }
  }

  async showSettlements() {
    try {
      const response = await axios.get('/api/admin/settlements', this.getAuthHeaders());
      const settlements = response.data;

      const content = document.getElementById('adminContent');
      content.innerHTML = `
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">정산 내역</h2>
          <button onclick="app.downloadSettlementsCSV()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <i class="fas fa-download mr-2"></i>엑셀 다운로드
          </button>
        </div>

        ${settlements.length === 0 ? '<p class="text-gray-600">정산 내역이 없습니다</p>' : ''}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">캠페인</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">인플루언서</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">예산</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">은행</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">계좌번호</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">예금주</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">포스트 URL</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${settlements.map(s => `
                <tr>
                  <td class="px-4 py-3 text-sm">${s.campaign_title}</td>
                  <td class="px-4 py-3 text-sm">${s.influencer_nickname}<br><span class="text-gray-500 text-xs">${s.influencer_email}</span></td>
                  <td class="px-4 py-3 text-sm">${s.budget ? s.budget.toLocaleString() + '원' : '-'}</td>
                  <td class="px-4 py-3 text-sm">${s.bank_name || '-'}</td>
                  <td class="px-4 py-3 text-sm">${s.account_number || '-'}</td>
                  <td class="px-4 py-3 text-sm">${s.account_holder_name || '-'}</td>
                  <td class="px-4 py-3 text-sm">
                    ${s.post_url ? `<a href="${s.post_url}" target="_blank" class="text-blue-600 hover:underline">링크</a>` : '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Store settlements data for CSV download
      this.settlementsData = settlements;
    } catch (error) {
      alert('정산 내역을 불러오는데 실패했습니다');
    }
  }

  async downloadSettlementsCSV() {
    if (!this.settlementsData || this.settlementsData.length === 0) {
      alert('다운로드할 데이터가 없습니다');
      return;
    }

    // CSV 생성
    const headers = ['캠페인', '인플루언서', '이메일', '예산', '은행', '계좌번호', '예금주', '연락처', '사업자번호', '포스트URL', '제출일'];
    const rows = this.settlementsData.map(s => [
      s.campaign_title,
      s.influencer_nickname,
      s.influencer_email,
      s.budget || '',
      s.bank_name || '',
      s.account_number || '',
      s.account_holder_name || '',
      s.contact_phone || '',
      s.business_number || '',
      s.post_url || '',
      s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // BOM 추가 (엑셀에서 한글 깨짐 방지)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `settlements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  // ============================================
  // Helper Methods
  // ============================================

  renderNav() {
    return UIUtils.renderNav(this.user);
  }

  renderFooter() {
    return UIUtils.renderFooter();
  }

  getStatusBadge(status, campaign = null) {
    return UIUtils.getStatusBadge(status, campaign);
  }

  getStatusText(status, campaign = null) {
    return UIUtils.getStatusText(status, campaign);
  }

  getApplicationStatusBadge(status) {
    return UIUtils.getApplicationStatusBadge(status);
  }

  getApplicationStatusText(status) {
    return UIUtils.getApplicationStatusText(status);
  }

  handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    this.login(email, password);
  }

  handleRegister() {
    const email = document.getElementById('registerEmail').value;
    const nickname = document.getElementById('registerNickname').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const role = document.getElementById('registerRoleHidden')?.value || document.getElementById('registerRole').value;
    
    // Password match validation
    const errorElement = document.getElementById('passwordMatchError');
    if (password !== passwordConfirm) {
      errorElement.classList.remove('hidden');
      return;
    }
    errorElement.classList.add('hidden');
    
    this.register(email, nickname, password, role);
  }

  handleForgotPassword() {
    const email = document.getElementById('forgotEmail').value;
    this.forgotPassword(email);
  }

  showTerms() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.token && this.user ? this.renderNav() : `
          <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <div class="flex justify-between items-center h-14 sm:h-16">
                <h1 class="text-lg sm:text-2xl font-bold text-purple-600 cursor-pointer" onclick="app.showHome()">
                  <i class="fas fa-globe mr-1 sm:mr-2"></i>ReviewSphere
                </h1>
              </div>
            </div>
          </nav>
        `}
        
        <div class="flex-grow">
          <div class="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <button onclick="app.goBack()" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
              <i class="fas fa-arrow-left mr-2"></i>돌아가기
            </button>
            
            <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <h1 class="text-3xl font-bold text-gray-800 mb-6">이용약관</h1>
              
              <div class="prose max-w-none space-y-6 text-sm">
                <section>
                  <h2 class="text-xl font-bold mb-3">제1조 (목적)</h2>
                  <p>본 약관은 리뷰스피어(이하 "회사")가 제공하는 인플루언서 마케팅 플랫폼 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">제2조 (정의)</h2>
                  <ol class="list-decimal pl-5 space-y-2">
                    <li>"서비스"란 회사가 제공하는 인플루언서 마케팅 플랫폼 및 관련 제반 서비스를 의미합니다.</li>
                    <li>"회원"이란 서비스에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 자를 말합니다.</li>
                    <li>"광고주"란 캠페인을 등록하고 인플루언서를 모집하는 회원을 말합니다.</li>
                    <li>"인플루언서"란 캠페인에 지원하여 리뷰 등의 콘텐츠를 작성하는 회원을 말합니다.</li>
                    <li>"포인트"란 인플루언서가 캠페인 참여를 통해 적립하는 리워드를 의미하며, 1포인트는 1원의 가치를 가집니다.</li>
                  </ol>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">제3조 (포인트 제도 및 출금)</h2>
                  <ol class="list-decimal pl-5 space-y-2">
                    <li>인플루언서는 캠페인 참여를 통해 포인트를 적립할 수 있습니다.</li>
                    <li>포인트는 다음의 경우에 적립됩니다:
                      <ul class="list-disc pl-5 mt-2 space-y-1">
                        <li>캠페인 완료 시 지정된 포인트 지급</li>
                        <li>제품 체험 또는 방문형 서비스 이용 후 리뷰 작성</li>
                        <li>게시물 작성 등의 간단한 캠페인 참여</li>
                        <li>기타 회사가 정하는 보너스 포인트</li>
                      </ul>
                    </li>
                    <li>적립된 포인트는 10,000포인트 이상부터 현금으로 출금 신청이 가능합니다.</li>
                    <li>출금 신청 시 등록된 계좌로 영업일 기준 7일 이내에 지급됩니다.</li>
                    <li>포인트 출금 시 소득세법에 따라 기타소득세(22%, 지방소득세 포함)가 원천징수됩니다.</li>
                    <li>회원은 출금 신청 시 본인 명의의 은행 계좌를 등록해야 하며, 타인 명의 계좌로는 출금이 불가능합니다.</li>
                    <li>출금 신청 시 세금 신고 및 본인 확인을 위해 다음 서류 제출이 필요합니다:
                      <ul class="list-disc pl-5 mt-2 space-y-1">
                        <li>신분증 사본 (주민등록증, 운전면허증, 여권 중 택1)</li>
                        <li>통장 사본 (계좌번호, 예금주 확인 가능한 페이지)</li>
                        <li>연락처 정보 (출금 처리 관련 연락용)</li>
                      </ul>
                    </li>
                    <li>회사는 제출된 개인정보를 세금 신고 및 출금 처리 목적으로만 사용하며, 관련 법령에 따라 5년간 보관 후 파기합니다.</li>
                    <li>부정한 방법으로 포인트를 적립한 경우, 회사는 해당 포인트를 회수하고 회원 자격을 제한할 수 있습니다.</li>
                    <li>포인트의 유효기간은 적립일로부터 2년입니다.</li>
                    <li>연간 출금 금액이 500만원을 초과하는 경우, 회원은 다음 연도에 종합소득세 신고 의무가 있습니다.</li>
                  </ol>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">제4조 (캠페인 참여 및 광고 표시 의무)</h2>
                  <ol class="list-decimal pl-5 space-y-2">
                    <li>인플루언서는 승인된 캠페인에 자유롭게 지원할 수 있습니다.</li>
                    <li>광고주는 지원자 중 적합한 인플루언서를 선정할 권한이 있습니다.</li>
                    <li>선정된 인플루언서는 캠페인 요구사항에 따라 성실히 활동해야 합니다.</li>
                    <li>캠페인 완료 후 포스트 URL 등 증빙자료를 제출해야 포인트가 지급됩니다.</li>
                    <li><strong>광고 표시 의무 (표시광고법 준수):</strong>
                      <ul class="list-disc pl-5 mt-2 space-y-1">
                        <li>인플루언서는 금전적 대가(포인트, 현금 등) 또는 경제적 이익(제품, 서비스 제공 등)을 받고 작성하는 모든 리뷰 및 게시물에 <strong>반드시 광고성 표시</strong>를 해야 합니다.</li>
                        <li>광고성 표시 방법:
                          <ul class="list-circle pl-5 mt-1 space-y-1">
                            <li>블로그: "[체험단]", "[협찬]", "[제공받은 상품]" 등을 제목 또는 본문 앞부분에 명시</li>
                            <li>인스타그램: "#광고", "#협찬", "#체험단", "#AD" 해시태그 포함</li>
                            <li>네이버 스마트스토어 리뷰: 리뷰 내용에 "[체험단]" 또는 "[협찬]" 명시</li>
                            <li>유튜브: 영상 설명란에 "본 영상은 ○○으로부터 제품(또는 대가)을 제공받아 제작되었습니다" 명시</li>
                          </ul>
                        </li>
                        <li>광고성 표시를 하지 않을 경우:
                          <ul class="list-circle pl-5 mt-1 space-y-1">
                            <li>표시광고법 위반으로 2년 이하의 징역 또는 1억 5천만 원 이하의 벌금 부과 가능</li>
                            <li>회사는 광고성 표시 누락에 대한 법적 책임을 지지 않으며, 모든 책임은 해당 인플루언서에게 있습니다</li>
                            <li>회사는 광고성 표시 누락이 확인된 회원의 계정을 즉시 정지하고, 적립된 포인트를 회수할 수 있습니다</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                    <li><strong>허위·과장 리뷰 금지:</strong>
                      <ul class="list-disc pl-5 mt-2 space-y-1">
                        <li>실제 사용하지 않거나 경험하지 않은 내용을 작성해서는 안 됩니다</li>
                        <li>과장되거나 사실과 다른 내용을 포함해서는 안 됩니다</li>
                        <li>허위·과장 리뷰 작성 시 공정거래위원회 제재 및 법적 처벌 대상이 될 수 있습니다</li>
                      </ul>
                    </li>
                  </ol>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">제5조 (회원의 의무 및 법적 책임)</h2>
                  <ol class="list-decimal pl-5 space-y-2">
                    <li>회원은 관계 법령, 본 약관, 이용안내 및 서비스상 공지사항 등을 준수해야 합니다.</li>
                    <li>회원은 본인의 계정 정보를 제3자에게 제공하거나 이용하게 해서는 안 됩니다.</li>
                    <li>인플루언서는 진실하고 성실한 리뷰를 작성해야 하며, 허위 또는 과장된 내용을 포함해서는 안 됩니다.</li>
                    <li>광고주는 적법한 제품 및 서비스에 대한 캠페인만 등록해야 합니다.</li>
                    <li><strong>광고주의 법적 책임:</strong>
                      <ul class="list-disc pl-5 mt-2 space-y-1">
                        <li>광고주는 인플루언서에게 표시광고법 준수 및 광고성 표시 의무를 안내해야 합니다</li>
                        <li>허위·과장 광고로 인한 법적 책임은 광고주에게 있습니다</li>
                        <li>네이버 스마트스토어 등 플랫폼 정책 위반으로 인한 불이익은 광고주가 부담합니다</li>
                      </ul>
                    </li>
                    <li><strong>인플루언서의 법적 책임:</strong>
                      <ul class="list-disc pl-5 mt-2 space-y-1">
                        <li>광고성 표시 누락, 허위·과장 리뷰 작성 등으로 인한 법적 책임은 인플루언서 본인에게 있습니다</li>
                        <li>회사는 회원의 법령 위반 행위에 대해 어떠한 책임도 지지 않습니다</li>
                      </ul>
                    </li>
                  </ol>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">제6조 (서비스 이용 제한)</h2>
                  <p>회사는 다음 각 호에 해당하는 경우 사전 통지 없이 회원의 서비스 이용을 제한하거나 계약을 해지할 수 있습니다:</p>
                  <ol class="list-decimal pl-5 space-y-2">
                    <li>타인의 정보를 도용한 경우</li>
                    <li>허위 또는 과장된 리뷰를 작성한 경우</li>
                    <li>부정한 방법으로 포인트를 적립하거나 출금한 경우</li>
                    <li>기타 관계 법령 또는 본 약관을 위반한 경우</li>
                  </ol>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">제7조 (면책조항)</h2>
                  <ol class="list-decimal pl-5 space-y-2">
                    <li>회사는 천재지변, 전쟁, 시스템 장애 등 불가항력으로 인한 서비스 제공 불능에 대해 책임을 지지 않습니다.</li>
                    <li>회사는 회원 간의 거래나 분쟁에 대해 책임을 지지 않습니다.</li>
                    <li>회사는 회원이 게시한 정보의 신뢰성, 정확성 등에 대해 책임을 지지 않습니다.</li>
                  </ol>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">부칙</h2>
                  <p>본 약관은 2025년 11월 10일부터 시행됩니다.</p>
                </section>
              </div>
            </div>
          </div>
        </div>
        
        ${this.renderFooter()}
      </div>
    `;
  }

  // ============================================
  // Campaign Form Helpers
  // ============================================

  initializeMissionFields() {
    const container = document.getElementById('missionContainer');
    if (!container) return;
    
    // 기본 5개 미션 필드 생성
    for (let i = 1; i <= 5; i++) {
      this.addMissionField();
    }
  }

  addMissionField() {
    const container = document.getElementById('missionContainer');
    const currentCount = container.children.length;
    
    if (currentCount >= 10) {
      alert('미션은 최대 10개까지 추가할 수 있습니다');
      return;
    }
    
    const missionIndex = currentCount + 1;
    const missionDiv = document.createElement('div');
    missionDiv.className = 'flex gap-2 items-start';
    missionDiv.innerHTML = `
      <span class="text-sm font-medium text-gray-600 mt-2 min-w-[50px]">No.${missionIndex}</span>
      <input type="text" id="mission${missionIndex}" placeholder="미션 내용을 입력하세요"
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
      <button type="button" onclick="app.removeMissionField(this)" 
        class="mt-2 text-red-600 hover:text-red-700">
        <i class="fas fa-times-circle"></i>
      </button>
    `;
    
    container.appendChild(missionDiv);
    
    // 10개가 되면 추가 버튼 숨기기
    if (currentCount + 1 >= 10) {
      document.getElementById('addMissionBtn').style.display = 'none';
    }
  }

  removeMissionField(button) {
    const container = document.getElementById('missionContainer');
    const missionDiv = button.parentElement;
    
    // 최소 1개는 유지
    if (container.children.length <= 1) {
      alert('최소 1개의 미션은 필요합니다');
      return;
    }
    
    container.removeChild(missionDiv);
    
    // 번호 재정렬
    Array.from(container.children).forEach((child, index) => {
      const span = child.querySelector('span');
      if (span) span.textContent = `No.${index + 1}`;
      const input = child.querySelector('input');
      if (input) input.id = `mission${index + 1}`;
    });
    
    // 추가 버튼 다시 표시
    document.getElementById('addMissionBtn').style.display = 'inline-block';
  }

  initializeKeywords() {
    // 키워드 배열
    this.keywords = [];
  }

  handleKeywordInput(event) {
    const input = event.target;
    const key = event.key;
    
    // Enter, Comma, Space 키로 키워드 추가
    if (key === 'Enter' || key === ',' || key === ' ') {
      event.preventDefault();
      this.addKeyword(input.value.trim());
      input.value = '';
    }
    // Backspace로 마지막 키워드 삭제
    else if (key === 'Backspace' && input.value === '' && this.keywords.length > 0) {
      event.preventDefault();
      this.removeKeyword(this.keywords.length - 1);
    }
  }

  addKeyword(keyword) {
    if (!keyword) return;
    
    // # 제거 (자동으로 추가할 것이므로)
    keyword = keyword.replace(/^#/, '');
    
    // 이미 존재하는 키워드인지 확인
    if (this.keywords.includes(keyword)) {
      return;
    }
    
    this.keywords.push(keyword);
    this.renderKeywords();
    this.updateKeywordsInput();
  }

  removeKeyword(index) {
    this.keywords.splice(index, 1);
    this.renderKeywords();
    this.updateKeywordsInput();
  }

  renderKeywords() {
    const container = document.getElementById('keywordContainer');
    const input = document.getElementById('keywordInput');
    
    // 기존 키워드 버튼들 제거
    const existingTags = container.querySelectorAll('.keyword-tag');
    existingTags.forEach(tag => tag.remove());
    
    // 새로운 키워드 버튼들 추가
    this.keywords.forEach((keyword, index) => {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm';
      tag.innerHTML = `
        #${keyword}
        <button type="button" onclick="app.removeKeyword(${index})" class="hover:text-purple-900">
          <i class="fas fa-times text-xs"></i>
        </button>
      `;
      container.insertBefore(tag, input);
    });
  }

  updateKeywordsInput() {
    const hiddenInput = document.getElementById('campaignKeywords');
    hiddenInput.value = this.keywords.map(k => `#${k}`).join(', ');
  }

  formatNumberInput(input) {
    // 숫자만 추출
    let value = input.value.replace(/[^\d]/g, '');
    
    // 빈 값이면 그대로 유지
    if (value === '') {
      input.value = '';
      return;
    }
    
    // 숫자를 천 단위 콤마로 포맷
    input.value = parseInt(value).toLocaleString();
  }

  clearDefaultZero(input) {
    // 포커스 시 현재 값을 저장하고 비우기
    if (!input.dataset.originalValue) {
      input.dataset.originalValue = input.value;
    }
    input.value = '';
  }

  getNumericValue(input) {
    // 입력 요소가 없으면 0 반환
    if (!input) return 0;
    // 콤마 제거하고 숫자만 반환
    return parseInt(input.value.replace(/[^\d]/g, '') || '0');
  }

  // ============================================
  // Address Search (Daum Postcode API)
  // ============================================

  searchAddress(type) {
    new daum.Postcode({
      oncomplete: (data) => {
        // 도로명 주소 또는 지번 주소를 변수에 저장
        let addr = '';
        
        // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져옴
        if (data.userSelectedType === 'R') { // 도로명 주소
          addr = data.roadAddress;
        } else { // 지번 주소
          addr = data.jibunAddress;
        }

        // type에 따라 다른 input 필드에 값을 넣음
        if (type === 'profile') {
          // 프로필 관리 페이지
          document.getElementById('shippingPostalCode').value = data.zonecode;
          document.getElementById('shippingAddress').value = addr;
          document.getElementById('shippingAddressDetail').focus();
        } else if (type === 'apply') {
          // 캠페인 지원 페이지
          document.getElementById('shippingZipcode').value = data.zonecode;
          document.getElementById('shippingAddress').value = addr;
          document.getElementById('shippingDetail').focus();
        }
      }
    }).open();
  }

  // ============================================
  // Privacy Policy & Terms
  // ============================================

  showPrivacy() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.token && this.user ? this.renderNav() : `
          <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <div class="flex justify-between items-center h-14 sm:h-16">
                <h1 class="text-lg sm:text-2xl font-bold text-purple-600 cursor-pointer" onclick="app.showHome()">
                  <i class="fas fa-globe mr-1 sm:mr-2"></i>ReviewSphere
                </h1>
              </div>
            </div>
          </nav>
        `}
        
        <div class="flex-grow">
          <div class="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <button onclick="app.goBack()" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
              <i class="fas fa-arrow-left mr-2"></i>돌아가기
            </button>
            
            <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <h1 class="text-3xl font-bold text-gray-800 mb-6">개인정보처리방침</h1>
              
              <div class="prose max-w-none space-y-6 text-sm">
                <section>
                  <h2 class="text-xl font-bold mb-3">1. 개인정보의 수집 및 이용 목적</h2>
                  <p>리뷰스피어((주)모빈)는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                  <ul class="list-disc pl-5 space-y-2">
                    <li>회원 가입 및 관리: 회원 자격 유지·관리, 본인확인, 부정이용 방지</li>
                    <li>서비스 제공: 캠페인 매칭, 포인트 적립 및 출금, 고객상담</li>
                    <li>마케팅 및 광고: 이벤트 정보 제공, 맞춤형 서비스 제공</li>
                  </ul>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">2. 수집하는 개인정보 항목</h2>
                  <p><strong>필수항목:</strong></p>
                  <ul class="list-disc pl-5 space-y-1">
                    <li>회원 가입 시: 이메일, 닉네임, 비밀번호</li>
                    <li>인플루언서: SNS 계정 정보, 팔로워 수, 계좌정보(출금 시)</li>
                    <li>광고주: 회사명, 사업자등록번호, 대표자명, 연락처</li>
                  </ul>
                  <p class="mt-2"><strong>자동 수집 항목:</strong> IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</p>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">3. 개인정보의 보유 및 이용 기간</h2>
                  <ul class="list-disc pl-5 space-y-2">
                    <li>회원 탈퇴 시까지 (단, 관계 법령에 따라 보존 필요 시 해당 기간 동안 보존)</li>
                    <li>전자상거래법: 계약 또는 청약철회 등에 관한 기록 5년</li>
                    <li>전자금융거래법: 전자금융 거래에 관한 기록 5년</li>
                    <li>통신비밀보호법: 로그인 기록 3개월</li>
                  </ul>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">4. 개인정보의 제3자 제공</h2>
                  <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
                  <ul class="list-disc pl-5 space-y-2">
                    <li>이용자가 사전에 동의한 경우</li>
                    <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                  </ul>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">5. 개인정보 처리 위탁</h2>
                  <p>회사는 서비스 향상을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:</p>
                  <ul class="list-disc pl-5 space-y-1">
                    <li>Cloudflare: 클라우드 서버 호스팅 및 데이터 저장</li>
                  </ul>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">6. 정보주체의 권리·의무 및 행사방법</h2>
                  <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
                  <ul class="list-disc pl-5 space-y-2">
                    <li>개인정보 열람 요구</li>
                    <li>개인정보 정정·삭제 요구</li>
                    <li>개인정보 처리정지 요구</li>
                    <li>회원 탈퇴 (동의 철회)</li>
                  </ul>
                  <p class="mt-2">권리 행사는 서비스 내 설정 메뉴 또는 개인정보 보호책임자에게 이메일, 전화 등을 통해 가능합니다.</p>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">7. 개인정보의 파기</h2>
                  <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
                  <ul class="list-disc pl-5 space-y-1">
                    <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
                    <li>종이 문서: 분쇄 또는 소각</li>
                  </ul>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">8. 개인정보 보호책임자</h2>
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <p><strong>개인정보 보호책임자</strong></p>
                    <ul class="list-none space-y-1 mt-2">
                      <li>성명: 안중경</li>
                      <li>직책: 개인정보 관리책임자</li>
                      <li>이메일: mobin_info@mobin-inc.com</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">9. 개인정보 처리방침 변경</h2>
                  <p>본 방침은 2025년 11월 10일부터 시행됩니다.</p>
                  <p>개인정보 처리방침의 내용 추가, 삭제 및 수정이 있을 시에는 시행 최소 7일 전부터 서비스 공지사항을 통해 알립니다.</p>
                </section>
              </div>
            </div>
          </div>
        </div>
        
        ${this.renderFooter()}
      </div>
    `;
  }

  // 시스템 설정 관리
  async loadSystemSettingsContent(container) {
    try {
      const response = await axios.get('/api/admin/settings', this.getAuthHeaders());
      const settings = response.data;

      // 설정값을 객체로 변환
      const settingsObj = {};
      settings.forEach(s => {
        settingsObj[s.setting_key] = s;
      });

      container.innerHTML = `
        <div class="p-4 sm:p-6">
          <h2 class="text-xl sm:text-2xl font-bold mb-2">시스템 수수료 설정</h2>
          <p class="text-sm text-gray-600 mb-6">건당 고정 수수료 + 포인트 비율 수수료 체계입니다. 변경 시 모든 캠페인에 즉시 적용됩니다.</p>
          
          <div class="space-y-6">
            <!-- 포인트 수수료율 -->
            <div class="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
              <h3 class="font-bold text-lg mb-3 text-blue-700">
                <i class="fas fa-percentage mr-2"></i>포인트 수수료율
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">포인트 수수료율 (%)</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="points_fee_rate" 
                    value="${settingsObj.points_fee_rate?.setting_value || 30}"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
                  <button onclick="app.updateSystemSetting('points_fee_rate')" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    저장
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">포인트 지급 시 추가로 부과되는 수수료율입니다</p>
              </div>
            </div>
          
            <!-- 1. 포인트만 지급 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-3 text-orange-600">
                <i class="fas fa-coins mr-2"></i>포인트만 지급
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">건당 고정 수수료 (원)</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="fixed_fee_points_only" 
                    value="${settingsObj.fixed_fee_points_only?.setting_value || 10000}"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600">
                  <button onclick="app.updateSystemSetting('fixed_fee_points_only')" 
                    class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
                    저장
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">브랜드 홍보, 해시태그 챌린지 등</p>
              </div>
            </div>

            <!-- 2. 구매 + 포인트 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-3 text-indigo-600">
                <i class="fas fa-shopping-cart mr-2"></i>구매 + 포인트
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">건당 고정 수수료 (원)</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="fixed_fee_purchase_with_points" 
                    value="${settingsObj.fixed_fee_purchase_with_points?.setting_value || 10000}"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600">
                  <button onclick="app.updateSystemSetting('fixed_fee_purchase_with_points')" 
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                    저장
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">리뷰어가 외부에서 직접 구매 후 리뷰 작성</p>
              </div>
            </div>

            <!-- 3. 상품만 제공 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-3 text-purple-600">
                <i class="fas fa-box mr-2"></i>상품만 제공
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">건당 고정 수수료 (원)</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="fixed_fee_product_only" 
                    value="${settingsObj.fixed_fee_product_only?.setting_value || 10000}"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                  <button onclick="app.updateSystemSetting('fixed_fee_product_only')" 
                    class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                    저장
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">리뷰어에게 실물 상품만 배송</p>
              </div>
            </div>

            <!-- 4. 상품 + 포인트 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-3 text-blue-600">
                <i class="fas fa-gift mr-2"></i>상품 + 포인트
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">건당 고정 수수료 (원)</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="fixed_fee_product_with_points" 
                    value="${settingsObj.fixed_fee_product_with_points?.setting_value || 10000}"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
                  <button onclick="app.updateSystemSetting('fixed_fee_product_with_points')" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    저장
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">실물 상품 배송 + 포인트 지급</p>
              </div>
            </div>

            <!-- 5. 이용권만 제공 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-3 text-green-600">
                <i class="fas fa-ticket-alt mr-2"></i>이용권만 제공
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">건당 고정 수수료 (원)</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="fixed_fee_voucher_only" 
                    value="${settingsObj.fixed_fee_voucher_only?.setting_value || 10000}"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600">
                  <button onclick="app.updateSystemSetting('fixed_fee_voucher_only')" 
                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    저장
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">숙박권, 식사권, 체험권 등 이용권만 제공</p>
              </div>
            </div>

            <!-- 6. 이용권 + 포인트 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-3 text-teal-600">
                <i class="fas fa-spa mr-2"></i>이용권 + 포인트
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">건당 고정 수수료 (원)</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="fixed_fee_voucher_with_points" 
                    value="${settingsObj.fixed_fee_voucher_with_points?.setting_value || 10000}"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600">
                  <button onclick="app.updateSystemSetting('fixed_fee_voucher_with_points')" 
                    class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                    저장
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">이용권 제공 + 포인트 지급</p>
              </div>
            </div>

            <!-- 예시 계산 -->
            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">
                <i class="fas fa-calculator mr-2 text-yellow-600"></i>수수료 계산 예시
              </h3>
              <div class="text-sm space-y-2 text-gray-700">
                <p><strong>포인트만 10,000P:</strong> 고정 ${Number(settingsObj.fixed_fee_points_only?.setting_value || 10000).toLocaleString()}원 + 포인트 수수료 ${Math.floor(10000 * (Number(settingsObj.points_fee_rate?.setting_value || 30) / 100)).toLocaleString()}원 = ${(Number(settingsObj.fixed_fee_points_only?.setting_value || 10000) + Math.floor(10000 * (Number(settingsObj.points_fee_rate?.setting_value || 30) / 100))).toLocaleString()}원</p>
                <p><strong>구매 30,000원 + 포인트 5,000P:</strong> 고정 ${Number(settingsObj.fixed_fee_purchase_with_points?.setting_value || 10000).toLocaleString()}원 + 포인트 수수료 ${Math.floor(5000 * (Number(settingsObj.points_fee_rate?.setting_value || 30) / 100)).toLocaleString()}원 = ${(Number(settingsObj.fixed_fee_purchase_with_points?.setting_value || 10000) + Math.floor(5000 * (Number(settingsObj.points_fee_rate?.setting_value || 30) / 100))).toLocaleString()}원</p>
                <p><strong>상품만 50,000원:</strong> 고정 ${Number(settingsObj.fixed_fee_product_only?.setting_value || 10000).toLocaleString()}원</p>
                <p><strong>상품 50,000원 + 포인트 20,000P:</strong> 고정 ${Number(settingsObj.fixed_fee_product_with_points?.setting_value || 10000).toLocaleString()}원 + 포인트 수수료 ${Math.floor(20000 * (Number(settingsObj.points_fee_rate?.setting_value || 30) / 100)).toLocaleString()}원 = ${(Number(settingsObj.fixed_fee_product_with_points?.setting_value || 10000) + Math.floor(20000 * (Number(settingsObj.points_fee_rate?.setting_value || 30) / 100))).toLocaleString()}원</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Load system settings error:', error);
      container.innerHTML = '<p class="text-red-600 p-4">시스템 설정을 불러오는데 실패했습니다</p>';
    }
  }

  async updateSystemSetting(settingKey) {
    try {
      const inputElement = document.getElementById(settingKey);
      if (!inputElement) {
        alert('설정값을 찾을 수 없습니다');
        return;
      }

      const value = inputElement.value;
      if (!value || isNaN(value) || Number(value) < 0) {
        alert('유효한 값을 입력해주세요');
        return;
      }

      await axios.put(`/api/admin/settings/${settingKey}`, { value }, this.getAuthHeaders());
      
      alert('설정이 저장되었습니다');
      
      // 설정 새로고침
      const content = document.getElementById('systemSettings-content');
      if (content) {
        await this.loadSystemSettingsContent(content);
      }
    } catch (error) {
      console.error('Update system setting error:', error);
      alert('설정 저장에 실패했습니다: ' + (error.response?.data?.error || error.message));
    }
  }

  // 과금 방식 변경 핸들러
  handlePricingTypeChange() {
    const pricingType = document.querySelector('input[name="pricingType"]:checked')?.value;
    const spherePointsSection = document.getElementById('spherePointsSection');
    const productValueSection = document.getElementById('campaignProductValue')?.parentElement;
    const productValueLabel = document.getElementById('productValueLabel');
    const productValueHint = document.getElementById('productValueHint');
    const productValueInput = document.getElementById('campaignProductValue');
    const spherePointsInput = document.getElementById('campaignSpherePoints');
    
    if (!pricingType) return;
    
    // 포인트만 지급인 경우
    if (pricingType === 'points_only') {
      // 상품/이용권 가치 입력 숨김
      if (productValueSection) productValueSection.classList.add('hidden');
      productValueInput.required = false;
      // 값은 유지 (계산 시 과금 타입을 보고 조건부로 0 사용)
      
      // 스피어포인트 입력 표시
      spherePointsSection.classList.remove('hidden');
      spherePointsInput.required = true;
    }
    // 구매+포인트인 경우
    else if (pricingType === 'purchase_with_points') {
      // 상품/이용권 가치 입력 표시 (구매 대행 비용)
      if (productValueSection) productValueSection.classList.remove('hidden');
      productValueInput.required = true;
      productValueLabel.textContent = '리뷰어 구매 금액';
      productValueHint.textContent = '리뷰어가 구매할 상품/서비스의 금액을 입력하세요 (구매 대행)';
      
      // 스피어포인트 입력 표시
      spherePointsSection.classList.remove('hidden');
      spherePointsInput.required = true;
    }
    // 포인트 포함 타입 (상품+포인트, 이용권+포인트)
    else if (pricingType === 'product_with_points' || pricingType === 'voucher_with_points') {
      // 상품/이용권 가치 입력 표시
      if (productValueSection) productValueSection.classList.remove('hidden');
      productValueInput.required = true;
      
      // 스피어포인트 입력 표시
      spherePointsSection.classList.remove('hidden');
      spherePointsInput.required = true;
      
      // 라벨 변경
      if (pricingType === 'product_with_points') {
        productValueLabel.textContent = '상품 가치';
        productValueHint.textContent = '리뷰어에게 제공되는 상품의 가치를 입력하세요';
      } else {
        productValueLabel.textContent = '이용권 가치';
        productValueHint.textContent = '리뷰어에게 제공되는 이용권의 가치를 입력하세요';
      }
    }
    // 상품만 또는 이용권만
    else {
      // 상품/이용권 가치 입력 표시
      if (productValueSection) productValueSection.classList.remove('hidden');
      productValueInput.required = true;
      
      // 스피어포인트 입력 숨김
      spherePointsSection.classList.add('hidden');
      spherePointsInput.required = false;
      // 값은 유지 (계산 시 과금 타입을 보고 조건부로 0 사용)
      
      // 라벨 변경
      if (pricingType === 'product_only') {
        productValueLabel.textContent = '상품 가치';
        productValueHint.textContent = '리뷰어에게 제공되는 상품의 가치를 입력하세요';
      } else {
        productValueLabel.textContent = '이용권 가치';
        productValueHint.textContent = '리뷰어에게 제공되는 이용권의 가치를 입력하세요';
      }
    }
    
    // 비용 재계산
    this.calculateNewPricingCost();
  }

  // 새로운 과금 방식 비용 계산
  async calculateNewPricingCost() {
    const pricingType = document.querySelector('input[name="pricingType"]:checked')?.value;
    
    // 콤마 제거 후 숫자로 변환
    const productValueInput = document.getElementById('campaignProductValue');
    const spherePointsInput = document.getElementById('campaignSpherePoints');
    
    // 과금 타입에 따라 조건부로 값 사용
    // 포인트만 지급: productValue는 0으로 처리
    // 상품만/이용권만: spherePoints는 0으로 처리
    let productValue = this.getNumericValue(productValueInput);
    let spherePoints = this.getNumericValue(spherePointsInput);
    
    if (pricingType === 'points_only') {
      productValue = 0; // 포인트만 지급일 때는 상품 가치 제외
    } else if (pricingType === 'product_only' || pricingType === 'voucher_only') {
      spherePoints = 0; // 상품만/이용권만일 때는 포인트 제외
    }
    
    const slots = Number(document.getElementById('campaignSlots')?.value || 10);
    const summaryDiv = document.getElementById('pricingSummary');
    
    // 유효성 검증 - 과금 타입에 따라 다르게 처리
    if (!pricingType) {
      summaryDiv.innerHTML = '<p class="text-sm text-gray-600 text-center">과금 정보를 입력하면 자동으로 계산됩니다</p>';
      return;
    }
    
    // 포인트만 지급인 경우
    if (pricingType === 'points_only' && spherePoints <= 0) {
      summaryDiv.innerHTML = '<p class="text-sm text-gray-600 text-center">스피어포인트를 입력해주세요</p>';
      return;
    }
    
    // 상품/이용권만 또는 포함인 경우
    if (pricingType !== 'points_only' && productValue <= 0) {
      summaryDiv.innerHTML = '<p class="text-sm text-gray-600 text-center">과금 정보를 입력하면 자동으로 계산됩니다</p>';
      return;
    }
    
    try {
      // pricingUtils를 사용하여 계산
      const pricing = await window.pricingUtils.calculateFullPricing(pricingType, productValue, spherePoints);
      
      // 라벨 결정
      let productLabel = '상품/이용권 가치';
      if (pricingType === 'purchase_with_points') {
        productLabel = '리뷰어 구매 금액';
      } else if (pricingType.startsWith('product')) {
        productLabel = '상품 가치';
      } else if (pricingType.startsWith('voucher')) {
        productLabel = '이용권 가치';
      }
      
      // 총 비용 (모집인원 고려)
      const totalForAllInfluencers = pricing.totalCost * slots;
      
      summaryDiv.innerHTML = `
        <div class="space-y-3">
          <h4 class="font-bold text-blue-800 flex items-center">
            <i class="fas fa-calculator mr-2"></i>비용 계산 (리뷰어 1명당)
          </h4>
          
          <div class="space-y-2 text-sm">
            ${pricingType === 'purchase_with_points' && pricing.productValue > 0 ? `
              <div class="flex justify-between">
                <span class="text-gray-700">${productLabel} (리뷰어 구매 대행):</span>
                <span class="font-semibold text-red-600">${pricing.productValue.toLocaleString()}원</span>
              </div>
            ` : ''}
            
            ${pricing.spherePoints > 0 ? `
              <div class="flex justify-between">
                <span class="text-gray-700">스피어포인트:</span>
                <span class="font-semibold text-purple-600">${pricing.spherePoints.toLocaleString()}P</span>
              </div>
            ` : ''}
            
            <div class="flex justify-between pt-2 border-t border-gray-200">
              <span class="text-gray-700">플랫폼 고정 수수료:</span>
              <span class="font-semibold">
                <span class="text-gray-400 line-through mr-1">30,000원</span>
                <span class="text-red-600">${pricing.fixedFee.toLocaleString()}원</span>
                <span class="text-xs text-green-600 ml-1">🎉 런칭 프로모션</span>
              </span>
            </div>
            
            ${pricing.pointsFee > 0 ? `
              <div class="flex justify-between">
                <span class="text-gray-700">포인트 수수료 (${pricing.pointsFeeRate}%):</span>
                <span class="font-semibold text-red-600">${pricing.pointsFee.toLocaleString()}원</span>
              </div>
            ` : ''}
            
          </div>
          
          ${pricingType === 'purchase_with_points' && pricing.productValue > 0 ? `
            <!-- 구매+포인트: 3단계 비용 분리 표시 -->
            <!-- 1. 구매 금액 -->
            <div class="bg-orange-50 border border-orange-200 rounded p-3 mt-3">
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-800 font-bold">
                    <i class="fas fa-shopping-cart mr-1 text-orange-600"></i>구매 금액 (${slots}명)
                  </span>
                  <span class="font-bold text-xl text-orange-600">${(pricing.productValue * slots).toLocaleString()}원</span>
                </div>
                <div class="text-xs text-gray-500 bg-white rounded p-2">
                  💡 리뷰어 구매 대행 비용 (판매 수익으로 회수 예정)
                </div>
              </div>
            </div>
            
            <!-- 2. 리뷰 비용 -->
            <div class="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-800 font-bold">
                    <i class="fas fa-star mr-1 text-blue-600"></i>리뷰 비용 (${slots}명)
                  </span>
                  <span class="font-bold text-xl text-blue-600">${((pricing.spherePoints + pricing.fixedFee + pricing.pointsFee) * slots).toLocaleString()}원</span>
                </div>
                <div class="text-xs text-gray-500 bg-white rounded p-2">
                  💡 포인트 + 플랫폼 수수료 (순수 리뷰 마케팅 비용)
                </div>
              </div>
            </div>
            
            <!-- 3. 총 결제 금액 -->
            <div class="bg-green-50 border border-green-300 rounded p-4 mt-3">
              <div class="space-y-2">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-800 font-bold text-lg">
                    <i class="fas fa-credit-card mr-1 text-green-600"></i>총 결제 금액 (${slots}명)
                  </span>
                </div>
                <div class="bg-white rounded p-3 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">구매 금액 + 리뷰 비용:</span>
                    <span class="font-semibold">${totalForAllInfluencers.toLocaleString()}원</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">부가세 (10%):</span>
                    <span class="font-semibold text-orange-600">+${Math.floor(totalForAllInfluencers * 0.1).toLocaleString()}원</span>
                  </div>
                  <div class="flex justify-between items-center pt-2 border-t border-green-200">
                    <span class="text-gray-800 font-bold">실제 입금 금액:</span>
                    <span class="font-bold text-2xl text-green-600">${Math.floor(totalForAllInfluencers * 1.1).toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- 일반 과금: 총 결제 금액 -->
            <div class="bg-green-50 border border-green-300 rounded p-4 mt-3">
              <div class="space-y-2">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-800 font-bold text-lg">
                    <i class="fas fa-credit-card mr-1 text-green-600"></i>총 결제 금액 (${slots}명)
                  </span>
                </div>
                <div class="bg-white rounded p-3 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">소계:</span>
                    <span class="font-semibold">${totalForAllInfluencers.toLocaleString()}원</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">부가세 (10%):</span>
                    <span class="font-semibold text-orange-600">+${Math.floor(totalForAllInfluencers * 0.1).toLocaleString()}원</span>
                  </div>
                  <div class="flex justify-between items-center pt-2 border-t border-green-200">
                    <span class="text-gray-800 font-bold">실제 입금 금액:</span>
                    <span class="font-bold text-2xl text-green-600">${Math.floor(totalForAllInfluencers * 1.1).toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </div>
          `}
          
          <div class="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
            <div class="space-y-1 text-sm">
              <div class="font-bold text-blue-800 mb-2">
                <i class="fas fa-building-columns mr-2"></i>입금 계좌
              </div>
              <div class="text-gray-700">예금주: <span class="font-semibold">(주)모빈</span></div>
              <div class="text-gray-700">은행: <span class="font-semibold">국민은행</span></div>
              <div class="text-gray-700">계좌번호: <span class="font-semibold">005790-17-614313</span></div>
            </div>
          </div>
          
          <div class="text-xs text-gray-600 mt-2 pt-2 border-t">
            <div><strong>리뷰어 1명당 혜택:</strong></div>
            ${pricing.productValue > 0 ? `<div>• ${productLabel}: ${pricing.productValue.toLocaleString()}원</div>` : ''}
            ${pricing.spherePoints > 0 ? `<div>• 포인트: ${pricing.spherePoints.toLocaleString()}P (현금 출금 가능)</div>` : ''}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Calculate pricing error:', error);
      summaryDiv.innerHTML = '<p class="text-sm text-red-600 text-center">비용 계산 중 오류가 발생했습니다</p>';
    }
  }

  // 출금 내역 로드
  async loadWithdrawalHistoryContent(contentDiv) {
    try {
      const response = await axios.get('/api/withdrawal/history', this.getAuthHeaders());
      const withdrawals = response.data;

      if (withdrawals.length === 0) {
        contentDiv.innerHTML = `
          <div class="text-center py-8">
            <i class="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
            <p class="text-gray-600">출금 신청 내역이 없습니다</p>
            <button onclick="app.showWithdrawalRequest()" class="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
              <i class="fas fa-money-bill-wave mr-2"></i>첫 출금 신청하기
            </button>
          </div>
        `;
        return;
      }

      const statusBadge = (status) => {
        const badges = {
          pending: '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">대기중</span>',
          approved: '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">승인</span>',
          completed: '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">완료</span>',
          rejected: '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">거부</span>'
        };
        return badges[status] || status;
      };

      contentDiv.innerHTML = `
        <div class="space-y-3">
          ${withdrawals.map(w => `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <p class="font-semibold text-lg">${w.amount.toLocaleString()}P 출금 신청</p>
                  <p class="text-sm text-gray-600">${new Date(w.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
                ${statusBadge(w.status)}
              </div>
              <div class="text-sm text-gray-700 space-y-1">
                <div class="flex justify-between">
                  <span>신청 금액:</span>
                  <span class="font-semibold">${w.amount.toLocaleString()}원</span>
                </div>
                <div class="flex justify-between">
                  <span>원천징수 (22%):</span>
                  <span class="text-red-600">-${w.tax_amount.toLocaleString()}원</span>
                </div>
                <div class="flex justify-between border-t pt-1">
                  <span class="font-semibold">실지급액:</span>
                  <span class="font-bold text-purple-600">${w.net_amount.toLocaleString()}원</span>
                </div>
                <div class="flex justify-between mt-2 pt-2 border-t">
                  <span>은행:</span>
                  <span>${w.bank_name}</span>
                </div>
                <div class="flex justify-between">
                  <span>계좌:</span>
                  <span>${w.account_number}</span>
                </div>
                <div class="flex justify-between">
                  <span>예금주:</span>
                  <span>${w.account_holder}</span>
                </div>
                ${w.admin_memo ? `
                  <div class="mt-2 pt-2 border-t">
                    <p class="text-xs text-gray-600">관리자 메모:</p>
                    <p class="text-sm">${w.admin_memo}</p>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Load withdrawal history error:', error);
      contentDiv.innerHTML = '<p class="text-red-600 text-center">출금 내역을 불러오는데 실패했습니다</p>';
    }
  }

  // 출금 신청 모달
  async showWithdrawalRequest() {
    // WithdrawalUI 클래스 사용
    if (!this.withdrawalUI) {
      this.withdrawalUI = new window.WithdrawalUI(this);
    }
    this.withdrawalUI.showWithdrawalRequest();
  }

  // 이전 버전 (백업용 - 삭제 예정)
  async showWithdrawalRequestOld() {
    // 프로필 정보 확인
    try {
      const response = await axios.get('/api/profile/influencer', this.getAuthHeaders());
      const profile = response.data;
      const pointsBalance = Number(profile.sphere_points) || 0;

      if (pointsBalance < 10000) {
        alert('출금 가능한 포인트가 부족합니다. (최소 10,000P)');
        return;
      }

      if (!profile.bank_name || !profile.account_number || !profile.account_holder_name) {
        alert('먼저 프로필에서 계좌 정보를 등록해주세요.');
        return;
      }

      // 전화번호 가져오기 (contact_phone)
      const contactPhone = profile.contact_phone || '';

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-2xl font-bold mb-4">포인트 출금 신청</h2>
          
          <div class="space-y-4">
            <div class="bg-purple-50 p-4 rounded-lg">
              <p class="text-sm text-gray-700 mb-1">보유 포인트</p>
              <p class="text-2xl font-bold text-purple-600">${pointsBalance.toLocaleString()} P</p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">출금 금액 (포인트)</label>
              <input type="text" id="withdrawalAmountDisplay" class="w-full px-4 py-2 border rounded-lg" 
                placeholder="10,000P 단위로 입력 (예: 10,000)">
              <input type="hidden" id="withdrawalAmount" value="">
              <p class="text-xs text-gray-600 mt-1">* 최소 출금 금액: 10,000P (10,000P 단위)</p>
            </div>

            <div id="taxInfo" class="bg-yellow-50 p-4 rounded-lg hidden">
              <p class="text-sm font-semibold mb-2">출금 상세 정보</p>
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span>신청 금액:</span>
                  <span id="requestAmount" class="font-semibold"></span>
                </div>
                <div class="flex justify-between">
                  <span>원천징수 (22%):</span>
                  <span id="taxAmount" class="text-red-600"></span>
                </div>
                <div class="flex justify-between border-t pt-1 mt-1">
                  <span class="font-semibold">실지급액:</span>
                  <span id="netAmount" class="font-bold text-purple-600"></span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm font-semibold mb-2">입금 계좌 정보</p>
              <div class="text-sm space-y-1">
                <div><span class="text-gray-600">은행:</span> ${profile.bank_name}</div>
                <div><span class="text-gray-600">계좌번호:</span> ${profile.account_number}</div>
                <div><span class="text-gray-600">예금주:</span> ${profile.account_holder_name}</div>
              </div>
              <p class="text-xs text-gray-600 mt-2">* 계좌 정보가 틀린 경우 프로필에서 수정해주세요</p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">연락처</label>
              <input type="tel" id="withdrawalPhone" class="w-full px-4 py-2 border rounded-lg" 
                value="${contactPhone}" placeholder="010-0000-0000">
              <p class="text-xs text-gray-600 mt-1">* 출금 관련 연락을 위해 필요합니다</p>
            </div>

            <div class="flex gap-2">
              <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                취소
              </button>
              <button onclick="app.submitWithdrawal()" class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                신청하기
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // 금액 입력 시 천단위 콤마 자동 추가 및 세금 계산
      const displayInput = document.getElementById('withdrawalAmountDisplay');
      const hiddenInput = document.getElementById('withdrawalAmount');
      
      displayInput.addEventListener('input', (e) => {
        // 숫자만 추출
        let value = e.target.value.replace(/[^\d]/g, '');
        
        // 숫자를 정수로 변환
        const numValue = parseInt(value) || 0;
        
        // hidden input에 실제 값 저장
        hiddenInput.value = numValue;
        
        // 천단위 콤마 추가하여 표시
        if (value) {
          e.target.value = numValue.toLocaleString();
        } else {
          e.target.value = '';
        }
        
        // 세금 계산 표시
        const taxInfo = document.getElementById('taxInfo');
        
        if (numValue >= 10000) {
          const tax = Math.floor(numValue * 0.22);
          const net = numValue - tax;

          document.getElementById('requestAmount').textContent = numValue.toLocaleString() + '원';
          document.getElementById('taxAmount').textContent = '-' + tax.toLocaleString() + '원';
          document.getElementById('netAmount').textContent = net.toLocaleString() + '원';
          taxInfo.classList.remove('hidden');
        } else {
          taxInfo.classList.add('hidden');
        }
      });

    } catch (error) {
      console.error('Show withdrawal request error:', error);
      alert('출금 신청을 불러오는데 실패했습니다');
    }
  }

  // 출금 신청 제출
  async submitWithdrawal() {
    const amount = parseInt(document.getElementById('withdrawalAmount').value);
    const phone = document.getElementById('withdrawalPhone').value.trim();

    if (!amount || amount < 10000) {
      alert('최소 출금 금액은 10,000P입니다');
      return;
    }

    // 10,000 단위 체크
    if (amount % 10000 !== 0) {
      alert('출금 금액은 10,000P 단위로 입력해주세요');
      return;
    }

    if (!phone) {
      alert('연락처를 입력해주세요');
      return;
    }

    try {
      const profile = await axios.get('/api/profile/influencer', this.getAuthHeaders());
      const profileData = profile.data;

      const response = await axios.post('/api/withdrawal/request', {
        amount,
        bank_name: profileData.bank_name,
        account_number: profileData.account_number,
        account_holder: profileData.account_holder_name,
        contact_phone: phone
      }, this.getAuthHeaders());

      alert(`출금 신청이 완료되었습니다!\n실지급액: ${response.data.net_amount.toLocaleString()}원\n영업일 기준 7일 이내에 입금됩니다.`);
      
      // 모달 닫기
      document.querySelector('.fixed.inset-0').remove();
      
      // 페이지 새로고침
      this.showInfluencerMyPage();
    } catch (error) {
      console.error('Submit withdrawal error:', error);
      alert(error.response?.data?.error || '출금 신청에 실패했습니다');
    }
  }

  // 1:1 문의 모달
  async showContactInquiry() {
    // 사용자 이메일 가져오기
    let userEmail = this.user.email || '';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-envelope text-blue-600 mr-2"></i>1:1 문의
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">회신받을 이메일 주소 *</label>
            <input type="email" id="inquiryReplyEmail" class="w-full px-4 py-2 border rounded-lg" 
              value="${userEmail}" placeholder="답변을 받을 이메일 주소">
            <p class="text-xs text-gray-600 mt-1">* 답변은 이 이메일로 전송됩니다</p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">제목 *</label>
            <input type="text" id="inquirySubject" class="w-full px-4 py-2 border rounded-lg" 
              placeholder="문의 제목을 입력하세요">
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">문의 내용 *</label>
            <textarea id="inquiryMessage" class="w-full px-4 py-2 border rounded-lg" 
              rows="8" placeholder="문의 내용을 상세히 입력해주세요"></textarea>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-gray-700">
              <i class="fas fa-info-circle text-blue-600 mr-1"></i>
              문의하신 내용은 영업일 기준 1~2일 이내에 이메일로 답변드립니다.
            </p>
          </div>

          <div class="flex gap-2">
            <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              취소
            </button>
            <button onclick="app.submitContactInquiry()" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <i class="fas fa-paper-plane mr-1"></i>문의하기
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // 1:1 문의 제출
  async submitContactInquiry() {
    const replyEmail = document.getElementById('inquiryReplyEmail').value.trim();
    const subject = document.getElementById('inquirySubject').value.trim();
    const message = document.getElementById('inquiryMessage').value.trim();

    if (!replyEmail) {
      alert('회신받을 이메일 주소를 입력해주세요');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(replyEmail)) {
      alert('올바른 이메일 주소를 입력해주세요');
      return;
    }

    if (!subject) {
      alert('제목을 입력해주세요');
      return;
    }

    if (!message) {
      alert('문의 내용을 입력해주세요');
      return;
    }

    if (message.length < 10) {
      alert('문의 내용을 10자 이상 입력해주세요');
      return;
    }

    try {
      const response = await axios.post('/api/contact/inquiry', {
        reply_email: replyEmail,
        subject,
        message
      }, this.getAuthHeaders());

      alert(response.data.message);
      
      // 모달 닫기
      document.querySelector('.fixed.inset-0').remove();
    } catch (error) {
      console.error('Submit inquiry error:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || '문의 접수에 실패했습니다';
      const errorDetails = error.response?.data?.details;
      
      if (errorDetails) {
        alert(`${errorMsg}\n\n상세 정보:\n${errorDetails}`);
      } else {
        alert(errorMsg);
      }
    }
  }
}

// Initialize app
const app = new ReviewSphere();
