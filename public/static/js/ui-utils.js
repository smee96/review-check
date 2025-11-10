// UI Utility Functions

const UIUtils = {
  // Status badge helpers
  getStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  },

  getStatusText(status) {
    const texts = {
      pending: '승인대기',
      approved: '진행중',
      suspended: '일시중지',
      completed: '완료',
      cancelled: '취소'
    };
    return texts[status] || status;
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
            <div class="cursor-pointer" onclick="app.showDashboard()">
              <img src="/static/logo.png" alt="R.SPHERE" class="h-32 sm:h-36">
            </div>
            <div class="flex items-center space-x-2 sm:space-x-4">
              <span class="text-sm sm:text-base text-gray-700 max-w-[100px] sm:max-w-none truncate">${user.nickname}</span>
              <button onclick="app.logout()" class="text-red-600 hover:text-red-700 text-sm sm:text-base">
                <i class="fas fa-sign-out-alt sm:mr-1"></i><span class="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
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
  }
};
