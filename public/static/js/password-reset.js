// 비밀번호 재설정 UI

class PasswordResetManager {
  constructor() {
    this.currentStep = 1; // 1: 이메일 입력, 2: 인증번호 입력, 3: 새 비밀번호 입력
    this.email = '';
    this.token = '';
  }

  // 비밀번호 재설정 모달 표시
  showPasswordResetModal() {
    this.currentStep = 1;
    this.email = '';
    this.token = '';
    
    const modal = document.getElementById('password-reset-modal');
    if (modal) {
      modal.remove();
    }

    const modalHTML = `
      <div id="password-reset-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">비밀번호 재설정</h2>
            <button onclick="passwordResetManager.closeModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div id="reset-step-1" class="reset-step">
            <p class="text-gray-600 mb-4">가입하신 이메일 주소를 입력해주세요. 인증번호를 보내드립니다.</p>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input type="email" id="reset-email" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="your@email.com">
            </div>
            <button onclick="passwordResetManager.requestReset()" 
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
              인증번호 받기
            </button>
          </div>

          <div id="reset-step-2" class="reset-step hidden">
            <p class="text-gray-600 mb-4">이메일로 전송된 6자리 인증번호를 입력해주세요.</p>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">인증번호</label>
              <input type="text" id="reset-token" maxlength="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000">
            </div>
            <button onclick="passwordResetManager.verifyToken()" 
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition mb-2">
              인증하기
            </button>
            <button onclick="passwordResetManager.goToStep(1)" 
              class="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-sm">
              이메일 다시 입력
            </button>
          </div>

          <div id="reset-step-3" class="reset-step hidden">
            <p class="text-gray-600 mb-4">새로운 비밀번호를 입력해주세요.</p>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
              <input type="password" id="new-password"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="최소 6자 이상">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
              <input type="password" id="confirm-password"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="비밀번호를 다시 입력해주세요">
            </div>
            <button onclick="passwordResetManager.changePassword()" 
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
              비밀번호 변경
            </button>
          </div>

          <div id="reset-message" class="mt-4 hidden">
            <div class="p-4 rounded-lg"></div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // 단계 이동
  goToStep(step) {
    this.currentStep = step;
    
    // 모든 단계 숨기기
    document.querySelectorAll('.reset-step').forEach(el => el.classList.add('hidden'));
    
    // 현재 단계 보이기
    const currentStepEl = document.getElementById(`reset-step-${step}`);
    if (currentStepEl) {
      currentStepEl.classList.remove('hidden');
    }
  }

  // 메시지 표시
  showMessage(message, type = 'info') {
    const messageEl = document.getElementById('reset-message');
    const messageContent = messageEl.querySelector('div');
    
    messageContent.className = `p-4 rounded-lg ${
      type === 'success' ? 'bg-green-100 text-green-700' :
      type === 'error' ? 'bg-red-100 text-red-700' :
      'bg-blue-100 text-blue-700'
    }`;
    messageContent.textContent = message;
    
    messageEl.classList.remove('hidden');
    
    // 5초 후 자동 숨김
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 5000);
  }

  // 1단계: 비밀번호 재설정 요청
  async requestReset() {
    const email = document.getElementById('reset-email').value.trim();
    
    if (!email) {
      this.showMessage('이메일을 입력해주세요', 'error');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showMessage('올바른 이메일 형식을 입력해주세요', 'error');
      return;
    }

    try {
      const response = await axios.post('/api/password-reset/request', { email });
      
      if (response.data.success) {
        this.email = email;
        this.showMessage(response.data.message, 'success');
        
        // 2초 후 다음 단계로
        setTimeout(() => {
          this.goToStep(2);
        }, 2000);
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      this.showMessage(error.response?.data?.error || '오류가 발생했습니다', 'error');
    }
  }

  // 2단계: 토큰 검증
  async verifyToken() {
    const token = document.getElementById('reset-token').value.trim();
    
    if (!token || token.length !== 6) {
      this.showMessage('6자리 인증번호를 입력해주세요', 'error');
      return;
    }

    try {
      const response = await axios.post('/api/password-reset/verify', {
        email: this.email,
        token: token
      });
      
      if (response.data.success) {
        this.token = token;
        this.showMessage(response.data.message, 'success');
        
        // 1초 후 다음 단계로
        setTimeout(() => {
          this.goToStep(3);
        }, 1000);
      }
    } catch (error) {
      console.error('Token verify error:', error);
      this.showMessage(error.response?.data?.error || '인증번호가 올바르지 않습니다', 'error');
    }
  }

  // 3단계: 비밀번호 변경
  async changePassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!newPassword || !confirmPassword) {
      this.showMessage('모든 필드를 입력해주세요', 'error');
      return;
    }

    if (newPassword.length < 6) {
      this.showMessage('비밀번호는 최소 6자 이상이어야 합니다', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showMessage('비밀번호가 일치하지 않습니다', 'error');
      return;
    }

    try {
      const response = await axios.post('/api/password-reset/change', {
        email: this.email,
        token: this.token,
        newPassword: newPassword
      });
      
      if (response.data.success) {
        this.showMessage(response.data.message, 'success');
        
        // 2초 후 모달 닫고 로그인 페이지로
        setTimeout(() => {
          this.closeModal();
          alert('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.');
          window.location.hash = '#login';
        }, 2000);
      }
    } catch (error) {
      console.error('Password change error:', error);
      this.showMessage(error.response?.data?.error || '비밀번호 변경에 실패했습니다', 'error');
    }
  }

  // 모달 닫기
  closeModal() {
    const modal = document.getElementById('password-reset-modal');
    if (modal) {
      modal.remove();
    }
  }
}

// 전역 인스턴스 생성
const passwordResetManager = new PasswordResetManager();
