// UI Utility Functions

const UIUtils = {
  // Status badge helpers
  getStatusBadge(status, campaign = null) {
    // campaign 객체가 있으면 날짜 기반으로 실제 상태 계산
    const actualStatus = campaign ? this.calculateCampaignStatus(campaign) : status;
    
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      recruiting: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[actualStatus] || 'bg-gray-100 text-gray-800';
  },

  // 캠페인의 실제 상태를 날짜 기반으로 계산
  calculateCampaignStatus(campaign) {
    // 관리자가 수동으로 설정한 상태는 그대로 사용
    if (campaign.status === 'pending' || campaign.status === 'suspended' || campaign.status === 'cancelled') {
      return campaign.status;
    }
    
    // 한국 시간(KST, UTC+9) 기준으로 현재 시간 계산
    const nowUTC = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const nowKST = new Date(nowUTC.getTime() + kstOffset);
    
    // 날짜 문자열을 한국 시간 기준으로 파싱하는 함수
    const parseKSTDate = (dateString) => {
      if (!dateString) return null;
      const [year, month, day] = dateString.split('-').map(Number);
      // 한국 시간 00:00:00 기준
      return new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
    };
    
    const applicationEndDate = parseKSTDate(campaign.application_end_date);
    const resultAnnouncementDate = parseKSTDate(campaign.result_announcement_date);
    
    // 날짜 정보가 없으면 기존 상태 사용
    if (!applicationEndDate) {
      return campaign.status;
    }
    
    // 모집종료일 23:59:59까지는 모집중
    const applicationEndDateTime = new Date(applicationEndDate);
    applicationEndDateTime.setUTCHours(14, 59, 59, 999); // KST 23:59:59
    
    if (nowKST <= applicationEndDateTime) {
      return 'recruiting';
    }
    
    // 결과발표일 23:59:59까지 체크
    if (resultAnnouncementDate) {
      const resultAnnouncementDateTime = new Date(resultAnnouncementDate);
      resultAnnouncementDateTime.setUTCHours(14, 59, 59, 999); // KST 23:59:59
      
      if (nowKST > resultAnnouncementDateTime) {
        return 'completed';
      }
    }
    
    // 모집기간은 지났지만 결과발표일 전이면 진행중
    return 'in_progress';
  },

  getStatusText(status, campaign = null) {
    // campaign 객체가 있으면 날짜 기반으로 실제 상태 계산
    const actualStatus = campaign ? this.calculateCampaignStatus(campaign) : status;
    
    const texts = {
      pending: '승인대기',
      recruiting: '모집중',
      in_progress: '진행중',
      suspended: '일시중지',
      completed: '성공종료',
      cancelled: '취소'
    };
    return texts[actualStatus] || actualStatus;
  },

  getApplicationStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  },

  getApplicationStatusText(status) {
    const texts = {
      pending: '대기중',
      approved: '확정',
      rejected: '거절'
    };
    return texts[status] || status;
  },

  // Render common components
  renderNav(user) {
    return `
      <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div class="flex justify-between items-center h-14 sm:h-16">
            <div class="cursor-pointer" onclick="app.showHome()">
              <img src="/static/logo.png" alt="R.SPHERE" class="h-12 sm:h-14">
            </div>
            
            ${user ? `
              <!-- 로그인 시: 검색 아이콘만 -->
              <div class="flex items-center space-x-3 sm:space-x-4">
                <!-- 검색 버튼 -->
                <button onclick="app.toggleSearch()" class="text-gray-600 hover:text-purple-600 text-xl transition">
                  <i class="fas fa-search"></i>
                </button>
                
                <!-- 검색창 (숨김 상태) -->
                <div id="searchBox" class="hidden fixed top-16 left-0 right-0 bg-white shadow-lg p-4 z-40">
                  <div class="max-w-2xl mx-auto relative">
                    <input 
                      type="text" 
                      id="searchInput"
                      placeholder="캠페인 검색..."
                      class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onkeyup="if(event.key === 'Enter') app.searchCampaigns(this.value)"
                    >
                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <button onclick="app.toggleSearch()" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                
                <span class="text-sm sm:text-base text-gray-700 truncate">${user.nickname}</span>
              </div>
            ` : `
              <!-- 비로그인 시: 아무것도 표시 안함 (어차피 클릭하면 로그인) -->
              <div></div>
            `}
          </div>
        </div>
      </nav>
    `;
  },

  // Render bottom navigation (only for logged-in users)
  renderBottomNav(user, currentPage = 'home') {
    if (!user) return '';
    
    // 관리자용 네비게이션
    if (user.role === 'admin') {
      return `
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
          <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-4 h-16">
              <button 
                onclick="app.showAdminDashboard()" 
                class="flex flex-col items-center justify-center space-y-1 transition ${
                  currentPage === 'home' || currentPage === 'dashboard' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }">
                <i class="fas fa-home text-xl"></i>
                <span class="text-xs">홈</span>
              </button>
              
              <button 
                onclick="app.showAdminCampaigns()" 
                class="flex flex-col items-center justify-center space-y-1 transition ${
                  currentPage === 'campaigns' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }">
                <i class="fas fa-bullhorn text-xl"></i>
                <span class="text-xs">캠페인관리</span>
              </button>
              
              <button 
                onclick="app.showAdminSettlements()" 
                class="flex flex-col items-center justify-center space-y-1 transition ${
                  currentPage === 'settlements' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }">
                <i class="fas fa-money-bill-wave text-xl"></i>
                <span class="text-xs">정산관리</span>
              </button>
              
              <button 
                onclick="app.showMyPage()" 
                class="flex flex-col items-center justify-center space-y-1 transition ${
                  currentPage === 'mypage' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }">
                <i class="fas fa-user-circle text-xl"></i>
                <span class="text-xs">마이페이지</span>
              </button>
            </div>
          </div>
        </nav>
        
        <!-- Bottom navigation spacer -->
        <div class="h-16"></div>
      `;
    }
    
    // 광고주/대행사/렙사용 네비게이션
    if (user.role === 'advertiser' || user.role === 'agency' || user.role === 'rep') {
      return `
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
          <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-4 h-16">
              <button 
                onclick="app.showHome()" 
                class="flex flex-col items-center justify-center space-y-1 transition ${
                  currentPage === 'home' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }">
                <i class="fas fa-home text-xl"></i>
                <span class="text-xs">홈</span>
              </button>
              
              <button 
                onclick="app.showAdvertiserCampaigns()" 
                class="flex flex-col items-center justify-center space-y-1 transition ${
                  currentPage === 'campaigns' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }">
                <i class="fas fa-bullhorn text-xl"></i>
                <span class="text-xs">캠페인관리</span>
              </button>
              
              <button 
                onclick="app.showAdvertiserReviews()" 
                class="flex flex-col items-center justify-center space-y-1 transition ${
                  currentPage === 'reviews' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }">
                <i class="fas fa-star text-xl"></i>
                <span class="text-xs">리뷰관리</span>
              </button>
              
              <button 
                onclick="app.showMyPage()" 
                class="flex flex-col items-center justify-center space-y-1 transition ${
                  currentPage === 'mypage' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }">
                <i class="fas fa-user-circle text-xl"></i>
                <span class="text-xs">마이페이지</span>
              </button>
            </div>
          </div>
        </nav>
        
        <!-- Bottom navigation spacer -->
        <div class="h-16"></div>
      `;
    }
    
    // 인플루언서용 네비게이션
    return `
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-4 h-16">
            <button 
              onclick="app.showHome()" 
              class="flex flex-col items-center justify-center space-y-1 transition ${
                currentPage === 'home' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }">
              <i class="fas fa-home text-xl"></i>
              <span class="text-xs">홈</span>
            </button>
            
            <button 
              onclick="app.showBestCampaigns()" 
              class="flex flex-col items-center justify-center space-y-1 transition ${
                currentPage === 'best' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }">
              <i class="fas fa-crown text-xl"></i>
              <span class="text-xs">베스트캠페인</span>
            </button>
            
            <button 
              onclick="app.showBestReviews()" 
              class="flex flex-col items-center justify-center space-y-1 transition ${
                currentPage === 'reviews' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }">
              <i class="fas fa-star text-xl"></i>
              <span class="text-xs">베스트리뷰</span>
            </button>
            
            <button 
              onclick="app.showMyPage()" 
              class="flex flex-col items-center justify-center space-y-1 transition ${
                currentPage === 'mypage' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }">
              <i class="fas fa-user-circle text-xl"></i>
              <span class="text-xs">마이페이지</span>
            </button>
          </div>
        </div>
      </nav>
      
      <!-- Bottom navigation spacer -->
      <div class="h-16"></div>
    `;
  },

  renderFooter() {
    return `
      <footer class="bg-gray-800 text-gray-300 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 class="text-white text-sm font-semibold mb-2">
                <i class="fas fa-star mr-1"></i>R.SPHERE (리뷰스피어)
              </h3>
              <p class="text-xs mb-1">인플루언서 마케팅의 새로운 기준</p>
              <p class="text-xs">
                <i class="fas fa-envelope mr-1"></i>
                <a href="mailto:mobin_info@mobin-inc.com" class="hover:text-white">mobin_info@mobin-inc.com</a>
              </p>
            </div>
            
            <div>
              <h4 class="text-white text-sm font-semibold mb-2">운영사 정보</h4>
              <p class="text-xs mb-1"><strong>(주)모빈</strong> | 대표이사 이규한 | 개인정보 관리책임자 안중경</p>
              <p class="text-xs">서울시 구로구 디지털로31길 12, 본관 2층 넥스트데이 2호 (구로동, 티피타워)</p>
            </div>
          </div>
          
          <div class="border-t border-gray-700 pt-3">
            <div class="flex justify-center space-x-4 mb-2 text-xs">
              <a href="#" onclick="app.showTerms(); return false;" class="hover:text-white underline">이용약관</a>
              <a href="#" onclick="app.showPrivacy(); return false;" class="hover:text-white underline">개인정보처리방침</a>
            </div>
            <p class="text-center text-xs">© 2025 리뷰스피어. All rights reserved. Operated by <strong>(주)모빈</strong></p>
          </div>
        </div>
      </footer>
    `;
  },

  // CSV download helper
  downloadCSV(data, filename) {
    if (!data || data.length === 0) {
      alert('다운로드할 데이터가 없습니다');
      return;
    }

    const headers = ['캠페인', '인플루언서', '이메일', '예산', '은행', '계좌번호', '예금주', '연락처', '사업자번호', '포스트URL', '제출일'];
    const rows = data.map(s => [
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

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `settlements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  },

  // 사업자등록번호 자동 하이픈 (XXX-XX-XXXXX)
  formatBusinessNumber(value) {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  },

  // 전화번호 자동 하이픈 (XXX-XXXX-XXXX 또는 XX-XXXX-XXXX)
  formatPhoneNumber(value) {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    if (numbers.startsWith('02')) {
      // 서울 지역번호 (02-XXXX-XXXX)
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
    // 일반 (XXX-XXXX-XXXX)
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};
