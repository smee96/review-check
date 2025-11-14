// Pricing utility functions

export interface PricingCalculation {
  pricing_type: string;
  product_value: number;
  sphere_points: number;
  total_value: number;
  platform_fee: number;
  points_fee: number; // 포인트 수수료
  total_platform_fee: number; // 고정 수수료 + 포인트 수수료
  total_cost: number; // 광고주 총 지출
  influencer_gets: {
    product_or_voucher: number;
    points: number;
  };
}

/**
 * DB에서 시스템 설정값 조회
 */
export async function getSystemSetting(env: any, key: string): Promise<string | null> {
  const result = await env.DB.prepare(
    'SELECT setting_value FROM system_settings WHERE setting_key = ?'
  ).bind(key).first();
  
  return result ? result.setting_value as string : null;
}

/**
 * DB에서 건당 고정 수수료 조회
 */
export async function getFixedFee(env: any, pricingType: string): Promise<number> {
  let settingKey: string;
  
  switch(pricingType) {
    case 'points_only':
      settingKey = 'fixed_fee_points_only';
      break;
    case 'purchase_with_points':
      settingKey = 'fixed_fee_purchase_with_points';
      break;
    case 'product_only':
      settingKey = 'fixed_fee_product_only';
      break;
    case 'product_with_points':
      settingKey = 'fixed_fee_product_with_points';
      break;
    case 'voucher_only':
      settingKey = 'fixed_fee_voucher_only';
      break;
    case 'voucher_with_points':
      settingKey = 'fixed_fee_voucher_with_points';
      break;
    default:
      settingKey = 'fixed_fee_product_only';
  }
  
  const feeStr = await getSystemSetting(env, settingKey);
  return feeStr ? Number(feeStr) : 10000; // 기본값 10,000원
}

/**
 * DB에서 포인트 수수료율 조회
 */
export async function getPointsFeeRate(env: any): Promise<number> {
  const rateStr = await getSystemSetting(env, 'points_fee_rate');
  return rateStr ? Number(rateStr) / 100 : 0.30; // 기본값 30%
}

/**
 * 플랫폼 수수료 계산 (고정 수수료 + 포인트 수수료)
 */
export async function calculatePlatformFee(
  env: any,
  pricingType: string,
  productValue: number,
  spherePoints: number = 0
): Promise<{ fixedFee: number; pointsFee: number; totalFee: number }> {
  const fixedFee = await getFixedFee(env, pricingType);
  const pointsFeeRate = await getPointsFeeRate(env);
  
  // 포인트가 있는 경우에만 포인트 수수료 계산
  const pointsFee = spherePoints > 0 ? Math.floor(spherePoints * pointsFeeRate) : 0;
  
  return {
    fixedFee,
    pointsFee,
    totalFee: fixedFee + pointsFee
  };
}

/**
 * 전체 과금 정보 계산 (관리자/광고주에게 보여줄 상세 정보)
 */
export async function calculateFullPricing(
  env: any,
  pricingType: string,
  productValue: number,
  spherePoints: number = 0
): Promise<PricingCalculation> {
  const { fixedFee, pointsFee, totalFee } = await calculatePlatformFee(env, pricingType, productValue, spherePoints);
  
  let totalValue: number;
  if (pricingType === 'points_only') {
    totalValue = spherePoints;
  } else if (pricingType === 'purchase_with_points' || pricingType === 'product_with_points' || pricingType === 'voucher_with_points') {
    totalValue = productValue + spherePoints;
  } else {
    totalValue = productValue;
  }
  
  // 광고주 총 지출 = 상품/이용권 가격 + 포인트 + 플랫폼 수수료
  const totalCost = productValue + spherePoints + totalFee;
  
  return {
    pricing_type: pricingType,
    product_value: productValue,
    sphere_points: spherePoints,
    total_value: totalValue,
    platform_fee: fixedFee,
    points_fee: pointsFee,
    total_platform_fee: totalFee,
    total_cost: totalCost,
    influencer_gets: {
      product_or_voucher: productValue,
      points: spherePoints
    }
  };
}

/**
 * 과금 타입별 한글 이름
 */
export function getPricingTypeName(pricingType: string): string {
  const names: Record<string, string> = {
    'points_only': '포인트만 지급',
    'purchase_with_points': '구매 + 포인트',
    'product_only': '상품만 제공',
    'product_with_points': '상품 + 포인트',
    'voucher_only': '이용권만 제공',
    'voucher_with_points': '이용권 + 포인트'
  };
  return names[pricingType] || pricingType;
}
