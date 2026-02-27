// Campaign Status Management by Schedule
// 캠페인 일정에 따른 자동 상태 관리

/**
 * 캠페인 일정 기반 상태 계산
 * @param campaign - 캠페인 객체
 * @param today - 현재 날짜 (YYYY-MM-DD, 한국 시간 기준)
 * @returns 계산된 상태
 */
export function calculateCampaignStatus(campaign: any, today: string): string {
  const {
    status,
    payment_status,
    application_start_date,
    application_end_date,
    announcement_date,
    content_start_date,
    content_end_date,
    result_announcement_date
  } = campaign;

  // 1. pending(대기) 상태는 관리자 승인 전이므로 변경하지 않음
  if (status === 'pending') {
    return 'pending';
  }

  // 2. 결제 미완료 상태는 변경하지 않음
  if (payment_status !== 'paid') {
    return status;
  }

  // 3. suspended(일시중지), cancelled(취소)는 관리자가 직접 설정한 것이므로 변경하지 않음
  if (status === 'suspended' || status === 'cancelled') {
    return status;
  }

  // 4. completed(완료)는 되돌리지 않음
  if (status === 'completed') {
    return 'completed';
  }

  // 5. 날짜 기반 상태 계산 (approved 상태에서만)
  // 결과 발표일 이후 → completed
  if (result_announcement_date && today > result_announcement_date) {
    return 'completed';
  }

  // 콘텐츠 제작 기간 → in_progress
  if (content_start_date && content_end_date && today >= content_start_date && today <= content_end_date) {
    return 'approved'; // DB에는 approved로 저장 (프론트는 in_progress로 표시)
  }

  // 발표일 ~ 콘텐츠 시작일 → in_progress
  if (announcement_date && content_start_date && today >= announcement_date && today < content_start_date) {
    return 'approved'; // DB에는 approved로 저장
  }

  // 신청 마감 ~ 발표일 → in_progress
  if (application_end_date && announcement_date && today > application_end_date && today < announcement_date) {
    return 'approved'; // DB에는 approved로 저장
  }

  // 신청 기간 → recruiting
  if (application_start_date && application_end_date && today >= application_start_date && today <= application_end_date) {
    return 'approved'; // DB에는 approved로 저장 (프론트는 recruiting으로 표시)
  }

  // 신청 시작 전 → approved (대기 중)
  if (application_start_date && today < application_start_date) {
    return 'approved';
  }

  // 기본값
  return 'approved';
}

/**
 * 프론트엔드 표시용 상태 계산
 * @param campaign - 캠페인 객체
 * @param today - 현재 날짜 (YYYY-MM-DD, 한국 시간 기준)
 * @returns 프론트엔드 표시 상태
 */
export function getDisplayStatus(campaign: any, today: string): string {
  const {
    status,
    payment_status,
    application_start_date,
    application_end_date,
    content_start_date,
    content_end_date
  } = campaign;

  // DB 상태가 approved가 아니면 그대로 반환
  if (status !== 'approved') {
    return status;
  }

  // 결제 미완료는 pending 표시
  if (payment_status !== 'paid') {
    return 'pending';
  }

  // 신청 기간 중 → recruiting
  if (application_start_date && application_end_date && today >= application_start_date && today <= application_end_date) {
    return 'recruiting';
  }

  // 신청 마감 후 ~ 콘텐츠 종료 → in_progress
  if (application_end_date && today > application_end_date) {
    if (!content_end_date || today <= content_end_date) {
      return 'in_progress';
    }
  }

  // 그 외는 approved
  return 'approved';
}

/**
 * 한국 시간 현재 날짜 가져오기 (YYYY-MM-DD)
 */
export function getKoreanDate(): string {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreaTime.toISOString().split('T')[0];
}
