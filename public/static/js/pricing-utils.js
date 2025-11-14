// Pricing Utilities Module
// 과금 계산 관련 유틸리티 함수

const PricingUtils = {
  // 시스템 설정 캐시 (API 호출 최소화)
  _settingsCache: null,
  _cacheTime: null,
  _CACHE_DURATION: 60000, // 1분

  // 시스템 설정 조회 (캐시 사용)
  async getSystemSettings() {
    const now = Date.now();
    if (this._settingsCache && this._cacheTime && (now - this._cacheTime) < this._CACHE_DURATION) {
      return this._settingsCache;
    }

    try {
      const response = await axios.get('/api/admin/settings', app.getAuthHeaders());
      const settings = response.data;
      
      // 객체로 변환
      const settingsObj = {};
      settings.forEach(s => {
        settingsObj[s.setting_key] = Number(s.setting_value);
      });
      
      this._settingsCache = settingsObj;
      this._cacheTime = now;
      
      return settingsObj;
    } catch (error) {
      console.error('Get system settings error:', error);
      // 기본값 반환
      return {
        fee_rate_product_only: 20,
        fee_rate_voucher_only: 20,
        fee_rate_with_points: 28,
        min_fee_product: 2000,
        min_fee_voucher: 3000
      };
    }
  },

  // 수수료율 조회
  async getFeeRate(pricingType) {
    const settings = await this.getSystemSettings();
    
    switch(pricingType) {
      case 'product_only':
        return settings.fee_rate_product_only || 20;
      case 'voucher_only':
        return settings.fee_rate_voucher_only || 20;
      case 'product_with_points':
      case 'voucher_with_points':
        return settings.fee_rate_with_points || 28;
      default:
        return 20;
    }
  },

  // 최소 수수료 조회
  async getMinFee(pricingType) {
    const settings = await this.getSystemSettings();
    
    switch(pricingType) {
      case 'product_only':
      case 'product_with_points':
        return settings.min_fee_product || 2000;
      case 'voucher_only':
      case 'voucher_with_points':
        return settings.min_fee_voucher || 3000;
      default:
        return 2000;
    }
  },

  // 플랫폼 수수료 계산
  async calculatePlatformFee(pricingType, productValue, spherePoints = 0) {
    const feeRate = await this.getFeeRate(pricingType);
    const minFee = await this.getMinFee(pricingType);
    
    let totalValue;
    if (pricingType === 'product_with_points' || pricingType === 'voucher_with_points') {
      totalValue = productValue + spherePoints;
    } else {
      totalValue = productValue;
    }
    
    const calculatedFee = Math.floor(totalValue * (feeRate / 100));
    return Math.max(calculatedFee, minFee);
  },

  // 전체 과금 정보 계산
  async calculateFullPricing(pricingType, productValue, spherePoints = 0) {
    const platformFee = await this.calculatePlatformFee(pricingType, productValue, spherePoints);
    const feeRate = await this.getFeeRate(pricingType);
    
    let totalValue;
    if (pricingType === 'product_with_points' || pricingType === 'voucher_with_points') {
      totalValue = productValue + spherePoints;
    } else {
      totalValue = productValue;
    }
    
    const totalCost = productValue + spherePoints + platformFee;
    
    return {
      pricing_type: pricingType,
      product_value: productValue,
      sphere_points: spherePoints,
      total_value: totalValue,
      platform_fee: platformFee,
      platform_fee_rate: feeRate,
      total_cost: totalCost,
      influencer_gets: {
        product_or_voucher: productValue,
        points: spherePoints
      }
    };
  },

  // 과금 타입별 한글 이름
  getPricingTypeName(pricingType) {
    const names = {
      'product_only': '상품만 제공',
      'voucher_only': '이용권만 제공',
      'product_with_points': '상품 + 스피어포인트',
      'voucher_with_points': '이용권 + 스피어포인트'
    };
    return names[pricingType] || pricingType;
  },

  // 과금 타입별 설명
  getPricingTypeDescription(pricingType) {
    const descriptions = {
      'product_only': '리뷰어에게 상품만 제공합니다. 고가 상품(2만원 이상) 추천',
      'voucher_only': '리뷰어에게 이용권만 제공합니다. 서비스업(3만원 이상) 추천',
      'product_with_points': '리뷰어에게 상품과 현금화 가능한 스피어포인트를 제공합니다. 확실한 모집에 유리',
      'voucher_with_points': '리뷰어에게 이용권과 현금화 가능한 스피어포인트를 제공합니다. 확실한 모집에 유리'
    };
    return descriptions[pricingType] || '';
  },

  // 숫자를 천단위 콤마 형식으로 변환
  formatNumber(num) {
    return num.toLocaleString('ko-KR');
  },

  // 과금 정보 요약 HTML 생성
  async renderPricingSummary(pricingType, productValue, spherePoints = 0) {
    if (!pricingType || !productValue || productValue <= 0) {
      return '';
    }

    const pricing = await this.calculateFullPricing(pricingType, productValue, spherePoints);
    
    return `
      <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 class="font-bold text-blue-800 mb-2">
          <i class="fas fa-calculator mr-2"></i>과금 정보 요약
        </h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-700">과금 방식:</span>
            <span class="font-semibold">${this.getPricingTypeName(pricing.pricing_type)}</span>
          </div>
          ${pricing.product_value > 0 ? `
            <div class="flex justify-between">
              <span class="text-gray-700">상품/이용권 가치:</span>
              <span class="font-semibold">${this.formatNumber(pricing.product_value)}원</span>
            </div>
          ` : ''}
          ${pricing.sphere_points > 0 ? `
            <div class="flex justify-between">
              <span class="text-gray-700">스피어포인트:</span>
              <span class="font-semibold text-purple-600">${this.formatNumber(pricing.sphere_points)}P</span>
            </div>
          ` : ''}
          <div class="flex justify-between border-t pt-2">
            <span class="text-gray-700">플랫폼 수수료 (${pricing.platform_fee_rate}%):</span>
            <span class="font-semibold text-red-600">${this.formatNumber(pricing.platform_fee)}원</span>
          </div>
          <div class="flex justify-between border-t pt-2">
            <span class="text-gray-800 font-bold">광고주 총 지출:</span>
            <span class="font-bold text-lg text-blue-600">${this.formatNumber(pricing.total_cost)}원</span>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t text-xs text-gray-600">
          <div><strong>리뷰어 1명당 혜택:</strong></div>
          <div>• 상품/이용권: ${this.formatNumber(pricing.influencer_gets.product_or_voucher)}원</div>
          ${pricing.influencer_gets.points > 0 ? `<div>• 포인트: ${this.formatNumber(pricing.influencer_gets.points)}P (현금 출금 가능)</div>` : ''}
        </div>
      </div>
    `;
  },

  // 캐시 초기화 (설정 변경 후 호출)
  clearCache() {
    this._settingsCache = null;
    this._cacheTime = null;
  }
};

// 전역으로 노출
window.PricingUtils = PricingUtils;
