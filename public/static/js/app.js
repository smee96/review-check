// ReviewSphere Frontend Application

class ReviewSphere {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.currentPage = 'home';
    this.init();
  }

  init() {
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
    
    // Load campaigns for display
    let ongoingCampaigns = [];
    let bestCampaigns = [];
    
    try {
      // 진행중인 캠페인 (모든 승인된 캠페인)
      const ongoingResponse = await axios.get('/api/campaigns');
      ongoingCampaigns = ongoingResponse.data || [];
      
      // 베스트 캠페인 (지원자 수 많은 순)
      const bestResponse = await axios.get('/api/campaigns?type=best');
      bestCampaigns = bestResponse.data || [];
    } catch (error) {
      console.log('Failed to load campaigns:', error);
    }
    
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}

        <!-- Hero Section -->
        <div class="bg-gradient-to-br from-purple-600 to-blue-500 text-white py-12 sm:py-16">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              진짜 리뷰, 진짜 성장
            </h2>
            <p class="text-base sm:text-lg lg:text-xl text-purple-100 mb-8">
              리뷰스피어의 AI 매칭으로<br>광고주와 인플루언서를 직접 연결
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button onclick="app.showLogin()" class="bg-white text-purple-600 px-8 py-3 rounded-lg text-base font-bold hover:bg-purple-50 transition shadow-lg w-64">
                <i class="fas fa-bullhorn mr-2"></i>광고주로 시작하기
              </button>
              <button onclick="app.showLogin()" class="bg-white text-purple-600 px-8 py-3 rounded-lg text-base font-bold hover:bg-purple-50 transition shadow-lg w-64">
                <i class="fas fa-star mr-2"></i>인플루언서로 시작하기
              </button>
            </div>
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
                  const channelIcon = c.channel_type === 'instagram' ? '📸' : c.channel_type === 'blog' ? '📝' : c.channel_type === 'youtube' ? '🎥' : '📱';
                  const channelColor = c.channel_type === 'instagram' ? 'bg-pink-100 text-pink-800' : c.channel_type === 'blog' ? 'bg-green-100 text-green-800' : c.channel_type === 'youtube' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
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
                    <div class="p-4">
                      <h4 class="font-bold text-lg mb-2 line-clamp-2">${c.title}</h4>
                      <p class="text-gray-600 text-sm mb-3 line-clamp-2">${c.description || '캠페인 설명이 없습니다'}</p>
                      ${c.point_reward > 0 ? `
                        <div class="bg-purple-50 px-3 py-2 rounded-lg mb-3">
                          <div class="flex items-center justify-between text-xs text-purple-700">
                            <span><i class="fas fa-coins mr-1"></i>포인트</span>
                            <span class="font-bold text-purple-600">${c.point_reward.toLocaleString()} P</span>
                          </div>
                        </div>
                      ` : ''}
                      <div class="flex items-center justify-between pt-2 border-t">
                        <span class="px-2 py-1 rounded text-xs font-semibold ${channelColor}">${channelIcon}</span>
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
                  const channelIcon = c.channel_type === 'instagram' ? '📸' : c.channel_type === 'blog' ? '📝' : c.channel_type === 'youtube' ? '🎥' : '📱';
                  const channelColor = c.channel_type === 'instagram' ? 'bg-pink-100 text-pink-800' : c.channel_type === 'blog' ? 'bg-green-100 text-green-800' : c.channel_type === 'youtube' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
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
                    <div class="p-4">
                      <h4 class="font-bold text-lg mb-2 line-clamp-2">${c.title}</h4>
                      <p class="text-gray-600 text-sm mb-3 line-clamp-2">${c.description || '캠페인 설명이 없습니다'}</p>
                      ${c.point_reward > 0 ? `
                        <div class="bg-purple-50 px-3 py-2 rounded-lg mb-3">
                          <div class="flex items-center justify-between text-xs text-purple-700">
                            <span><i class="fas fa-coins mr-1"></i>포인트</span>
                            <span class="font-bold text-purple-600">${c.point_reward.toLocaleString()} P</span>
                          </div>
                        </div>
                      ` : ''}
                      <div class="flex items-center justify-between pt-2 border-t">
                        <span class="px-2 py-1 rounded text-xs font-semibold ${channelColor}">${channelIcon}</span>
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
            </div>
            <div class="overflow-x-auto pb-4 -mx-3 px-3 scrollbar-hide">
              <div class="flex space-x-4" style="width: max-content;">
                <div class="w-full text-center py-16">
                  <i class="fas fa-comment-dots text-6xl text-gray-300 mb-4"></i>
                  <p class="text-xl text-gray-500 mb-2">베스트 리뷰를 기다리고 있어요</p>
                  <p class="text-sm text-gray-400">인플루언서들의 멋진 콘텐츠가 곧 이곳에 표시됩니다!</p>
                </div>
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
                      <div class="p-4">
                        <h3 class="font-bold text-lg mb-2 line-clamp-1">${c.title}</h3>
                        <p class="text-gray-600 text-sm line-clamp-2">${c.description || ''}</p>
                        ${c.point_reward > 0 ? `
                          <div class="mt-3 bg-purple-50 px-3 py-2 rounded-lg">
                            <span class="text-purple-700 font-bold">${c.point_reward.toLocaleString()} P</span>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
          
          ${UIUtils.renderBottomNav(this.user, 'home')}
          ${this.renderFooter()}
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
          
          <div class="flex-grow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
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
                    <div class="p-4">
                      <h3 class="font-bold text-lg mb-2 line-clamp-1">${c.title}</h3>
                      <p class="text-gray-600 text-sm line-clamp-2">${c.description || ''}</p>
                      ${c.point_reward > 0 ? `
                        <div class="mt-3 bg-purple-50 px-3 py-2 rounded-lg">
                          <span class="text-purple-700 font-bold">${c.point_reward.toLocaleString()} P</span>
                        </div>
                      ` : ''}
                      <div class="mt-3 pt-3 border-t flex items-center justify-between">
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
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
            <h2 class="text-2xl font-bold mb-2">
              <i class="fas fa-star text-yellow-500 mr-2"></i>베스트 리뷰
            </h2>
            <p class="text-gray-600 mb-6">우수한 컨텐츠를 확인하세요</p>
            
            <div class="text-center py-12">
              <i class="fas fa-star text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-600 mb-2">베스트 리뷰 기능 준비 중입니다</p>
              <p class="text-sm text-gray-500">곧 만나보실 수 있습니다</p>
            </div>
          </div>
        </div>
        
        ${UIUtils.renderBottomNav(this.user, 'reviews')}
        ${this.renderFooter()}
      </div>
    `;
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
              <button onclick="app.goBack()" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>뒤로가기
              </button>
              
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
                    <span class="px-4 py-2 rounded-full text-sm font-semibold ${this.getStatusBadge(campaign.status)}">
                      ${this.getStatusText(campaign.status)}
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
                    <div class="prose max-w-none text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
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
                        <span class="text-sm text-gray-500">예산</span>
                        <p class="font-semibold text-purple-600">${campaign.budget.toLocaleString()}원</p>
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
                        <span class="text-sm text-gray-500">발표일</span>
                        <p class="font-semibold">${campaign.announcement_date}</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.content_start_date ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">콘텐츠 게시 시작일</span>
                        <p class="font-semibold">${campaign.content_start_date}</p>
                      </div>
                    ` : ''}
                    
                    ${campaign.content_end_date ? `
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-500">콘텐츠 게시 종료일</span>
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
                            <p class="font-semibold text-pink-600">@${campaign.instagram_mention_account}</p>
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
                  ${campaign.point_reward > 0 ? `
                    <div class="bg-purple-50 p-6 rounded-lg mb-8 border-2 border-purple-200">
                      <h3 class="font-semibold text-purple-900 mb-4 flex items-center text-lg">
                        <i class="fas fa-coins mr-2"></i>스피어포인트 보상
                      </h3>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <span class="text-sm text-purple-700">인당 지급</span>
                          <p class="text-3xl font-bold text-purple-600">${campaign.point_reward.toLocaleString()} P</p>
                        </div>
                        <div>
                          <span class="text-sm text-purple-700">총 포인트</span>
                          <p class="text-3xl font-bold text-purple-600">${(campaign.point_reward * campaign.slots).toLocaleString()} P</p>
                        </div>
                      </div>
                      <p class="text-xs text-purple-600 mt-4">
                        <i class="fas fa-info-circle mr-1"></i>캠페인 완료 후 자동으로 지급됩니다 (1P = 1원)
                      </p>
                    </div>
                  ` : ''}
                  
                  <!-- 지원하기 버튼 -->
                  ${campaign.status === 'approved' && campaign.payment_status === 'paid' ? `
                    <div class="mt-8">
                      ${this.user?.role === 'influencer' ? `
                        <button onclick="app.applyCampaign(${campaign.id})" class="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-purple-700 transition shadow-lg">
                          <i class="fas fa-paper-plane mr-2"></i>이 캠페인에 지원하기
                        </button>
                        <p class="text-sm text-gray-500 text-center mt-2">지원 후 광고주가 확인하면 알림을 받으실 수 있습니다</p>
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
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
          
          ${this.renderFooter()}
        </div>
      `;
    } catch (error) {
      console.error('Campaign detail error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
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
      this.showInfluencerDashboard();
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

  // 마이페이지 (기존 대시보드)
  showMyPage(pushHistory = true) {
    if (pushHistory) {
      this.pushHistory('myPage');
    }
    
    switch (this.user.role) {
      case 'advertiser':
      case 'agency':
      case 'rep':
        this.showAdvertiserDashboard();
        break;
      case 'influencer':
        this.showInfluencerDashboard();
        break;
      case 'admin':
        this.showAdminDashboard();
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

  async showAdvertiserDashboard() {
    const app = document.getElementById('app');
    const roleTitle = this.user.role === 'advertiser' ? '광고주' : 
                      this.user.role === 'agency' ? '대행사' : '렙사';
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-user-circle text-purple-600 mr-2"></i>마이페이지
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">${this.user.nickname}님 (${roleTitle})</p>
            </div>

            <!-- 아코디언 메뉴 -->
            <div class="space-y-3 mb-4 sm:mb-8">
              <!-- 캠페인 등록 -->
              <div class="bg-purple-600 text-white rounded-lg shadow-lg">
                <button onclick="app.showCreateCampaign()" class="w-full p-5 sm:p-6 text-left hover:bg-purple-700 transition">
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-plus-circle text-2xl sm:text-3xl"></i>
                    <div>
                      <h3 class="font-semibold text-base sm:text-lg">캠페인 등록</h3>
                      <p class="text-xs sm:text-sm opacity-90">새 캠페인 만들기</p>
                    </div>
                  </div>
                </button>
              </div>

              <!-- 내 캠페인 목록 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAdvertiserAccordion('myCampaigns')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-list text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">내 캠페인 목록</h3>
                        <p class="text-xs sm:text-sm text-gray-600">등록한 캠페인 관리</p>
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

              <!-- 프로필 관리 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAdvertiserAccordion('profile')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-user text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">프로필 관리</h3>
                        <p class="text-xs sm:text-sm text-gray-600">사업자 정보 관리</p>
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
    
    // 자동으로 내 캠페인 목록 열기
    setTimeout(async () => {
      await this.toggleAdvertiserAccordion('myCampaigns');
    }, 100);
  }

  async toggleAdvertiserAccordion(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const icon = document.getElementById(`${sectionId}-icon`);
    const allSections = ['myCampaigns', 'profile'];
    
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
        case 'myCampaigns':
          await this.loadAdvertiserCampaignsContent(content);
          break;
        case 'profile':
          await this.loadAdvertiserProfileContent(content);
          break;
      }
    } catch (error) {
      console.error('Failed to load accordion content:', error);
      content.innerHTML = '<p class="text-red-600 p-4">콘텐츠를 불러오는데 실패했습니다</p>';
    }
  }

  async loadAdvertiserCampaignsContent(container) {
    try {
      const response = await axios.get('/api/campaigns/my', this.getAuthHeaders());
      const campaigns = response.data;

      container.innerHTML = `
        <div class="p-4 sm:p-6">
          <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">내 캠페인 목록</h2>
          ${campaigns.length === 0 ? '<p class="text-gray-600">등록된 캠페인이 없습니다</p>' : ''}
          <div class="space-y-3 sm:space-y-4">
            ${campaigns.map(c => `
              <div class="border rounded-lg hover:shadow-md transition overflow-hidden">
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
                          <span class="px-2 py-1 rounded text-xs font-semibold ${
                            c.channel_type === 'instagram' ? 'bg-pink-100 text-pink-800' :
                            c.channel_type === 'blog' ? 'bg-green-100 text-green-800' :
                            c.channel_type === 'youtube' ? 'bg-red-100 text-red-800' : ''
                          }">
                            ${c.channel_type === 'instagram' ? '📸 인스타그램' :
                              c.channel_type === 'blog' ? '📝 블로그' :
                              c.channel_type === 'youtube' ? '🎥 유튜브' : ''}
                          </span>
                        ` : ''}
                      </div>
                      <span class="px-3 py-1 rounded-full text-xs sm:text-sm ${this.getStatusBadge(c.status)} whitespace-nowrap self-start">
                        ${this.getStatusText(c.status)}
                      </span>
                    </div>
                    <p class="text-gray-600 mb-2 text-sm line-clamp-2">${c.description || ''}</p>
                    <div class="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                      <span>예산: ${c.budget ? c.budget.toLocaleString() + '원' : '미정'}</span>
                      <span>모집인원: ${c.slots}명</span>
                      ${c.point_reward > 0 ? `
                        <span class="col-span-2 text-purple-600 font-semibold">
                          <i class="fas fa-coins mr-1"></i>포인트: ${c.point_reward.toLocaleString()}P/인 (총 ${(c.point_reward * c.slots).toLocaleString()}P)
                        </span>
                      ` : ''}
                    </div>
                    <div class="mt-3 sm:mt-4 flex flex-wrap gap-2">
                      <button onclick="app.editCampaign(${c.id})" class="text-blue-600 hover:underline text-xs sm:text-sm" id="editBtn${c.id}">
                        <i class="fas fa-edit mr-1"></i>수정
                      </button>
                      ${c.status === 'approved' ? `
                        <button onclick="app.viewApplications(${c.id})" class="text-purple-600 hover:underline text-xs sm:text-sm">
                          <i class="fas fa-users mr-1"></i>지원자 보기
                        </button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      container.innerHTML = '<p class="text-red-600 p-4">캠페인 목록을 불러오는데 실패했습니다</p>';
    }
  }

  async loadAdvertiserProfileContent(container) {
    // 프로필 관리를 전체 페이지로 표시
    this.showAdvertiserProfile();
  }

  async showMyCampaigns() {
    try {
      const response = await axios.get('/api/campaigns/my', this.getAuthHeaders());
      const campaigns = response.data;

      const content = document.getElementById('advertiserContent');
      content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">내 캠페인 목록</h2>
        ${campaigns.length === 0 ? '<p class="text-gray-600">등록된 캠페인이 없습니다</p>' : ''}
        <div class="space-y-4">
          ${campaigns.map(c => `
            <div class="border rounded-lg hover:shadow-md transition overflow-hidden">
              <div class="flex">
                <!-- 썸네일 이미지 -->
                ${c.thumbnail_image ? `
                  <div class="w-32 h-32 flex-shrink-0">
                    <img src="${c.thumbnail_image}" alt="${c.title}" class="w-full h-full object-cover">
                  </div>
                ` : `
                  <div class="w-32 h-32 flex-shrink-0 bg-gray-200 flex items-center justify-center">
                    <i class="fas fa-image text-gray-400 text-3xl"></i>
                  </div>
                `}
                
                <!-- 캠페인 정보 -->
                <div class="flex-1 p-4">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                      <h3 class="font-bold text-lg">${c.title}</h3>
                      ${c.channel_type ? `
                        <span class="px-2 py-1 rounded text-xs font-semibold ${
                          c.channel_type === 'instagram' ? 'bg-pink-100 text-pink-800' :
                          c.channel_type === 'blog' ? 'bg-green-100 text-green-800' :
                          c.channel_type === 'youtube' ? 'bg-red-100 text-red-800' : ''
                        }">
                          ${c.channel_type === 'instagram' ? '📸 인스타그램' :
                            c.channel_type === 'blog' ? '📝 블로그' :
                            c.channel_type === 'youtube' ? '🎥 유튜브' : ''}
                        </span>
                      ` : ''}
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm ${this.getStatusBadge(c.status)}">
                      ${this.getStatusText(c.status)}
                    </span>
                  </div>
                  <p class="text-gray-600 mb-2 text-sm line-clamp-2">${c.description || ''}</p>
                  <div class="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-2">
                    <span>예산: ${c.budget ? c.budget.toLocaleString() + '원' : '미정'}</span>
                    <span>모집인원: <span class="font-semibold ${c.application_count > 0 ? 'text-purple-600' : ''}">${c.application_count || 0}</span>/${c.slots}명</span>
                    ${c.point_reward > 0 ? `
                      <span class="col-span-2 text-purple-600 font-semibold">
                        <i class="fas fa-coins mr-1"></i>포인트: ${c.point_reward.toLocaleString()}P/인 (총 ${(c.point_reward * c.slots).toLocaleString()}P)
                      </span>
                    ` : ''}
                  </div>
                  <div class="mt-4 flex space-x-2">
                    <button onclick="app.editCampaign(${c.id})" class="text-blue-600 hover:underline text-sm" id="editBtn${c.id}">
                      <i class="fas fa-edit mr-1"></i>수정
                    </button>
                    ${c.status === 'approved' ? `
                      <button onclick="app.viewApplications(${c.id})" class="text-purple-600 hover:underline text-sm">
                        <i class="fas fa-users mr-1"></i>지원자 보기
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      alert('캠페인 목록을 불러오는데 실패했습니다');
    }
  }

  showCreateCampaign() {
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
          
          <div class="flex-grow">
            <div class="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
              <button onclick="app.showMyPage()" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>마이페이지로
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
              <input type="number" id="campaignSlots" value="10" min="10" required
                oninput="app.calculateCampaignCost()"
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
                <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 신청 시작일 *</label>
                <input type="text" id="campaignApplicationStartDate" required readonly
                  placeholder="날짜를 선택하세요"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 신청 마감일 *</label>
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
                <label class="block text-sm font-medium text-gray-700 mb-2">컨텐츠 등록 마감일 *</label>
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
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">1. 제공받은 제품의 양도·판매·교환 금지 (적발 시 제재)
2. 리뷰 기한 내 미등록 시 제품 가격 청구
3. 선정 후 옵션 및 배송지 변경 불가
4. 제공 내역 불일치 또는 배송 지연(3일 이상) 시 1:1 문의
5. 업체 요청에 따라 선정 인원수 변경 가능
6. 선정된 제품으로만 촬영 진행
7. 리뷰는 마감일 기준 6개월간 유지 필수 (미유지 시 페널티)
8. 작성한 리뷰는 업체 홍보에 활용될 수 있음
9. 수정 요청이 있을 수 있으니 정확한 리뷰 작성 요망
10. 네이버 블로그는 공정위 배너 필수 첨부</textarea>
              <p class="text-xs text-gray-500 mt-1">기본 유의사항이 자동 입력됩니다. 필요시 수정 또는 추가 가능합니다</p>
            </div>
          </div>
        </div>

        <!-- 스피어포인트 지급 섹션 -->
        <div class="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <h3 class="font-bold text-purple-900 mb-3 flex items-center">
            <i class="fas fa-coins mr-2"></i>스피어포인트 지급 (선택)
          </h3>
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">인당 지급 포인트</label>
              <input type="text" id="campaignPointReward" value="0" placeholder="0"
                oninput="app.formatNumberInput(this); app.calculateCampaignCost()"
                onfocus="app.clearDefaultZero(this)"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              <p class="text-xs text-gray-500 mt-1">1포인트 = 1원</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">총 포인트</label>
              <input type="text" id="totalPoints" readonly 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
            </div>
          </div>
          
          <div class="bg-white p-3 rounded border border-purple-200">
            <div class="flex justify-between items-center mb-3">
              <span class="font-semibold text-gray-700">총 포인트 비용</span>
              <span class="font-bold text-lg text-purple-900" id="totalPointCost">0원</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs text-gray-500">플랫폼 수수료 (20%)</span>
              <span class="text-sm text-gray-600" id="platformFee">0원</span>
            </div>
            <div class="flex justify-between items-center mb-3">
              <span class="text-xs text-gray-500">부가세 (10%)</span>
              <span class="text-sm text-gray-600" id="vat">0원</span>
            </div>
            <div class="border-t border-purple-200 pt-3 mt-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-gray-800">최종 결제 금액</span>
                <span class="font-bold text-2xl text-green-600" id="totalCost">0원</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-600 mt-2">
            <i class="fas fa-info-circle mr-1"></i>
            포인트 지급이 있는 캠페인은 사전 결제가 필요합니다. 결제 완료 후 캠페인이 활성화됩니다.
          </p>
          <p class="text-xs text-gray-500 mt-1">
            * 부가세 별도 (세금계산서 발행)
          </p>
        </div>

        <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          캠페인 등록
        </button>
        
        <p class="text-sm text-gray-600 text-center">* 관리자 승인 후 활성화됩니다</p>
      </form>
    `;
    
    // Initialize cost calculation, date pickers, and mission fields
    setTimeout(() => {
      this.calculateCampaignCost();
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
      clickOpens: true
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

  calculateCampaignCost() {
    const slots = parseInt(document.getElementById('campaignSlots')?.value || 10);
    const pointRewardInput = document.getElementById('campaignPointReward');
    
    // 콤마 제거하고 순수 숫자만 추출
    const pointPerPerson = pointRewardInput ? this.getNumericValue(pointRewardInput) : 0;
    
    const totalPoints = slots * pointPerPerson;
    let totalPointCost = totalPoints;
    let platformFee = 0;
    let subtotal = 0;
    let vat = 0;
    let totalCost = 0;
    
    if (pointPerPerson > 0) {
      // 포인트가 있는 경우: 기존 계산 방식
      platformFee = Math.floor(totalPointCost * 0.20);
      subtotal = totalPointCost + platformFee;
      vat = Math.floor(subtotal * 0.10);
      totalCost = subtotal + vat;
    } else {
      // 포인트가 0인 경우: 고정 수수료 10,000원
      platformFee = 10000;
      subtotal = platformFee;
      vat = Math.floor(subtotal * 0.10);
      totalCost = subtotal + vat;
      totalPointCost = 0;
    }
    
    // Update display
    const totalPointsField = document.getElementById('totalPoints');
    if (totalPointsField) {
      if (pointPerPerson > 0) {
        totalPointsField.value = totalPoints.toLocaleString() + ' P';
      } else {
        totalPointsField.value = '0 P';
      }
    }
    
    const totalPointCostField = document.getElementById('totalPointCost');
    if (totalPointCostField) {
      totalPointCostField.textContent = totalPointCost.toLocaleString() + '원';
    }
    
    const platformFeeField = document.getElementById('platformFee');
    if (platformFeeField) {
      if (pointPerPerson > 0) {
        platformFeeField.textContent = platformFee.toLocaleString() + '원 (20%)';
      } else {
        platformFeeField.textContent = platformFee.toLocaleString() + '원 (고정)';
      }
    }
    
    const vatField = document.getElementById('vat');
    if (vatField) {
      vatField.textContent = vat.toLocaleString() + '원';
    }
    
    const totalCostField = document.getElementById('totalCost');
    if (totalCostField) {
      totalCostField.textContent = totalCost.toLocaleString() + '원';
    }
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
      
      // 숫자 필드에서 콤마 제거하고 순수 숫자만 추출
      const budgetInput = document.getElementById('campaignBudget');
      const pointRewardInput = document.getElementById('campaignPointReward');
      
      const budget = this.getNumericValue(budgetInput);
      const pointReward = this.getNumericValue(pointRewardInput);
      
      const data = {
        title: document.getElementById('campaignTitle').value,
        description: document.getElementById('campaignDescription').value,
        product_name: document.getElementById('campaignProductName').value,
        product_url: document.getElementById('campaignProductUrl').value,
        requirements: document.getElementById('campaignRequirements').value,
        budget: budget || null,
        slots: slots,
        point_reward: pointReward,
        
        // 썸네일 이미지
        thumbnail_image: this.thumbnailData || null,
        
        // 채널 정보
        channel_type: channelType,
        instagram_mention_account: channelType === 'instagram' ? document.getElementById('instagramMentionAccount')?.value : null,
        blog_product_url: channelType === 'blog' ? document.getElementById('blogProductUrl')?.value : null,
        youtube_purchase_link: channelType === 'youtube' ? document.getElementById('youtubePurchaseLink')?.value : null,
        
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

      // 결제 정보 표시 (결제는 승인 후)
      if (pointReward > 0) {
        const totalPointCost = pointReward * slots;
        const platformFee = Math.floor(totalPointCost * 0.20);
        const subtotal = totalPointCost + platformFee;
        const vat = Math.floor(subtotal * 0.10);
        const totalCost = subtotal + vat;
        
        if (!confirm(`캠페인 등록 신청을 하시겠습니까?\n\n관리자 승인 후 결제가 필요합니다.\n예상 결제 금액: ${totalCost.toLocaleString()}원\n(포인트 ${totalPointCost.toLocaleString()}원 + 수수료 ${platformFee.toLocaleString()}원 + 부가세 ${vat.toLocaleString()}원)`)) {
          return;
        }
      } else {
        if (!confirm('캠페인 등록 신청을 하시겠습니까?\n\n관리자 승인 후 인플루언서들이 참여 신청을 할 수 있습니다.')) {
          return;
        }
      }

      const response = await axios.post('/api/campaigns', data, this.getAuthHeaders());
      alert('캠페인 등록 신청이 완료되었습니다.\n관리자 승인 후 진행됩니다.');
      this.showMyCampaigns();
    } catch (error) {
      alert(error.response?.data?.error || '캠페인 등록에 실패했습니다');
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
        
        if (campaign.status === 'approved' || campaign.status === 'active' || campaign.status === 'suspended') {
          alert('승인된 캠페인은 수정할 수 없습니다.\n수정이 필요한 경우 관리자에게 문의해주세요.');
          return;
        }
        
        if (campaign.application_start_date && campaign.application_start_date <= today) {
          alert('신청 시작일 이후에는 캠페인을 수정할 수 없습니다.\n수정이 필요한 경우 관리자에게 문의해주세요.');
          return;
        }
      }
      
      // showCreateCampaign과 동일한 폼 표시
      await this.showCreateCampaign();
      
      // 폼 제목 변경
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
        document.getElementById('campaignNotes').value = campaign.notes || '';
        
        // 포인트 리워드 (숫자 포맷)
        const pointRewardField = document.getElementById('campaignPointReward');
        if (pointRewardField && campaign.point_reward) {
          pointRewardField.value = campaign.point_reward.toLocaleString();
        }
        
        // 비용 재계산
        this.calculateCampaignCost();
        
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
      }, 200);
      
    } catch (error) {
      console.error('Edit campaign error:', error);
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
      
      const data = {
        title: document.getElementById('campaignTitle').value,
        description: document.getElementById('campaignDescription').value,
        product_name: document.getElementById('campaignProductName').value,
        product_url: document.getElementById('campaignProductUrl').value,
        requirements: document.getElementById('campaignRequirements').value,
        budget: budget || null,
        slots: slots,
        point_reward: pointReward,
        
        // 썸네일 이미지 (수정 시 새로 업로드한 경우만)
        thumbnail_image: this.thumbnailData || null,
        
        // 채널 정보
        channel_type: channelType,
        instagram_mention_account: channelType === 'instagram' ? document.getElementById('instagramMentionAccount')?.value : null,
        blog_product_url: channelType === 'blog' ? document.getElementById('blogProductUrl')?.value : null,
        youtube_purchase_link: channelType === 'youtube' ? document.getElementById('youtubePurchaseLink')?.value : null,
        
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
      
      // 관리자는 관리자 대시보드로, 광고주는 내 캠페인으로
      if (this.user.role === 'admin') {
        this.showAdminDashboard();
      } else {
        this.showMyCampaigns();
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
      
      // 폼 제목 변경
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
        document.getElementById('campaignNotes').value = campaign.notes || '';
        
        // 포인트 리워드 (숫자 포맷)
        const pointRewardField = document.getElementById('campaignPointReward');
        if (pointRewardField && campaign.point_reward) {
          pointRewardField.value = campaign.point_reward.toLocaleString();
        }
        
        // 비용 재계산
        this.calculateCampaignCost();
        
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
      }, 200);
      
    } catch (error) {
      console.error('Edit campaign as admin error:', error);
      alert(error.response?.data?.error || '캠페인 정보를 불러오는데 실패했습니다');
    }
  }

  async viewApplications(campaignId) {
    try {
      const response = await axios.get(`/api/campaigns/${campaignId}/applications`, this.getAuthHeaders());
      const applications = response.data;
      
      // Store current campaign ID for detail view
      this.currentCampaignId = campaignId;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow">
            <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
              <button onclick="app.showMyPage()" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>마이페이지로
              </button>

              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl sm:text-3xl font-bold">지원자 목록</h2>
                <span class="text-sm text-gray-600">총 <span class="font-bold text-purple-600">${applications.length}</span>명</span>
              </div>
        
        ${applications.length === 0 ? '<p class="text-gray-600">아직 지원자가 없습니다</p>' : `
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          ${applications.map(a => `
            <div onclick="app.viewApplicationDetail(${a.id})" class="bg-white border-2 rounded-lg p-4 cursor-pointer hover:border-purple-600 hover:shadow-lg transition">
              <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-lg">${a.nickname}</h3>
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${this.getApplicationStatusBadge(a.status)}">
                  ${this.getApplicationStatusText(a.status)}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">${a.real_name || '-'}</p>
              <div class="text-xs text-gray-500 space-y-1">
                <p>📞 ${a.contact_phone || '-'}</p>
                <p>👥 팔로워: ${a.follower_count ? a.follower_count.toLocaleString() : '0'}명</p>
                <p>📅 ${new Date(a.applied_at).toLocaleDateString('ko-KR')}</p>
              </div>
              <div class="mt-3 pt-3 border-t flex items-center justify-between">
                <span class="text-xs text-purple-600 font-semibold">자세히 보기 →</span>
              </div>
            </div>
          `).join('')}
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
      const response = await axios.get(`/api/campaigns/${this.currentCampaignId}/applications`, this.getAuthHeaders());
      const applications = response.data;
      const application = applications.find(a => a.id === applicationId);
      
      if (!application) {
        alert('지원자 정보를 찾을 수 없습니다');
        return;
      }

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
                    <h2 class="text-2xl font-bold">${application.nickname}</h2>
                    <p class="text-gray-600">${application.email}</p>
                  </div>
                  <span class="px-4 py-2 rounded-full text-sm font-semibold ${this.getApplicationStatusBadge(application.status)}">
                    ${this.getApplicationStatusText(application.status)}
                  </span>
                </div>

                <!-- 개인 정보 -->
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h4 class="font-semibold text-purple-900 mb-3 flex items-center">
                    <i class="fas fa-user mr-2"></i>개인 정보
                  </h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p><strong>이름:</strong> ${application.real_name || '-'}</p>
                    <p><strong>생년월일:</strong> ${application.birth_date || '-'}</p>
                    <p><strong>성별:</strong> ${application.gender === 'male' ? '남성' : application.gender === 'female' ? '여성' : application.gender === 'other' ? '기타' : '-'}</p>
                    <p><strong>연락처:</strong> ${application.contact_phone || '-'}</p>
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

                <!-- 배송 정보 -->
                ${application.shipping_recipient ? `
                  <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 class="font-semibold text-green-900 mb-3 flex items-center">
                      <i class="fas fa-truck mr-2"></i>배송 정보
                    </h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <p><strong>수령인:</strong> ${application.shipping_recipient}</p>
                      <p><strong>연락처:</strong> ${application.shipping_phone || '-'}</p>
                      <p class="sm:col-span-2"><strong>우편번호:</strong> ${application.shipping_zipcode || '-'}</p>
                      <p class="sm:col-span-2"><strong>주소:</strong> ${application.shipping_address || '-'}</p>
                      ${application.shipping_detail ? `<p class="sm:col-span-2"><strong>상세주소:</strong> ${application.shipping_detail}</p>` : ''}
                    </div>
                  </div>
                ` : ''}

                <!-- 지원 메시지 -->
                ${application.message ? `
                  <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <p class="text-sm font-semibold mb-2">💬 지원 메시지:</p>
                    <p class="text-sm text-gray-700">${application.message}</p>
                  </div>
                ` : ''}

                <!-- 지원 정보 -->
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                  <p class="text-xs text-gray-500">지원일: ${new Date(application.applied_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <!-- 액션 버튼 -->
                ${application.status === 'pending' ? `
                  <div class="flex gap-3">
                    <button onclick="app.updateApplicationStatus(${application.id}, 'approved', ${this.currentCampaignId}); app.viewApplicationDetail(${application.id});" 
                      class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition">
                      <i class="fas fa-check mr-2"></i>확정
                    </button>
                    <button onclick="app.updateApplicationStatus(${application.id}, 'rejected', ${this.currentCampaignId}); app.viewApplicationDetail(${application.id});" 
                      class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition">
                      <i class="fas fa-times mr-2"></i>거절
                    </button>
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

  async showAdvertiserProfile() {
    try {
      const response = await axios.get('/api/profile/advertiser', this.getAuthHeaders());
      const profile = response.data;

      const content = document.getElementById('advertiserContent');
      content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">사업자 정보 관리</h2>
        <form id="advertiserProfileForm" onsubmit="event.preventDefault(); app.handleUpdateAdvertiserProfile();" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">회사명</label>
            <input type="text" id="companyName" value="${profile.company_name || ''}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">사업자등록번호</label>
            <input type="text" id="businessNumber" value="${profile.business_number || ''}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">대표자명</label>
            <input type="text" id="representativeName" value="${profile.representative_name || ''}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">사업자 주소</label>
            <input type="text" id="businessAddress" value="${profile.business_address || ''}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">연락처</label>
              <input type="tel" id="contactPhone" value="${profile.contact_phone || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">담당자 이메일</label>
              <input type="email" id="contactEmail" value="${profile.contact_email || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>

          <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
            저장
          </button>
        </form>
      `;
    } catch (error) {
      alert('프로필을 불러오는데 실패했습니다');
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
    } catch (error) {
      alert(error.response?.data?.error || '프로필 업데이트에 실패했습니다');
    }
  }

  // ============================================
  // Influencer Dashboard
  // ============================================

  async showInfluencerDashboard() {
    // Load profile to get points balance
    let pointsBalance = 0;
    try {
      const response = await axios.get('/api/profile/influencer', this.getAuthHeaders());
      pointsBalance = response.data.points_balance || 0;
    } catch (error) {
      console.error('Failed to load points:', error);
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
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs sm:text-sm opacity-90 mb-1">보유 스피어포인트</p>
                  <h2 class="text-3xl sm:text-4xl font-bold">${pointsBalance.toLocaleString()} <span class="text-xl">P</span></h2>
                </div>
                <div class="text-4xl sm:text-5xl opacity-80">
                  <i class="fas fa-coins"></i>
                </div>
              </div>
              <p class="text-xs sm:text-sm opacity-75 mt-3">
                <i class="fas fa-info-circle mr-1"></i>포인트는 캠페인 완료 시 지급됩니다
              </p>
            </div>

            <!-- 아코디언 메뉴 -->
            <div class="space-y-3 mb-4 sm:mb-8">
              <!-- 나의 캠페인 -->
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

              <!-- 관심 캠페인 -->
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

              <!-- 나의 컨텐츠 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAccordion('myContents')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-pen-to-square text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">나의 컨텐츠</h3>
                        <p class="text-xs sm:text-sm text-gray-600">등록한 리뷰 관리</p>
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

              <!-- 프로필 관리 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAccordion('profile')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-user text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">프로필 관리</h3>
                        <p class="text-xs sm:text-sm text-gray-600">채널 및 정산 정보</p>
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
    const allSections = ['myCampaigns', 'favoriteCampaigns', 'myContents', 'profile'];
    
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
                  <h4 class="font-bold text-lg mb-2">${app.campaign_title}</h4>
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-3 py-1 rounded-full text-sm font-semibold ${
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }">
                      ${app.status === 'pending' ? '대기중' :
                        app.status === 'approved' ? '확정' : '거절'}
                    </span>
                    <button onclick="app.viewCampaignDetail(${app.campaign_id})" class="text-purple-600 hover:text-purple-800 text-sm font-semibold">
                      캠페인 보기 →
                    </button>
                  </div>
                  ${app.status === 'approved' && !app.review_url ? `
                    <button onclick="app.submitReview(${app.campaign_id}, ${app.id})" class="mt-2 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                      결과 등록하기
                    </button>
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
      const applications = response.data.filter(app => app.status === 'approved');
      
      contentDiv.innerHTML = `
        <div class="p-4 sm:p-6">
          <h3 class="text-xl font-bold mb-4">나의 컨텐츠</h3>
          ${applications.length === 0 ? `
            <div class="text-center py-8">
              <i class="fas fa-pen-to-square text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-600">등록된 컨텐츠가 없습니다</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${applications.map(app => `
                <div class="border rounded-lg p-4">
                  <h4 class="font-bold text-lg mb-2">${app.campaign_title}</h4>
                  ${app.review_url ? `
                    <a href="${app.review_url}" target="_blank" class="text-purple-600 hover:text-purple-800 text-sm">
                      <i class="fas fa-external-link-alt mr-1"></i>컨텐츠 보기
                    </a>
                  ` : `
                    <p class="text-sm text-gray-500 mb-2">아직 컨텐츠를 등록하지 않았습니다</p>
                    <button onclick="app.submitReview(${app.campaign_id}, ${app.id})" class="text-purple-600 hover:text-purple-800 text-sm font-semibold">
                      <i class="fas fa-plus mr-1"></i>컨텐츠 등록하기
                    </button>
                  `}
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
      
      contentDiv.innerHTML = `
        <div class="p-4 sm:p-6">
          <form id="profileForm" onsubmit="event.preventDefault(); app.saveInfluencerProfile();">
            <h3 class="text-xl font-bold mb-4">프로필 관리</h3>
            
            <!-- 채널 정보 -->
            <div class="mb-6">
              <h4 class="font-semibold text-lg mb-3">채널 정보</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium mb-1">Instagram</label>
                  <input type="text" id="instagram" value="${profile.instagram_handle || ''}" class="w-full border rounded-lg px-3 py-2" placeholder="@username">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">팔로워 수</label>
                  <input type="number" id="followerCount" value="${profile.follower_count || ''}" class="w-full border rounded-lg px-3 py-2" placeholder="10000">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">YouTube</label>
                  <input type="text" id="youtube" value="${profile.youtube_channel || ''}" class="w-full border rounded-lg px-3 py-2" placeholder="채널 URL">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">블로그</label>
                  <input type="text" id="blog" value="${profile.blog_url || ''}" class="w-full border rounded-lg px-3 py-2" placeholder="블로그 URL">
                </div>
              </div>
            </div>

            <!-- 정산 정보 -->
            <div class="mb-6">
              <h4 class="font-semibold text-lg mb-3">정산 정보</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium mb-1">은행</label>
                  <input type="text" id="bank" value="${profile.bank_name || ''}" class="w-full border rounded-lg px-3 py-2" placeholder="국민은행">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">계좌번호</label>
                  <input type="text" id="accountNumber" value="${profile.account_number || ''}" class="w-full border rounded-lg px-3 py-2" placeholder="123-456-789">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">예금주</label>
                  <input type="text" id="accountHolder" value="${profile.account_holder || ''}" class="w-full border rounded-lg px-3 py-2" placeholder="홍길동">
                </div>
              </div>
            </div>

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

  // 프로필 저장
  async saveInfluencerProfile() {
    try {
      const data = {
        instagram_handle: document.getElementById('instagram').value,
        follower_count: parseInt(document.getElementById('followerCount').value) || 0,
        youtube_channel: document.getElementById('youtube').value,
        blog_url: document.getElementById('blog').value,
        bank_name: document.getElementById('bank').value,
        account_number: document.getElementById('accountNumber').value,
        account_holder: document.getElementById('accountHolder').value
      };
      
      await axios.put('/api/profile/influencer', data, this.getAuthHeaders());
      alert('프로필이 저장되었습니다');
      
      // 아코디언 닫기
      this.toggleAccordion('profile');
    } catch (error) {
      alert(error.response?.data?.error || '프로필 저장에 실패했습니다');
    }
  }

  // 나의 캠페인 (지원 내역 통합) - 구버전 호환
  async showMyCampaigns() {
    this.showMyApplications();
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
                  <h3 class="font-bold text-lg mb-2">${app.campaign_title}</h3>
                  ${app.review_url ? `
                    <a href="${app.review_url}" target="_blank" class="text-purple-600 hover:text-purple-800 text-sm">
                      <i class="fas fa-external-link-alt mr-1"></i>컨텐츠 보기
                    </a>
                  ` : `
                    <p class="text-sm text-gray-500">아직 컨텐츠를 등록하지 않았습니다</p>
                    <button onclick="app.submitReview(${app.campaign_id}, ${app.id})" class="mt-2 text-purple-600 hover:text-purple-800 text-sm font-semibold">
                      <i class="fas fa-plus mr-1"></i>컨텐츠 등록하기
                    </button>
                  `}
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
            const channelIcon = c.channel_type === 'instagram' ? '📸' : 
                               c.channel_type === 'blog' ? '📝' : 
                               c.channel_type === 'youtube' ? '🎥' : '📱';
            const channelName = c.channel_type === 'instagram' ? '인스타그램' : 
                               c.channel_type === 'blog' ? '블로그' : 
                               c.channel_type === 'youtube' ? '유튜브' : '기타';
            const channelColor = c.channel_type === 'instagram' ? 'bg-pink-100 text-pink-800' : 
                                c.channel_type === 'blog' ? 'bg-green-100 text-green-800' : 
                                c.channel_type === 'youtube' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
            
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
              <div class="p-4">
                <h3 class="font-bold text-lg mb-2 line-clamp-1">${c.title}</h3>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${c.description || '캠페인 설명이 없습니다'}</p>
                
                ${c.point_reward > 0 ? `
                  <div class="bg-purple-50 px-3 py-2 rounded-lg mb-3">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-purple-700"><i class="fas fa-coins mr-1"></i>포인트</span>
                      <span class="font-bold text-purple-600">${c.point_reward.toLocaleString()} P</span>
                    </div>
                  </div>
                ` : ''}
                
                <!-- 하단 정보 -->
                <div class="flex items-center justify-between pt-3 border-t">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${channelColor}">
                      ${channelIcon} ${channelName}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600">
                    <i class="fas fa-users mr-1"></i>
                    <span class="font-semibold text-purple-600">${c.application_count || 0}</span>/${c.slots}명
                  </div>
                </div>
                
                ${c.payment_status === 'paid' ? `
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
    // Load saved shipping info from profile
    let profile = {};
    try {
      const response = await axios.get('/api/profile/influencer', this.getAuthHeaders());
      profile = response.data;
    } catch (error) {
      console.error('Failed to load profile:', error);
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
          <p class="text-sm text-gray-600 mb-4">캠페인 진행을 위한 필수 정보입니다</p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
              <input type="text" id="realName" required placeholder="실명을 입력해주세요"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">생년월일 *</label>
                <input type="date" id="birthDate" required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                <select id="gender" required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">연락처 *</label>
              <input type="tel" id="contactPhone" required placeholder="010-1234-5678"
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

              ${a.status === 'approved' ? `
                <button onclick="app.submitReview(${a.id})" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm mt-2">
                  <i class="fas fa-upload mr-1"></i>결과 등록
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      alert('지원 내역을 불러오는데 실패했습니다');
    }
  }

  async submitReview(applicationId) {
    const postUrl = prompt('포스트 URL을 입력하세요:');
    
    if (!postUrl) {
      return;
    }

    try {
      await axios.post(`/api/applications/${applicationId}/review`, { post_url: postUrl }, this.getAuthHeaders());
      alert('결과가 등록되었습니다!');
      this.showMyApplications();
    } catch (error) {
      alert(error.response?.data?.error || '결과 등록에 실패했습니다');
    }
  }

  async showInfluencerProfile() {
    try {
      const response = await axios.get('/api/profile/influencer', this.getAuthHeaders());
      const profile = response.data;

      const content = document.getElementById('influencerContent');
      content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">프로필 관리</h2>
        <form id="influencerProfileForm" onsubmit="event.preventDefault(); app.handleUpdateInfluencerProfile();" class="space-y-6">
          
          <!-- 개인 정보 섹션 -->
          <div class="bg-white border-2 border-gray-200 rounded-lg p-4">
            <h3 class="font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-id-card text-blue-600 mr-2"></i>개인 정보
            </h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">실명</label>
                <input type="text" id="realName" value="${profile.real_name || ''}" placeholder="본명을 입력해주세요"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                <p class="text-xs text-gray-500 mt-1">상품 배송 및 정산을 위해 필요합니다</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                  <input type="date" id="birthDate" value="${profile.birth_date || ''}"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">성별</label>
                  <select id="gender" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                    <option value="">선택 안함</option>
                    <option value="male" ${profile.gender === 'male' ? 'selected' : ''}>남성</option>
                    <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>여성</option>
                    <option value="other" ${profile.gender === 'other' ? 'selected' : ''}>기타</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <input type="tel" id="contactPhone" value="${profile.contact_phone || ''}" placeholder="010-1234-5678"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
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
                <label class="block text-sm font-medium text-gray-700 mb-2">예금주명</label>
                <input type="text" id="accountHolderName" value="${profile.account_holder_name || ''}"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">은행명</label>
                  <input type="text" id="bankName" value="${profile.bank_name || ''}"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                  <input type="text" id="accountNumber" value="${profile.account_number || ''}"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">사업자등록번호 (선택)</label>
                <input type="text" id="businessNumber" value="${profile.business_number || ''}" placeholder="사업자인 경우 입력"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
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
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">수령인</label>
                  <input type="text" id="shippingName" value="${profile.shipping_name || ''}" placeholder="받으실 분 성함"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                  <input type="tel" id="shippingPhone" value="${profile.shipping_phone || ''}" placeholder="010-1234-5678"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">우편번호</label>
                <div class="flex gap-2">
                  <input type="text" id="shippingPostalCode" value="${profile.shipping_postal_code || ''}" placeholder="12345" readonly
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-gray-50">
                  <button type="button" onclick="app.searchAddress('profile')" 
                    class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 whitespace-nowrap">
                    <i class="fas fa-search mr-1"></i>주소 검색
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">주소</label>
                <input type="text" id="shippingAddress" value="${profile.shipping_address || ''}" placeholder="주소 검색 버튼을 클릭하세요" readonly
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-gray-50">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
                <input type="text" id="shippingAddressDetail" value="${profile.shipping_address_detail || ''}" placeholder="아파트 동/호수, 건물명 등"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
            </div>
          </div>

          <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
            저장
          </button>
        </form>
      `;
    } catch (error) {
      alert('프로필을 불러오는데 실패했습니다');
    }
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
      };

      await axios.put('/api/profile/influencer', data, this.getAuthHeaders());
      alert('프로필이 업데이트되었습니다');
    } catch (error) {
      alert(error.response?.data?.error || '프로필 업데이트에 실패했습니다');
    }
  }

  // ============================================
  // Admin Dashboard
  // ============================================

  async showAdminDashboard() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-user-circle text-purple-600 mr-2"></i>마이페이지
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">${this.user.nickname}님 (관리자)</p>
            </div>

            <!-- 아코디언 메뉴 -->
            <div class="space-y-3 mb-4 sm:mb-8">
              <!-- 캠페인 관리 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAdminAccordion('campaignManagement')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-list text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">캠페인 관리</h3>
                        <p class="text-xs sm:text-sm text-gray-600">전체 캠페인 승인 및 관리</p>
                      </div>
                    </div>
                    <i id="campaignManagement-icon" class="fas fa-chevron-down text-gray-400 transition-transform"></i>
                  </div>
                </button>
                <div id="campaignManagement-content" class="hidden border-t">
                  <div class="p-4 sm:p-6">
                    <p class="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              </div>

              <!-- 정산 내역 -->
              <div class="bg-white rounded-lg shadow">
                <button onclick="app.toggleAdminAccordion('settlements')" class="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <i class="fas fa-file-excel text-purple-600 text-xl sm:text-2xl"></i>
                      <div>
                        <h3 class="font-semibold text-base sm:text-lg">정산 내역</h3>
                        <p class="text-xs sm:text-sm text-gray-600">캠페인 정산 내역 조회</p>
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
    
    // 승인 대기 중인 캠페인이 있는지 확인하고 자동으로 표시
    setTimeout(async () => {
      try {
        const response = await axios.get('/api/admin/campaigns', this.getAuthHeaders());
        const campaigns = response.data;
        const pendingCampaigns = campaigns.filter(c => c.status === 'pending');
        
        if (pendingCampaigns.length > 0) {
          // 승인 대기 중인 캠페인이 있으면 자동으로 캠페인 관리 열기
          await this.toggleAdminAccordion('campaignManagement');
        }
      } catch (error) {
        console.error('Check pending campaigns error:', error);
      }
    }, 100);
  }

  async toggleAdminAccordion(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const icon = document.getElementById(`${sectionId}-icon`);
    const allSections = ['campaignManagement', 'settlements'];
    
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
        case 'campaignManagement':
          await this.loadCampaignManagementContent(content);
          break;
        case 'settlements':
          await this.loadSettlementsContent(content);
          break;
      }
    } catch (error) {
      console.error('Failed to load accordion content:', error);
      content.innerHTML = '<p class="text-red-600 p-4">콘텐츠를 불러오는데 실패했습니다</p>';
    }
  }

  async loadCampaignManagementContent(container) {
    try {
      const response = await axios.get('/api/admin/campaigns', this.getAuthHeaders());
      const campaigns = response.data;

      container.innerHTML = `
        <div class="p-4 sm:p-6">
          <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">전체 캠페인 관리</h2>
          <div class="space-y-3 sm:space-y-4">
            ${campaigns.map(c => `
              <div class="border rounded-lg p-3 sm:p-4">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                  <div class="flex-1">
                    <h3 class="font-bold text-base sm:text-lg text-blue-600 hover:text-blue-800 cursor-pointer" onclick="app.editCampaignAsAdmin(${c.id})">
                      <i class="fas fa-edit mr-1"></i>${c.title}
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600">광고주: ${c.advertiser_nickname} (${c.advertiser_email})</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs sm:text-sm ${this.getStatusBadge(c.status)} whitespace-nowrap self-start">
                    ${this.getStatusText(c.status)}
                  </span>
                </div>

                <p class="text-sm sm:text-base text-gray-600 mb-2">${c.description || ''}</p>
                
                ${c.point_reward > 0 ? `
                  <div class="bg-blue-50 border border-blue-200 rounded p-2 sm:p-3 mb-2 text-xs sm:text-sm">
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <p class="text-gray-600">인당 포인트</p>
                        <p class="font-semibold text-base sm:text-lg">${c.point_reward.toLocaleString()}P</p>
                      </div>
                      <div>
                        <p class="text-gray-600">총 포인트</p>
                        <p class="font-semibold text-base sm:text-lg">${(c.point_reward * c.slots).toLocaleString()}P</p>
                      </div>
                      <div>
                        <p class="text-gray-600">플랫폼 수익 (20%)</p>
                        <p class="font-semibold text-base sm:text-lg text-green-600">${Math.floor(c.point_reward * c.slots * 0.20).toLocaleString()}원</p>
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
                ` : ''}
                
                <div class="flex flex-wrap gap-2 mt-3">
                  ${c.status === 'pending' ? `
                    <button onclick="app.updateCampaignStatus(${c.id}, 'approved')" 
                      class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs sm:text-sm">
                      <i class="fas fa-check mr-1"></i>승인
                    </button>
                  ` : ''}
                  ${c.status === 'approved' && c.point_reward > 0 && c.payment_status === 'unpaid' ? `
                    <button onclick="app.markAsPaid(${c.id})" 
                      class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs sm:text-sm">
                      <i class="fas fa-credit-card mr-1"></i>결제 완료 처리
                    </button>
                  ` : ''}
                  ${c.status === 'approved' ? `
                    <button onclick="app.updateCampaignStatus(${c.id}, 'suspended')" 
                      class="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 text-xs sm:text-sm">
                      <i class="fas fa-pause mr-1"></i>일시중지
                    </button>
                  ` : ''}
                  ${c.status === 'suspended' ? `
                    <button onclick="app.updateCampaignStatus(${c.id}, 'approved')" 
                      class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs sm:text-sm">
                      <i class="fas fa-play mr-1"></i>재개
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load campaign management:', error);
      container.innerHTML = '<p class="text-red-600 p-4">캠페인 목록을 불러오는데 실패했습니다</p>';
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

  async showAllCampaigns() {
    try {
      const response = await axios.get('/api/admin/campaigns', this.getAuthHeaders());
      const campaigns = response.data;

      const content = document.getElementById('adminContent');
      content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">전체 캠페인 관리</h2>
        <div class="space-y-4">
          ${campaigns.map(c => `
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-bold text-lg text-blue-600 hover:text-blue-800 cursor-pointer" onclick="app.editCampaignAsAdmin(${c.id})">
                    <i class="fas fa-edit mr-1"></i>${c.title}
                  </h3>
                  <p class="text-sm text-gray-600">광고주: ${c.advertiser_nickname} (${c.advertiser_email})</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm ${this.getStatusBadge(c.status)}">
                  ${this.getStatusText(c.status)}
                </span>
              </div>

              <p class="text-gray-600 mb-2">${c.description || ''}</p>
              
              ${c.point_reward > 0 ? `
                <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-2 text-sm">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <p class="text-gray-600">인당 포인트</p>
                      <p class="font-semibold text-lg">${c.point_reward.toLocaleString()}P</p>
                    </div>
                    <div>
                      <p class="text-gray-600">총 포인트</p>
                      <p class="font-semibold text-lg">${(c.point_reward * c.slots).toLocaleString()}P</p>
                    </div>
                    <div>
                      <p class="text-gray-600">플랫폼 수익 (20%)</p>
                      <p class="font-semibold text-lg text-green-600">${Math.floor(c.point_reward * c.slots * 0.20).toLocaleString()}원</p>
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
              ` : ''}
              
              <div class="flex space-x-2 mt-3">
                ${c.status === 'pending' ? `
                  <button onclick="app.updateCampaignStatus(${c.id}, 'approved')" 
                    class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
                    <i class="fas fa-check mr-1"></i>승인
                  </button>
                ` : ''}
                ${c.status === 'approved' && c.point_reward > 0 && c.payment_status === 'unpaid' ? `
                  <button onclick="app.markAsPaid(${c.id})" 
                    class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
                    <i class="fas fa-credit-card mr-1"></i>결제 완료 처리
                  </button>
                ` : ''}
                ${c.status === 'approved' ? `
                  <button onclick="app.updateCampaignStatus(${c.id}, 'suspended')" 
                    class="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 text-sm">
                    <i class="fas fa-pause mr-1"></i>일시중지
                  </button>
                ` : ''}
                ${c.status === 'suspended' ? `
                  <button onclick="app.updateCampaignStatus(${c.id}, 'approved')" 
                    class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
                    <i class="fas fa-play mr-1"></i>재개
                  </button>
                ` : ''}
                <button onclick="app.updateCampaignStatus(${c.id}, 'cancelled')" 
                  class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm">
                  <i class="fas fa-ban mr-1"></i>취소
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      alert('캠페인 목록을 불러오는데 실패했습니다');
    }
  }

  async updateCampaignStatus(campaignId, status) {
    try {
      await axios.put(`/api/admin/campaigns/${campaignId}/status`, { status }, this.getAuthHeaders());
      alert('상태가 변경되었습니다');
      this.showAllCampaigns();
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
      this.showAllCampaigns();
    } catch (error) {
      alert(error.response?.data?.error || '결제 처리에 실패했습니다');
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

  getStatusBadge(status) {
    return UIUtils.getStatusBadge(status);
  }

  getStatusText(status) {
    return UIUtils.getStatusText(status);
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
            <button onclick="${app.showHome()}" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
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
                  <h2 class="text-xl font-bold mb-3">제3조 (포인트 제도)</h2>
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
                    <li>적립된 포인트는 5,000포인트 이상부터 현금으로 출금 신청이 가능합니다.</li>
                    <li>출금 신청 시 등록된 계좌로 영업일 기준 7일 이내에 지급됩니다.</li>
                    <li>부정한 방법으로 포인트를 적립한 경우, 회사는 해당 포인트를 회수하고 회원 자격을 제한할 수 있습니다.</li>
                    <li>포인트의 유효기간은 적립일로부터 2년입니다.</li>
                  </ol>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">제4조 (캠페인 참여)</h2>
                  <ol class="list-decimal pl-5 space-y-2">
                    <li>인플루언서는 승인된 캠페인에 자유롭게 지원할 수 있습니다.</li>
                    <li>광고주는 지원자 중 적합한 인플루언서를 선정할 권한이 있습니다.</li>
                    <li>선정된 인플루언서는 캠페인 요구사항에 따라 성실히 활동해야 합니다.</li>
                    <li>캠페인 완료 후 포스트 URL 등 증빙자료를 제출해야 포인트가 지급됩니다.</li>
                  </ol>
                </section>

                <section>
                  <h2 class="text-xl font-bold mb-3">제5조 (회원의 의무)</h2>
                  <ol class="list-decimal pl-5 space-y-2">
                    <li>회원은 관계 법령, 본 약관, 이용안내 및 서비스상 공지사항 등을 준수해야 합니다.</li>
                    <li>회원은 본인의 계정 정보를 제3자에게 제공하거나 이용하게 해서는 안 됩니다.</li>
                    <li>인플루언서는 진실하고 성실한 리뷰를 작성해야 하며, 허위 또는 과장된 내용을 포함해서는 안 됩니다.</li>
                    <li>광고주는 적법한 제품 및 서비스에 대한 캠페인만 등록해야 합니다.</li>
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
    // 포커스 시 0이면 비우기
    if (input.value === '0' || input.value === '0원') {
      input.value = '';
    }
  }

  getNumericValue(input) {
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
            <button onclick="${app.showHome()}" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
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
}

// Initialize app
const app = new ReviewSphere();
