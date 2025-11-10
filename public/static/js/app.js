// ReviewSphere Frontend Application

class ReviewSphere {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.currentPage = 'home';
    this.init();
  }

  init() {
    if (this.token && this.user) {
      this.showDashboard();
    } else {
      this.showHome();
    }
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
      
      this.showDashboard();
    } catch (error) {
      alert(error.response?.data?.error || '로그인에 실패했습니다');
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

  async showHome() {
    const app = document.getElementById('app');
    
    // Load campaigns for display
    let ongoingCampaigns = [];
    let bestCampaigns = [];
    let bestReviews = [];
    
    try {
      const response = await axios.get('/api/campaigns');
      const allCampaigns = response.data || [];
      ongoingCampaigns = allCampaigns.slice(0, 10); // First 10 as ongoing
      bestCampaigns = allCampaigns.slice(0, 5); // Top 5 as best
    } catch (error) {
      console.log('Failed to load campaigns:', error);
    }
    
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        <nav class="bg-white shadow-lg sticky top-0 z-50">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div class="flex justify-between items-center h-14 sm:h-16">
              <div class="flex items-center">
                <h1 class="text-lg sm:text-2xl font-bold text-purple-600 cursor-pointer" onclick="app.showHome()">
                  <i class="fas fa-globe mr-1 sm:mr-2"></i>ReviewSphere
                </h1>
              </div>
              <div class="flex space-x-2 sm:space-x-4">
                <button onclick="app.showLogin()" class="bg-purple-600 text-white hover:bg-purple-700 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition">
                  시작하기
                </button>
              </div>
            </div>
          </div>
        </nav>

        <!-- Hero Section -->
        <div class="bg-gradient-to-br from-purple-600 to-blue-500 text-white py-12 sm:py-16">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              진짜 리뷰, 진짜 성장
            </h2>
            <p class="text-base sm:text-lg lg:text-xl text-purple-100 mb-8">
              AI 기반 매칭으로 광고주와 인플루언서를 직접 연결합니다
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
                ${ongoingCampaigns.length > 0 ? ongoingCampaigns.map(c => `
                  <div onclick="app.viewCampaignDetail(${c.id})" class="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl transition cursor-pointer flex-shrink-0" style="width: 280px;">
                    <div class="flex items-center justify-between mb-3">
                      <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">진행중</span>
                      <span class="text-sm text-gray-500">${c.slots || 1}명 모집</span>
                    </div>
                    <h4 class="font-bold text-lg mb-2 line-clamp-2">${c.title}</h4>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${c.description || '캠페인 설명이 없습니다'}</p>
                    ${c.point_reward > 0 ? `
                      <div class="bg-purple-50 px-3 py-2 rounded-lg mb-2">
                        <div class="flex items-center justify-between text-xs text-purple-700">
                          <span><i class="fas fa-coins mr-1"></i>스피어포인트</span>
                          <span class="font-bold text-purple-600">${c.point_reward.toLocaleString()} P/인</span>
                        </div>
                      </div>
                    ` : ''}
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-purple-600 font-semibold">${c.budget ? c.budget.toLocaleString() + '원' : '예산 미정'}</span>
                      <button class="text-purple-600 hover:text-purple-800 font-semibold">
                        자세히 보기 <i class="fas fa-arrow-right ml-1"></i>
                      </button>
                    </div>
                  </div>
                `).join('') : `
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
                ${bestCampaigns.length > 0 ? bestCampaigns.map((c, idx) => `
                  <div onclick="app.viewCampaignDetail(${c.id})" class="bg-white border-2 border-yellow-200 rounded-xl p-5 hover:shadow-xl transition cursor-pointer flex-shrink-0" style="width: 280px;">
                    <div class="flex items-center justify-between mb-3">
                      <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        <i class="fas fa-crown mr-1"></i>Top ${idx + 1}
                      </span>
                    </div>
                    <h4 class="font-bold text-lg mb-2 line-clamp-2">${c.title}</h4>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${c.description || '캠페인 설명이 없습니다'}</p>
                    ${c.point_reward > 0 ? `
                      <div class="bg-purple-50 px-3 py-2 rounded-lg mb-2">
                        <div class="flex items-center justify-between text-xs text-purple-700">
                          <span><i class="fas fa-coins mr-1"></i>스피어포인트</span>
                          <span class="font-bold text-purple-600">${c.point_reward.toLocaleString()} P/인</span>
                        </div>
                      </div>
                    ` : ''}
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-purple-600 font-semibold">${c.budget ? c.budget.toLocaleString() + '원' : '예산 미정'}</span>
                      <button class="text-purple-600 hover:text-purple-800 font-semibold">
                        자세히 보기 <i class="fas fa-arrow-right ml-1"></i>
                      </button>
                    </div>
                  </div>
                `).join('') : `
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
                ${bestReviews.length > 0 ? bestReviews.map(r => `
                  <div class="bg-white border-2 border-red-200 rounded-xl p-5 hover:shadow-xl transition cursor-pointer flex-shrink-0" style="width: 280px;">
                    <div class="flex items-center mb-3">
                      <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        <i class="fas fa-heart mr-1"></i>Best
                      </span>
                    </div>
                    <h4 class="font-bold text-lg mb-2">리뷰 제목</h4>
                    <p class="text-gray-600 text-sm mb-3">리뷰 내용...</p>
                    <a href="#" class="text-purple-600 hover:text-purple-800 text-sm font-semibold">
                      포스트 보기 <i class="fas fa-external-link-alt ml-1"></i>
                    </a>
                  </div>
                `).join('') : `
                  <div class="w-full text-center py-16">
                    <i class="fas fa-comment-dots text-6xl text-gray-300 mb-4"></i>
                    <p class="text-xl text-gray-500 mb-2">베스트 리뷰를 기다리고 있어요</p>
                    <p class="text-sm text-gray-400">첫 베스트 리뷰의 주인공이 되어주세요!</p>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>

        ${this.renderFooter()}
      </div>
    `;
  }

  showLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <div class="flex-grow bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center px-4 py-12">
          <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-globe text-purple-600 mr-2"></i>ReviewSphere
              </h2>
              <p class="text-gray-600 mt-2">로그인</p>
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
                계정이 없으신가요? <button onclick="app.showRegister()" class="text-purple-600 hover:underline font-semibold">회원가입</button>
              </div>
              <button onclick="app.showHome()" class="text-gray-500 hover:text-gray-700 text-sm">
                <i class="fas fa-arrow-left mr-1"></i>홈으로
              </button>
            </div>
          </div>
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  showRegister(preselectedRole = null) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <div class="flex-grow bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center px-4 py-12">
          <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-globe text-purple-600 mr-2"></i>ReviewSphere
              </h2>
              <p class="text-gray-600 mt-2">회원가입</p>
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
                이미 계정이 있으신가요? <button onclick="app.showLogin()" class="text-purple-600 hover:underline font-semibold">로그인</button>
              </div>
              <button onclick="app.showHome()" class="text-gray-500 hover:text-gray-700 text-sm">
                <i class="fas fa-arrow-left mr-1"></i>홈으로
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

  async viewCampaignDetail(campaignId) {
    // Check if user is logged in
    if (!this.token || !this.user) {
      if (confirm('캠페인 상세 정보를 보려면 로그인이 필요합니다. 로그인 하시겠습니까?')) {
        this.showLogin();
      }
      return;
    }

    try {
      const response = await axios.get(`/api/campaigns/${campaignId}`, this.getAuthHeaders());
      const campaign = response.data;
      
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen flex flex-col bg-gray-50">
          ${this.renderNav()}
          
          <div class="flex-grow">
            <div class="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
              <button onclick="app.showHome()" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>홈으로 돌아가기
              </button>
              
              <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                <div class="flex items-center justify-between mb-4">
                  <span class="px-4 py-2 rounded-full text-sm font-semibold ${this.getStatusBadge(campaign.status)}">
                    ${this.getStatusText(campaign.status)}
                  </span>
                  <span class="text-gray-500">${campaign.slots || 1}명 모집</span>
                </div>
                
                <h1 class="text-3xl font-bold text-gray-800 mb-4">${campaign.title}</h1>
                
                <div class="prose max-w-none mb-6">
                  <p class="text-gray-600 whitespace-pre-wrap">${campaign.description || '캠페인 설명이 없습니다.'}</p>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                  
                  ${campaign.start_date ? `
                    <div class="bg-gray-50 p-4 rounded-lg">
                      <span class="text-sm text-gray-500">시작일</span>
                      <p class="font-semibold">${campaign.start_date}</p>
                    </div>
                  ` : ''}
                  
                  ${campaign.end_date ? `
                    <div class="bg-gray-50 p-4 rounded-lg">
                      <span class="text-sm text-gray-500">종료일</span>
                      <p class="font-semibold">${campaign.end_date}</p>
                    </div>
                  ` : ''}
                </div>
                
                ${campaign.point_reward > 0 ? `
                  <div class="bg-purple-50 p-4 rounded-lg mb-6 border-2 border-purple-200">
                    <h3 class="font-semibold text-purple-900 mb-3 flex items-center">
                      <i class="fas fa-coins mr-2"></i>스피어포인트 보상
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <span class="text-sm text-purple-700">인당 지급</span>
                        <p class="text-2xl font-bold text-purple-600">${campaign.point_reward.toLocaleString()} P</p>
                      </div>
                      <div>
                        <span class="text-sm text-purple-700">총 포인트</span>
                        <p class="text-2xl font-bold text-purple-600">${(campaign.point_reward * campaign.slots).toLocaleString()} P</p>
                      </div>
                    </div>
                    <p class="text-xs text-purple-600 mt-3">
                      <i class="fas fa-info-circle mr-1"></i>캠페인 완료 후 자동으로 지급됩니다 (1P = 1원)
                    </p>
                  </div>
                ` : ''}
                
                ${campaign.requirements ? `
                  <div class="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 class="font-semibold text-blue-900 mb-2">
                      <i class="fas fa-list-check mr-2"></i>요구사항
                    </h3>
                    <p class="text-blue-800 whitespace-pre-wrap">${campaign.requirements}</p>
                  </div>
                ` : ''}
                
                ${campaign.product_url ? `
                  <div class="mb-6">
                    <a href="${campaign.product_url}" target="_blank" class="text-purple-600 hover:text-purple-800 flex items-center">
                      <i class="fas fa-external-link-alt mr-2"></i>제품 페이지 바로가기
                    </a>
                  </div>
                ` : ''}
                
                ${this.user.role === 'influencer' && campaign.status === 'approved' ? `
                  <div class="mt-8">
                    <button onclick="app.applyCampaign(${campaign.id})" class="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-purple-700 transition shadow-lg">
                      <i class="fas fa-paper-plane mr-2"></i>이 캠페인에 지원하기
                    </button>
                    <p class="text-sm text-gray-500 text-center mt-2">지원 후 광고주가 확인하면 알림을 받으실 수 있습니다</p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          
          ${this.renderFooter()}
        </div>
      `;
    } catch (error) {
      alert('캠페인 정보를 불러오는데 실패했습니다');
      this.showHome();
    }
  }

  async applyCampaign(campaignId) {
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

  showDashboard() {
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
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-bullhorn text-purple-600 mr-2"></i>${roleTitle} 대시보드
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">${this.user.nickname}님 환영합니다</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-8">
              <button onclick="app.showMyCampaigns()" class="bg-white p-5 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-95">
                <i class="fas fa-list text-purple-600 text-2xl sm:text-3xl mb-1 sm:mb-2"></i>
                <h3 class="font-semibold text-base sm:text-lg">내 캠페인</h3>
                <p class="text-xs sm:text-sm text-gray-600 mt-1">등록한 캠페인 관리</p>
              </button>
              <button onclick="app.showCreateCampaign()" class="bg-purple-600 text-white p-5 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-95">
                <i class="fas fa-plus-circle text-2xl sm:text-3xl mb-1 sm:mb-2"></i>
                <h3 class="font-semibold text-base sm:text-lg">캠페인 등록</h3>
                <p class="text-xs sm:text-sm opacity-90 mt-1">새 캠페인 만들기</p>
              </button>
              <button onclick="app.showAdvertiserProfile()" class="bg-white p-5 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-95">
                <i class="fas fa-user text-purple-600 text-2xl sm:text-3xl mb-1 sm:mb-2"></i>
                <h3 class="font-semibold text-base sm:text-lg">프로필 관리</h3>
                <p class="text-xs sm:text-sm text-gray-600 mt-1">사업자 정보 관리</p>
              </button>
            </div>

            <div id="advertiserContent" class="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-8">
              <p class="text-sm sm:text-base text-gray-600">위 메뉴를 선택해주세요</p>
            </div>
          </div>
        </div>
        
        ${this.renderFooter()}
      </div>
    `;
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
            <div class="border rounded-lg p-4 hover:shadow-md transition">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-lg">${c.title}</h3>
                <span class="px-3 py-1 rounded-full text-sm ${this.getStatusBadge(c.status)}">
                  ${this.getStatusText(c.status)}
                </span>
              </div>
              <p class="text-gray-600 mb-2">${c.description || ''}</p>
              <div class="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-2">
                <span>예산: ${c.budget ? c.budget.toLocaleString() + '원' : '미정'}</span>
                <span>모집인원: ${c.slots}명</span>
                ${c.point_reward > 0 ? `
                  <span class="col-span-2 text-purple-600 font-semibold">
                    <i class="fas fa-coins mr-1"></i>포인트: ${c.point_reward.toLocaleString()}P/인 (총 ${(c.point_reward * c.slots).toLocaleString()}P)
                  </span>
                ` : ''}
              </div>
              <div class="mt-4 flex space-x-2">
                <button onclick="app.editCampaign(${c.id})" class="text-blue-600 hover:underline text-sm">
                  <i class="fas fa-edit mr-1"></i>수정
                </button>
                ${c.status === 'approved' ? `
                  <button onclick="app.viewApplications(${c.id})" class="text-purple-600 hover:underline text-sm">
                    <i class="fas fa-users mr-1"></i>지원자 보기
                  </button>
                ` : ''}
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
    const content = document.getElementById('advertiserContent');
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
              <input type="number" id="campaignSlots" value="1" min="1" required
                oninput="app.calculateCampaignCost()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
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
                <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 신청 시작일</label>
                <input type="date" id="campaignApplicationStartDate"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 신청 마감일</label>
                <input type="date" id="campaignApplicationEndDate"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">인플루언서 선정발표일</label>
              <input type="date" id="campaignAnnouncementDate"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">컨텐츠 등록 시작일</label>
                <input type="date" id="campaignContentStartDate"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">컨텐츠 등록 마감일</label>
                <input type="date" id="campaignContentEndDate"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">결과 발표일</label>
              <input type="date" id="campaignResultAnnouncementDate"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
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
              <input type="number" id="campaignBudget" placeholder="제공 항목의 예상 가액을 입력해주세요"
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
              <label class="block text-sm font-medium text-gray-700 mb-2">미션</label>
              <textarea id="campaignMission" rows="3" placeholder="예: 제품 사용 후 SNS에 솔직한 후기 게시"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"></textarea>
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
              <input type="text" id="campaignKeywords" placeholder="예: #화장품, #뷰티, #리뷰 (쉼표로 구분)"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              <p class="text-xs text-gray-500 mt-1">컨텐츠에 포함될 해시태그나 키워드를 입력해주세요</p>
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
              <input type="number" id="campaignPointReward" value="0" min="0" step="1000"
                oninput="app.calculateCampaignCost()"
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
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">총 포인트 비용</span>
              <span class="font-bold text-purple-900" id="totalPointCost">0원</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">플랫폼 수수료 (15%)</span>
              <span class="font-bold text-orange-600" id="platformFee">0원</span>
            </div>
            <div class="border-t border-purple-200 pt-2 mt-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-gray-800">결제 필요 금액</span>
                <span class="font-bold text-2xl text-red-600" id="totalCost">0원</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-600 mt-2">
            <i class="fas fa-info-circle mr-1"></i>
            포인트 지급이 있는 캠페인은 사전 결제가 필요합니다. 결제 완료 후 캠페인이 활성화됩니다.
          </p>
        </div>

        <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          캠페인 등록
        </button>
        
        <p class="text-sm text-gray-600 text-center">* 관리자 승인 후 활성화됩니다</p>
      </form>
    `;
    
    // Initialize cost calculation
    setTimeout(() => this.calculateCampaignCost(), 0);
  }

  calculateCampaignCost() {
    const slots = parseInt(document.getElementById('campaignSlots')?.value || 1);
    const pointPerPerson = parseInt(document.getElementById('campaignPointReward')?.value || 0);
    
    const totalPoints = slots * pointPerPerson;
    const totalPointCost = totalPoints;
    const platformFee = Math.floor(totalPointCost * 0.15);
    const totalCost = totalPointCost + platformFee;
    
    // Update display
    document.getElementById('totalPoints').value = totalPoints.toLocaleString() + ' P';
    document.getElementById('totalPointCost').textContent = totalPointCost.toLocaleString() + '원';
    document.getElementById('platformFee').textContent = platformFee.toLocaleString() + '원';
    document.getElementById('totalCost').textContent = totalCost.toLocaleString() + '원';
  }

  async handleCreateCampaign() {
    try {
      const pointReward = parseInt(document.getElementById('campaignPointReward').value || 0);
      
      const data = {
        title: document.getElementById('campaignTitle').value,
        description: document.getElementById('campaignDescription').value,
        product_name: document.getElementById('campaignProductName').value,
        product_url: document.getElementById('campaignProductUrl').value,
        requirements: document.getElementById('campaignRequirements').value,
        budget: document.getElementById('campaignBudget').value || null,
        slots: document.getElementById('campaignSlots').value || 1,
        point_reward: pointReward,
        
        // 일정 관리
        application_start_date: document.getElementById('campaignApplicationStartDate').value || null,
        application_end_date: document.getElementById('campaignApplicationEndDate').value || null,
        announcement_date: document.getElementById('campaignAnnouncementDate').value || null,
        content_start_date: document.getElementById('campaignContentStartDate').value || null,
        content_end_date: document.getElementById('campaignContentEndDate').value || null,
        result_announcement_date: document.getElementById('campaignResultAnnouncementDate').value || null,
        
        // 캠페인 상세 정보
        provided_items: document.getElementById('campaignProvidedItems').value,
        mission: document.getElementById('campaignMission').value,
        keywords: document.getElementById('campaignKeywords').value,
        notes: document.getElementById('campaignNotes').value,
      };

      // Validate point reward for campaigns requiring payment
      if (pointReward > 0) {
        const slots = parseInt(data.slots);
        const totalCost = Math.floor((pointReward * slots) * 1.15);
        if (!confirm(`총 ${totalCost.toLocaleString()}원(포인트 비용 + 수수료 15%)을 결제하셔야 합니다. 계속하시겠습니까?`)) {
          return;
        }
      }

      const response = await axios.post('/api/campaigns', data, this.getAuthHeaders());
      alert(response.data.message);
      this.showMyCampaigns();
    } catch (error) {
      alert(error.response?.data?.error || '캠페인 등록에 실패했습니다');
    }
  }

  async viewApplications(campaignId) {
    try {
      const response = await axios.get(`/api/campaigns/${campaignId}/applications`, this.getAuthHeaders());
      const applications = response.data;

      const content = document.getElementById('advertiserContent');
      content.innerHTML = `
        <div class="mb-4">
          <button onclick="app.showMyCampaigns()" class="text-gray-600 hover:text-gray-800">
            <i class="fas fa-arrow-left mr-2"></i>캠페인 목록으로
          </button>
        </div>

        <h2 class="text-2xl font-bold mb-6">지원자 목록</h2>
        ${applications.length === 0 ? '<p class="text-gray-600">지원자가 없습니다</p>' : ''}
        <div class="space-y-4">
          ${applications.map(a => `
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h3 class="font-bold">${a.nickname} (${a.email})</h3>
                  <p class="text-sm text-gray-600">지원일: ${new Date(a.applied_at).toLocaleDateString()}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm ${this.getApplicationStatusBadge(a.status)}">
                  ${this.getApplicationStatusText(a.status)}
                </span>
              </div>

              <div class="mb-3 text-sm">
                <p><strong>인스타그램:</strong> ${a.instagram_handle || '-'}</p>
                <p><strong>유튜브:</strong> ${a.youtube_channel || '-'}</p>
                <p><strong>블로그:</strong> ${a.blog_url || '-'}</p>
                <p><strong>틱톡:</strong> ${a.tiktok_handle || '-'}</p>
                <p><strong>팔로워:</strong> ${a.follower_count ? a.follower_count.toLocaleString() : '0'}</p>
                <p><strong>카테고리:</strong> ${a.category || '-'}</p>
              </div>

              ${a.message ? `<p class="text-sm text-gray-700 mb-3"><strong>지원 메시지:</strong> ${a.message}</p>` : ''}

              ${a.status === 'pending' ? `
                <div class="flex space-x-2">
                  <button onclick="app.updateApplicationStatus(${a.id}, 'approved')" 
                    class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
                    <i class="fas fa-check mr-1"></i>확정
                  </button>
                  <button onclick="app.updateApplicationStatus(${a.id}, 'rejected')" 
                    class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                    <i class="fas fa-times mr-1"></i>거절
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      alert(error.response?.data?.error || '지원자 목록을 불러오는데 실패했습니다');
    }
  }

  async updateApplicationStatus(applicationId, status) {
    try {
      await axios.put(`/api/applications/${applicationId}/status`, { status }, this.getAuthHeaders());
      alert('처리되었습니다');
      // Reload current view
      const campaignId = prompt('캠페인 ID를 입력하세요 (개선 필요)');
      if (campaignId) {
        this.viewApplications(campaignId);
      }
    } catch (error) {
      alert(error.response?.data?.error || '처리에 실패했습니다');
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
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50">
        ${this.renderNav()}
        
        <div class="flex-grow">
          <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
            <div class="mb-4 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                <i class="fas fa-star text-purple-600 mr-2"></i>인플루언서 대시보드
              </h1>
              <p class="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">${this.user.nickname}님 환영합니다</p>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-8">
              <button onclick="app.showAvailableCampaigns()" class="bg-purple-600 text-white p-5 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-95">
                <i class="fas fa-search text-2xl sm:text-3xl mb-1 sm:mb-2"></i>
                <h3 class="font-semibold text-base sm:text-lg">캠페인 찾기</h3>
                <p class="text-xs sm:text-sm opacity-90 mt-1">진행 중인 캠페인 보기</p>
              </button>
              <button onclick="app.showMyApplications()" class="bg-white p-5 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-95">
                <i class="fas fa-clipboard-list text-purple-600 text-2xl sm:text-3xl mb-1 sm:mb-2"></i>
                <h3 class="font-semibold text-base sm:text-lg">내 지원 내역</h3>
                <p class="text-xs sm:text-sm text-gray-600 mt-1">지원 상태 확인</p>
              </button>
              <button onclick="app.showInfluencerProfile()" class="bg-white p-5 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-95">
                <i class="fas fa-user text-purple-600 text-2xl sm:text-3xl mb-1 sm:mb-2"></i>
                <h3 class="font-semibold text-base sm:text-lg">프로필 관리</h3>
                <p class="text-xs sm:text-sm text-gray-600 mt-1">채널 및 정산 정보</p>
              </button>
            </div>

            <div id="influencerContent" class="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-8">
              <p class="text-sm sm:text-base text-gray-600">위 메뉴를 선택해주세요</p>
            </div>
          </div>
        </div>
        
        ${this.renderFooter()}
      </div>
    `;
  }

  async showAvailableCampaigns() {
    try {
      const response = await axios.get('/api/campaigns', this.getAuthHeaders());
      const campaigns = response.data;

      const content = document.getElementById('influencerContent');
      content.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">진행 중인 캠페인</h2>
        ${campaigns.length === 0 ? '<p class="text-gray-600">현재 진행 중인 캠페인이 없습니다</p>' : ''}
        <div class="space-y-4">
          ${campaigns.map(c => `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
              <h3 class="font-bold text-lg mb-2">${c.title}</h3>
              <p class="text-gray-600 mb-3">${c.description || ''}</p>
              
              ${c.product_name ? `<p class="text-sm mb-1"><strong>제품:</strong> ${c.product_name}</p>` : ''}
              ${c.requirements ? `<p class="text-sm mb-3"><strong>요구사항:</strong> ${c.requirements}</p>` : ''}
              
              <div class="flex justify-between items-center text-sm text-gray-500 mb-3">
                <span>예산: ${c.budget ? c.budget.toLocaleString() + '원' : '미정'}</span>
                <span>모집인원: ${c.slots}명</span>
              </div>

              <button onclick="app.applyCampaign(${c.id})" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm">
                <i class="fas fa-paper-plane mr-1"></i>지원하기
              </button>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      alert('캠페인 목록을 불러오는데 실패했습니다');
    }
  }

  showApplyCampaignForm(campaignId) {
    const content = document.getElementById('influencerContent');
    content.innerHTML = `
      <div class="mb-4">
        <button onclick="app.showAvailableCampaigns()" class="text-gray-600 hover:text-gray-800">
          <i class="fas fa-arrow-left mr-2"></i>캠페인 목록으로
        </button>
      </div>
      
      <h2 class="text-2xl font-bold mb-6">캠페인 지원하기</h2>
      <form id="applyCampaignForm" onsubmit="event.preventDefault(); app.handleApplyCampaign(${campaignId});" class="space-y-6">
        
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
          <p class="text-sm text-gray-600 mb-4">상품 배송을 위한 정보를 입력해주세요</p>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">수령인 *</label>
                <input type="text" id="shippingRecipient" required placeholder="받으실 분 성함"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">연락처 *</label>
                <input type="tel" id="shippingPhone" required placeholder="010-1234-5678"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">우편번호 *</label>
              <input type="text" id="shippingZipcode" required placeholder="12345"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">주소 *</label>
              <input type="text" id="shippingAddress" required placeholder="서울시 강남구 테헤란로 123"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
              <input type="text" id="shippingDetail" placeholder="아파트 동/호수, 건물명 등"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>
        </div>

        <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          지원하기
        </button>
      </form>
    `;
  }

  async handleApplyCampaign(campaignId) {
    try {
      const data = {
        message: document.getElementById('applyMessage').value,
        shipping_recipient: document.getElementById('shippingRecipient').value,
        shipping_phone: document.getElementById('shippingPhone').value,
        shipping_zipcode: document.getElementById('shippingZipcode').value,
        shipping_address: document.getElementById('shippingAddress').value,
        shipping_detail: document.getElementById('shippingDetail').value,
      };

      await axios.post(`/api/campaigns/${campaignId}/apply`, data, this.getAuthHeaders());
      alert('캠페인에 지원되었습니다!');
      this.showAvailableCampaigns();
    } catch (error) {
      alert(error.response?.data?.error || '지원에 실패했습니다');
    }
  }

  async applyCampaign(campaignId) {
    // 지원 폼 표시
    this.showApplyCampaignForm(campaignId);
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
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-shield-alt text-purple-600 mr-2"></i>관리자 대시보드
              </h1>
              <p class="text-gray-600 mt-2">${this.user.nickname}님 환영합니다</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button onclick="app.showAllCampaigns()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <i class="fas fa-list text-purple-600 text-3xl mb-2"></i>
                <h3 class="font-semibold">캠페인 관리</h3>
              </button>
              <button onclick="app.showSettlements()" class="bg-purple-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <i class="fas fa-file-excel text-3xl mb-2"></i>
                <h3 class="font-semibold">정산 내역</h3>
              </button>
            </div>

            <div id="adminContent" class="bg-white rounded-lg shadow p-6 mb-8">
              <p class="text-gray-600">위 메뉴를 선택해주세요</p>
            </div>
          </div>
        </div>
        
        ${this.renderFooter()}
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
                  <h3 class="font-bold text-lg">${c.title}</h3>
                  <p class="text-sm text-gray-600">광고주: ${c.advertiser_nickname} (${c.advertiser_email})</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm ${this.getStatusBadge(c.status)}">
                  ${this.getStatusText(c.status)}
                </span>
              </div>

              <p class="text-gray-600 mb-2">${c.description || ''}</p>
              
              <div class="flex space-x-2 mt-3">
                ${c.status === 'pending' ? `
                  <button onclick="app.updateCampaignStatus(${c.id}, 'approved')" 
                    class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
                    승인
                  </button>
                ` : ''}
                ${c.status === 'approved' ? `
                  <button onclick="app.updateCampaignStatus(${c.id}, 'suspended')" 
                    class="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 text-sm">
                    일시중지
                  </button>
                ` : ''}
                ${c.status === 'suspended' ? `
                  <button onclick="app.updateCampaignStatus(${c.id}, 'approved')" 
                    class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
                    재개
                  </button>
                ` : ''}
                <button onclick="app.updateCampaignStatus(${c.id}, 'cancelled')" 
                  class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm">
                  취소
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
            <button onclick="${this.token ? 'app.showDashboard()' : 'app.showHome()'}" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
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
            <button onclick="${this.token ? 'app.showDashboard()' : 'app.showHome()'}" class="text-purple-600 hover:text-purple-800 mb-4 flex items-center">
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
