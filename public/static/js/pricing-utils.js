// 과금 관련 유틸리티 함수 (Frontend)

class PricingUtils {
  constructor() {
    this.settingsCache = null;
    this.cacheTime = null;
    this.CACHE_DURATION = 60000; // 1분
  }

  // 시스템 설정 조회 (캐싱 적용)
  async getSystemSettings() {
    const now = Date.now();
    
    // 캐시가 유효한 경우 캐시 반환
    if (this.settingsCache && this.cacheTime && (now - this.cacheTime < this.CACHE_DURATION)) {
      return this.settingsCache;
    }
    
    // 새로 조회
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const settingsArray = await response.json();
      
      // 배열을 객체로 변환
      const settingsObj = {};
      settingsArray.forEach(setting => {
        settingsObj[setting.setting_key] = Number(setting.setting_value);
      });
      
      this.settingsCache = settingsObj;
      this.cacheTime = now;
      
      return settingsObj;
    } catch (error) {
      console.error('Failed to load system settings:', error);
      // 에러 시 기본값 반환 (런칭 프로모션: 30,000원 → 10,000원)
      return {
        fixed_fee_points_only: 10000,
        fixed_fee_purchase_with_points: 10000,
        fixed_fee_product_only: 10000,
        fixed_fee_product_with_points: 10000,
        fixed_fee_voucher_only: 10000,
        fixed_fee_voucher_with_points: 10000,
        points_fee_rate: 30,
        fixed_fee_original: 30000  // 원래 가격 (프로모션 전)
      };
    }
  }

  // 건당 고정 수수료 조회
  async getFixedFee(pricingType) {
    const settings = await this.getSystemSettings();
    
    switch(pricingType) {
      case 'points_only':
        return settings.fixed_fee_points_only || 10000;
      case 'purchase_with_points':
        return settings.fixed_fee_purchase_with_points || 10000;
      case 'product_only':
        return settings.fixed_fee_product_only || 10000;
      case 'product_with_points':
        return settings.fixed_fee_product_with_points || 10000;
      case 'voucher_only':
        return settings.fixed_fee_voucher_only || 10000;
      case 'voucher_with_points':
        return settings.fixed_fee_voucher_with_points || 10000;
      default:
        return 10000;
    }
  }

  // 포인트 수수료율 조회
  async getPointsFeeRate() {
    const settings = await this.getSystemSettings();
    return settings.points_fee_rate || 30;
  }

  // 플랫폼 수수료 계산 (고정 수수료 + 포인트 수수료)
  async calculatePlatformFee(pricingType, productValue, spherePoints = 0) {
    const fixedFee = await this.getFixedFee(pricingType);
    const pointsFeeRate = await this.getPointsFeeRate();
    
    // 포인트가 있는 경우에만 포인트 수수료 계산
    const pointsFee = spherePoints > 0 ? Math.floor(spherePoints * (pointsFeeRate / 100)) : 0;
    
    return {
      fixedFee,
      pointsFee,
      totalFee: fixedFee + pointsFee
    };
  }

  // 전체 비용 계산
  async calculateFullPricing(pricingType, productValue, spherePoints = 0) {
    const { fixedFee, pointsFee, totalFee } = await this.calculatePlatformFee(pricingType, productValue, spherePoints);
    
    // 광고주 총 지출 계산
    // - 구매+포인트: 제품 가액 포함 (리뷰어 구매 대행 비용)
    // - 상품만/상품+포인트/이용권만/이용권+포인트: 제품 가액 제외 (광고주가 직접 제공)
    // - 포인트만: 포인트만 계산
    let totalCost;
    if (pricingType === 'purchase_with_points') {
      // 구매+포인트: 제품 가액 + 포인트 + 플랫폼 수수료
      totalCost = productValue + spherePoints + totalFee;
    } else {
      // 그 외: 포인트 + 플랫폼 수수료만
      totalCost = spherePoints + totalFee;
    }
    
    return {
      pricingType,
      productValue,
      spherePoints,
      fixedFee,
      pointsFee,
      totalPlatformFee: totalFee,
      totalCost,
      influencerGets: {
        productOrVoucher: productValue,
        points: spherePoints
      }
    };
  }

  // 과금 타입 한글명
  getPricingTypeName(pricingType) {
    const names = {
      'points_only': '포인트만 지급',
      'purchase_with_points': '구매 + 포인트',
      'product_only': '상품만 제공',
      'product_with_points': '상품 + 포인트',
      'voucher_only': '이용권만 제공',
      'voucher_with_points': '이용권 + 포인트'
    };
    return names[pricingType] || pricingType;
  }

  // 캐시 무효화
  invalidateCache() {
    this.settingsCache = null;
    this.cacheTime = null;
  }
}

// 전역 인스턴스
window.pricingUtils = new PricingUtils();
