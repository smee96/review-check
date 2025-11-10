// M-Spheres Frontend Application

class MSpheres {
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
      const response = await axios.post('/api/auth/register', {
        email,
        nickname,
        password,
        role
      });
      
      alert(response.data.message || '회원가입이 완료되었습니다!');
      this.showLogin();
    } catch (error) {
      alert(error.response?.data?.error || '회원가입에 실패했습니다');
    }
  }

  async login(email, password) {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
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

  showHome() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500">
        <nav class="bg-white shadow-lg">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center">
                <h1 class="text-2xl font-bold text-purple-600">
                  <i class="fas fa-globe mr-2"></i>M-Spheres
                </h1>
              </div>
              <div class="flex space-x-4">
                <button onclick="app.showLogin()" class="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                  로그인
                </button>
                <button onclick="app.showRegister()" class="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium">
                  회원가입
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div class="text-center text-white">
            <h2 class="text-5xl font-extrabold mb-6">
              인플루언서 마케팅의 새로운 기준
            </h2>
            <p class="text-xl mb-12 text-purple-100">
              M-Spheres와 함께 성공적인 캠페인을 시작하세요
            </p>
            
            <div class="grid md:grid-cols-2 gap-8 mt-16">
              <div class="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 hover:bg-opacity-20 transition">
                <i class="fas fa-bullhorn text-6xl mb-4"></i>
                <h3 class="text-2xl font-bold mb-4">광고주</h3>
                <p class="mb-6">캠페인을 등록하고 최적의 인플루언서를 만나보세요</p>
                <button onclick="app.showRegisterWithRole('advertiser')" class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-100 transition">
                  광고주로 시작하기
                </button>
              </div>
              
              <div class="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 hover:bg-opacity-20 transition">
                <i class="fas fa-star text-6xl mb-4"></i>
                <h3 class="text-2xl font-bold mb-4">인플루언서</h3>
                <p class="mb-6">다양한 캠페인에 참여하고 수익을 창출하세요</p>
                <button onclick="app.showRegisterWithRole('influencer')" class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-100 transition">
                  인플루언서로 시작하기
                </button>
              </div>
            </div>

            <div class="mt-16 text-sm text-purple-100">
              <p>문의사항: <a href="mailto:checknreview@mobin-inc.com" class="underline hover:text-white">checknreview@mobin-inc.com</a></p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center px-4">
        <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-globe text-purple-600 mr-2"></i>M-Spheres
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
    `;
  }

  showRegister(preselectedRole = null) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center px-4 py-8">
        <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-globe text-purple-600 mr-2"></i>M-Spheres
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
                <label class="block text-sm font-medium text-gray-700 mb-2">역할</label>
                <select id="registerRole" required ${preselectedRole ? 'disabled' : ''}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                  <option value="">선택하세요</option>
                  <option value="advertiser" ${preselectedRole === 'advertiser' ? 'selected' : ''}>광고주</option>
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
    `;
  }

  showRegisterWithRole(role) {
    this.showRegister(role);
  }

  showForgotPassword() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center px-4">
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
    `;
  }

  showDashboard() {
    switch (this.user.role) {
      case 'advertiser':
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
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${this.renderNav()}
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-bullhorn text-purple-600 mr-2"></i>광고주 대시보드
            </h1>
            <p class="text-gray-600 mt-2">${this.user.nickname}님 환영합니다</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button onclick="app.showMyCampaigns()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <i class="fas fa-list text-purple-600 text-3xl mb-2"></i>
              <h3 class="font-semibold">내 캠페인</h3>
            </button>
            <button onclick="app.showCreateCampaign()" class="bg-purple-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <i class="fas fa-plus-circle text-3xl mb-2"></i>
              <h3 class="font-semibold">캠페인 등록</h3>
            </button>
            <button onclick="app.showAdvertiserProfile()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <i class="fas fa-user text-purple-600 text-3xl mb-2"></i>
              <h3 class="font-semibold">프로필 관리</h3>
            </button>
          </div>

          <div id="advertiserContent" class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600">위 메뉴를 선택해주세요</p>
          </div>
        </div>
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
              <div class="flex justify-between items-center text-sm text-gray-500">
                <span>예산: ${c.budget ? c.budget.toLocaleString() + '원' : '미정'}</span>
                <span>모집인원: ${c.slots}명</span>
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
      <form id="createCampaignForm" onsubmit="event.preventDefault(); app.handleCreateCampaign();" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 제목 *</label>
          <input type="text" id="campaignTitle" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">캠페인 설명</label>
          <textarea id="campaignDescription" rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">제품명</label>
            <input type="text" id="campaignProductName"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">제품 URL</label>
            <input type="url" id="campaignProductUrl"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">요구사항</label>
          <textarea id="campaignRequirements" rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">예산 (원)</label>
            <input type="number" id="campaignBudget"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">모집인원</label>
            <input type="number" id="campaignSlots" value="1" min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">시작일</label>
            <input type="date" id="campaignStartDate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">종료일</label>
            <input type="date" id="campaignEndDate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
          </div>
        </div>

        <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          캠페인 등록
        </button>
        
        <p class="text-sm text-gray-600 text-center">* 관리자 승인 후 활성화됩니다</p>
      </form>
    `;
  }

  async handleCreateCampaign() {
    try {
      const data = {
        title: document.getElementById('campaignTitle').value,
        description: document.getElementById('campaignDescription').value,
        product_name: document.getElementById('campaignProductName').value,
        product_url: document.getElementById('campaignProductUrl').value,
        requirements: document.getElementById('campaignRequirements').value,
        budget: document.getElementById('campaignBudget').value || null,
        slots: document.getElementById('campaignSlots').value || 1,
        start_date: document.getElementById('campaignStartDate').value || null,
        end_date: document.getElementById('campaignEndDate').value || null,
      };

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
      <div class="min-h-screen bg-gray-50">
        ${this.renderNav()}
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-star text-purple-600 mr-2"></i>인플루언서 대시보드
            </h1>
            <p class="text-gray-600 mt-2">${this.user.nickname}님 환영합니다</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button onclick="app.showAvailableCampaigns()" class="bg-purple-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <i class="fas fa-search text-3xl mb-2"></i>
              <h3 class="font-semibold">캠페인 찾기</h3>
            </button>
            <button onclick="app.showMyApplications()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <i class="fas fa-clipboard-list text-purple-600 text-3xl mb-2"></i>
              <h3 class="font-semibold">내 지원 내역</h3>
            </button>
            <button onclick="app.showInfluencerProfile()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <i class="fas fa-user text-purple-600 text-3xl mb-2"></i>
              <h3 class="font-semibold">프로필 관리</h3>
            </button>
          </div>

          <div id="influencerContent" class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600">위 메뉴를 선택해주세요</p>
          </div>
        </div>
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

  async applyCampaign(campaignId) {
    const message = prompt('지원 메시지를 입력하세요 (선택사항):');
    
    try {
      await axios.post(`/api/campaigns/${campaignId}/apply`, { message }, this.getAuthHeaders());
      alert('캠페인에 지원되었습니다!');
      this.showAvailableCampaigns();
    } catch (error) {
      alert(error.response?.data?.error || '지원에 실패했습니다');
    }
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
        <form id="influencerProfileForm" onsubmit="event.preventDefault(); app.handleUpdateInfluencerProfile();" class="space-y-4">
          <h3 class="font-semibold text-lg">채널 정보</h3>
          
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

          <hr class="my-6">
          <h3 class="font-semibold text-lg">정산 정보</h3>

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

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">사업자등록번호 (선택)</label>
              <input type="text" id="businessNumber" value="${profile.business_number || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">연락처</label>
              <input type="tel" id="contactPhone" value="${profile.contact_phone || ''}"
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

  async handleUpdateInfluencerProfile() {
    try {
      const data = {
        instagram_handle: document.getElementById('instagramHandle').value,
        youtube_channel: document.getElementById('youtubeChannel').value,
        blog_url: document.getElementById('blogUrl').value,
        tiktok_handle: document.getElementById('tiktokHandle').value,
        follower_count: document.getElementById('followerCount').value || 0,
        category: document.getElementById('category').value,
        account_holder_name: document.getElementById('accountHolderName').value,
        bank_name: document.getElementById('bankName').value,
        account_number: document.getElementById('accountNumber').value,
        business_number: document.getElementById('businessNumber').value,
        contact_phone: document.getElementById('contactPhone').value,
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
      <div class="min-h-screen bg-gray-50">
        ${this.renderNav()}
        
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

          <div id="adminContent" class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-600">위 메뉴를 선택해주세요</p>
          </div>
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
    return `
      <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <h1 class="text-2xl font-bold text-purple-600 cursor-pointer" onclick="app.showDashboard()">
              <i class="fas fa-globe mr-2"></i>M-Spheres
            </h1>
            <div class="flex items-center space-x-4">
              <span class="text-gray-700">${this.user.nickname}</span>
              <button onclick="app.logout()" class="text-red-600 hover:text-red-700">
                <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>
    `;
  }

  getStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status) {
    const texts = {
      pending: '승인대기',
      approved: '진행중',
      suspended: '일시중지',
      completed: '완료',
      cancelled: '취소'
    };
    return texts[status] || status;
  }

  getApplicationStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  getApplicationStatusText(status) {
    const texts = {
      pending: '대기중',
      approved: '확정',
      rejected: '거절'
    };
    return texts[status] || status;
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
    const role = document.getElementById('registerRoleHidden')?.value || document.getElementById('registerRole').value;
    this.register(email, nickname, password, role);
  }

  handleForgotPassword() {
    const email = document.getElementById('forgotEmail').value;
    this.forgotPassword(email);
  }
}

// Initialize app
const app = new MSpheres();
