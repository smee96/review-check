// 출금 신청 UI 관련 함수들
// Withdrawal Request UI Functions

class WithdrawalUI {
  constructor(app) {
    this.app = app;
    this.idCardImage = null;
    this.bankbookImage = null;
  }

  // 파일을 Base64로 변환
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 이미지 파일 검증
  validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      alert('JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.');
      return false;
    }

    if (file.size > maxSize) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return false;
    }

    return true;
  }

  // 출금 신청 모달 표시
  async showWithdrawalRequest() {
    try {
      const response = await axios.get('/api/profile/influencer', this.app.getAuthHeaders());
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

      const contactPhone = profile.contact_phone || '';
      const realName = profile.real_name || profile.account_holder_name || '';

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-2xl font-bold mb-4 flex items-center">
            <i class="fas fa-money-bill-wave mr-2 text-purple-600"></i>
            포인트 출금 신청
          </h2>
          
          <div class="space-y-4">
            <!-- 보유 포인트 -->
            <div class="bg-purple-50 p-4 rounded-lg">
              <p class="text-sm text-gray-700 mb-1">보유 포인트</p>
              <p class="text-2xl font-bold text-purple-600">${pointsBalance.toLocaleString()} P</p>
            </div>

            <!-- 출금 금액 -->
            <div>
              <label class="block text-sm font-medium mb-2">출금 금액 (포인트)</label>
              <input type="text" id="withdrawalAmountDisplay" class="w-full px-4 py-2 border rounded-lg" 
                placeholder="10,000P 단위로 입력 (예: 10,000)">
              <input type="hidden" id="withdrawalAmount" value="">
              <p class="text-xs text-gray-600 mt-1">* 최소 출금 금액: 10,000P (10,000P 단위)</p>
            </div>

            <!-- 세금 정보 -->
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

            <!-- 계좌 정보 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm font-semibold mb-2">입금 계좌 정보</p>
              <div class="text-sm space-y-1">
                <div><span class="text-gray-600">은행:</span> ${profile.bank_name}</div>
                <div><span class="text-gray-600">계좌번호:</span> ${profile.account_number}</div>
                <div><span class="text-gray-600">예금주:</span> ${profile.account_holder_name}</div>
              </div>
              <p class="text-xs text-gray-600 mt-2">* 계좌 정보가 틀린 경우 프로필에서 수정해주세요</p>
            </div>

            <!-- 개인정보 입력 -->
            <div class="border-t pt-4">
              <h3 class="text-lg font-semibold mb-3 flex items-center">
                <i class="fas fa-id-card mr-2 text-blue-600"></i>
                세금 신고를 위한 정보 (필수)
              </h3>
              
              <div class="space-y-3">
                <!-- 실명 -->
                <div>
                  <label class="block text-sm font-medium mb-2">
                    실명 (신분증 기준) <span class="text-red-600">*</span>
                  </label>
                  <input type="text" id="realName" value="${realName}" 
                    class="w-full px-4 py-2 border rounded-lg" 
                    placeholder="홍길동">
                </div>

                <!-- 주민등록번호 앞 6자리 -->
                <div>
                  <label class="block text-sm font-medium mb-2">
                    주민등록번호 앞 6자리 (생년월일) <span class="text-red-600">*</span>
                  </label>
                  <input type="text" id="residentNumber" maxlength="6" 
                    class="w-full px-4 py-2 border rounded-lg" 
                    placeholder="951231">
                  <p class="text-xs text-gray-600 mt-1">* 세금 신고용으로 필요합니다 (예: 951231)</p>
                </div>

                <!-- 연락처 -->
                <div>
                  <label class="block text-sm font-medium mb-2">
                    연락처 <span class="text-red-600">*</span>
                  </label>
                  <input type="tel" id="withdrawalPhone" value="${contactPhone}" 
                    class="w-full px-4 py-2 border rounded-lg" 
                    placeholder="010-0000-0000">
                  <p class="text-xs text-gray-600 mt-1">* 출금 관련 연락을 위해 필요합니다</p>
                </div>
              </div>
            </div>

            <!-- 서류 업로드 -->
            <div class="border-t pt-4">
              <h3 class="text-lg font-semibold mb-3 flex items-center">
                <i class="fas fa-file-upload mr-2 text-green-600"></i>
                필수 서류 업로드
              </h3>
              
              <div class="space-y-3">
                <!-- 신분증 -->
                <div>
                  <label class="block text-sm font-medium mb-2">
                    신분증 사본 <span class="text-red-600">*</span>
                  </label>
                  <div class="flex items-center gap-2">
                    <input type="file" id="idCardFile" accept="image/*" 
                      class="flex-1 px-3 py-2 border rounded-lg text-sm">
                    <button type="button" onclick="document.getElementById('idCardFile').click()" 
                      class="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                      선택
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">
                    * 주민등록증, 운전면허증, 여권 중 택1 (5MB 이하, JPG/PNG)
                  </p>
                  <div id="idCardPreview" class="mt-2 hidden">
                    <img src="" alt="신분증 미리보기" class="max-w-xs rounded border">
                  </div>
                </div>

                <!-- 통장 사본 -->
                <div>
                  <label class="block text-sm font-medium mb-2">
                    통장 사본 <span class="text-red-600">*</span>
                  </label>
                  <div class="flex items-center gap-2">
                    <input type="file" id="bankbookFile" accept="image/*" 
                      class="flex-1 px-3 py-2 border rounded-lg text-sm">
                    <button type="button" onclick="document.getElementById('bankbookFile').click()" 
                      class="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                      선택
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">
                    * 계좌번호와 예금주가 확인 가능한 페이지 (5MB 이하, JPG/PNG)
                  </p>
                  <div id="bankbookPreview" class="mt-2 hidden">
                    <img src="" alt="통장 미리보기" class="max-w-xs rounded border">
                  </div>
                </div>
              </div>
            </div>

            <!-- 개인정보 수집 동의 -->
            <div class="border-t pt-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <label class="flex items-start cursor-pointer">
                  <input type="checkbox" id="privacyConsent" class="mt-1 mr-3">
                  <div class="text-sm">
                    <p class="font-semibold mb-2">개인정보 수집 및 이용 동의 (필수)</p>
                    <div class="text-xs text-gray-700 space-y-1">
                      <p>• 수집 항목: 실명, 주민등록번호 앞 6자리, 연락처, 신분증 사본, 통장 사본</p>
                      <p>• 수집 목적: 세금 신고 (지급명세서 제출), 본인 확인, 출금 처리</p>
                      <p>• 보유 기간: 세법에 따라 5년간 보관 후 파기</p>
                      <p>• 거부 권리: 동의를 거부할 수 있으나, 출금 신청이 불가능합니다</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- 주의사항 -->
            <div class="bg-red-50 p-4 rounded-lg text-sm">
              <p class="font-semibold text-red-800 mb-2">⚠️ 주의사항</p>
              <ul class="text-red-700 space-y-1 text-xs list-disc pl-5">
                <li>연간 출금 금액이 500만원을 초과하는 경우, 다음 연도 5월에 종합소득세 신고 의무가 있습니다.</li>
                <li>출금 시 22%의 세금(소득세 20% + 지방소득세 2%)이 원천징수됩니다.</li>
                <li>타인 명의 계좌로는 출금이 불가능하며, 반드시 본인 명의 계좌여야 합니다.</li>
                <li>허위 정보 제공 시 출금이 거부되며, 법적 책임을 질 수 있습니다.</li>
              </ul>
            </div>

            <!-- 버튼 -->
            <div class="flex gap-2 pt-4">
              <button onclick="this.closest('.fixed').remove()" 
                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                취소
              </button>
              <button id="submitWithdrawalBtn" 
                class="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                출금 신청하기
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // 이벤트 리스너 설정
      this.setupEventListeners();

    } catch (error) {
      console.error('Show withdrawal request error:', error);
      alert('출금 신청을 불러오는데 실패했습니다');
    }
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 금액 입력 시 세금 계산
    const displayInput = document.getElementById('withdrawalAmountDisplay');
    const hiddenInput = document.getElementById('withdrawalAmount');
    
    displayInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^\d]/g, '');
      const numValue = parseInt(value) || 0;
      
      hiddenInput.value = numValue;
      
      if (value) {
        e.target.value = numValue.toLocaleString();
      } else {
        e.target.value = '';
      }
      
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

    // 신분증 업로드
    const idCardFile = document.getElementById('idCardFile');
    idCardFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file && this.validateImageFile(file)) {
        this.idCardImage = await this.fileToBase64(file);
        const preview = document.getElementById('idCardPreview');
        preview.querySelector('img').src = this.idCardImage;
        preview.classList.remove('hidden');
      }
    });

    // 통장 사본 업로드
    const bankbookFile = document.getElementById('bankbookFile');
    bankbookFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file && this.validateImageFile(file)) {
        this.bankbookImage = await this.fileToBase64(file);
        const preview = document.getElementById('bankbookPreview');
        preview.querySelector('img').src = this.bankbookImage;
        preview.classList.remove('hidden');
      }
    });

    // 출금 신청 버튼
    document.getElementById('submitWithdrawalBtn').addEventListener('click', () => {
      this.submitWithdrawal();
    });
  }

  // 출금 신청 제출
  async submitWithdrawal() {
    const amount = parseInt(document.getElementById('withdrawalAmount').value);
    const phone = document.getElementById('withdrawalPhone').value.trim();
    const realName = document.getElementById('realName').value.trim();
    const residentNumber = document.getElementById('residentNumber').value.trim();
    const privacyConsent = document.getElementById('privacyConsent').checked;

    // 유효성 검증
    if (!amount || amount < 10000) {
      alert('최소 출금 금액은 10,000P입니다');
      return;
    }

    if (amount % 10000 !== 0) {
      alert('출금 금액은 10,000P 단위로 입력해주세요');
      return;
    }

    if (!realName) {
      alert('실명을 입력해주세요');
      return;
    }

    if (!residentNumber || residentNumber.length !== 6 || !/^\d{6}$/.test(residentNumber)) {
      alert('주민등록번호 앞 6자리를 정확히 입력해주세요 (예: 951231)');
      return;
    }

    if (!phone) {
      alert('연락처를 입력해주세요');
      return;
    }

    if (!this.idCardImage) {
      alert('신분증 사본을 업로드해주세요');
      return;
    }

    if (!this.bankbookImage) {
      alert('통장 사본을 업로드해주세요');
      return;
    }

    if (!privacyConsent) {
      alert('개인정보 수집 및 이용에 동의해주세요');
      return;
    }

    try {
      const profile = await axios.get('/api/profile/influencer', this.app.getAuthHeaders());
      const profileData = profile.data;

      const response = await axios.post('/api/withdrawal/request', {
        amount,
        bank_name: profileData.bank_name,
        account_number: profileData.account_number,
        account_holder: profileData.account_holder_name,
        contact_phone: phone,
        real_name: realName,
        resident_number_partial: residentNumber,
        id_card_image: this.idCardImage,
        bankbook_image: this.bankbookImage
      }, this.app.getAuthHeaders());

      if (response.data.success) {
        alert('출금 신청이 완료되었습니다.\n관리자 검토 후 처리됩니다.');
        
        // 모달 닫기
        const modalElement = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
        if (modalElement) {
          modalElement.remove();
        }
        
        // 인플루언서 대시보드 새로고침
        if (this.app.showInfluencerDashboard) {
          this.app.showInfluencerDashboard();
        }
      }
    } catch (error) {
      console.error('Withdrawal submission error:', error);
      alert(error.response?.data?.error || '출금 신청 중 오류가 발생했습니다');
    }
  }
}

// 전역에서 사용할 수 있도록 export
window.WithdrawalUI = WithdrawalUI;
