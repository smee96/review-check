// Pricing utility functions

export interface PricingCalculation {
  pricing_type: string;
  product_value: number;
  sphere_points: number;
  total_value: number;
  platform_fee: number;
  platform_fee_rate: number;
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
 * DB에서 수수료율 조회
 */
export async function getFeeRate(env: any, pricingType: string): Promise<number> {
  let settingKey: string;
  
  switch(pricingType) {
    case 'product_only':
      settingKey = 'fee_rate_product_only';
      break;
    case 'voucher_only':
      settingKey = 'fee_rate_voucher_only';
      break;
    case 'product_with_points':
    case 'voucher_with_points':
      settingKey = 'fee_rate_with_points';
      break;
    default:
      settingKey = 'fee_rate_product_only';
  }
  
  const rateStr = await getSystemSetting(env, settingKey);
  return rateStr ? Number(rateStr) / 100 : 0.20; // 기본값 20%
}

/**
 * DB에서 최소 수수료 조회
 */
export async function getMinFee(env: any, pricingType: string): Promise<number> {
  let settingKey: string;
  
  switch(pricingType) {
    case 'product_only':
    case 'product_with_points':
      settingKey = 'min_fee_product';
      break;
    case 'voucher_only':
    case 'voucher_with_points':
      settingKey = 'min_fee_voucher';
      break;
    default:
      settingKey = 'min_fee_product';
  }
  
  const minFeeStr = await getSystemSetting(env, settingKey);
  return minFeeStr ? Number(minFeeStr) : 0;
}

/**
 * 플랫폼 수수료 계산 (실시간 DB 조회)
 */
export async function calculatePlatformFee(
  env: any,
  pricingType: string,
  productValue: number,
  spherePoints: number = 0
): Promise<number> {
  const feeRate = await getFeeRate(env, pricingType);
  const minFee = await getMinFee(env, pricingType);
  
  let totalValue: number;
  
  // 포인트 포함 여부에 따라 계산 방식 다름
  if (pricingType === 'product_with_points' || pricingType === 'voucher_with_points') {
    totalValue = productValue + spherePoints;
  } else {
    totalValue = productValue;
  }
  
  const calculatedFee = Math.floor(totalValue * feeRate);
  
  // 최소 수수료와 비교하여 큰 값 반환
  return Math.max(calculatedFee, minFee);
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
  const platformFee = await calculatePlatformFee(env, pricingType, productValue, spherePoints);
  const feeRate = await getFeeRate(env, pricingType);
  
  let totalValue: number;
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
}

/**
 * 과금 타입별 한글 이름
 */
export function getPricingTypeName(pricingType: string): string {
  const names: Record<string, string> = {
    'product_only': '상품만 제공',
    'voucher_only': '이용권만 제공',
    'product_with_points': '상품 + 스피어포인트',
    'voucher_with_points': '이용권 + 스피어포인트'
  };
  return names[pricingType] || pricingType;
}
