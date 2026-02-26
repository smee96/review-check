// Admin Routes

import { Hono } from 'hono';
import { getCurrentDateTime, hashPassword } from '../utils';
import { authMiddleware, requireRole } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  user: any;
};

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require admin authentication
admin.use('*', authMiddleware, requireRole('admin'));

// 모든 캠페인 조회
admin.get('/campaigns', async (c) => {
  try {
    const { env } = c;
    
    const campaigns = await env.DB.prepare(
      `SELECT c.*, 
       COALESCE(c.is_best, 0) as is_best,
       u.email as advertiser_email, 
       u.nickname as advertiser_nickname
       FROM campaigns c
       JOIN users u ON c.advertiser_id = u.id
       ORDER BY c.created_at DESC`
    ).all();
    
    return c.json(campaigns.results);
  } catch (error) {
    console.error('Get all campaigns error:', error);
    return c.json({ error: '캠페인 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 상태 변경
admin.put('/campaigns/:id/status', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const { status } = await c.req.json();
    
    // 프론트엔드에서 recruiting/in_progress를 보낼 수 있으므로 approved로 변환
    let dbStatus = status;
    if (status === 'recruiting' || status === 'in_progress') {
      dbStatus = 'approved';
    }
    
    // 유효한 상태값: pending, approved, suspended, completed, cancelled
    if (!['pending', 'approved', 'suspended', 'completed', 'cancelled'].includes(dbStatus)) {
      return c.json({ error: '유효하지 않은 상태입니다' }, 400);
    }
    
    const { env } = c;
    
    await env.DB.prepare(
      'UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?'
    ).bind(dbStatus, getCurrentDateTime(), campaignId).run();
    
    return c.json({ success: true, message: '캠페인 상태가 변경되었습니다' });
  } catch (error) {
    console.error('Update campaign status error:', error);
    return c.json({ error: '상태 변경 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 결제 상태 변경
admin.put('/campaigns/:id/payment', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const { payment_status } = await c.req.json();
    
    if (!['unpaid', 'paid'].includes(payment_status)) {
      return c.json({ error: '유효하지 않은 결제 상태입니다' }, 400);
    }
    
    const { env } = c;
    
    await env.DB.prepare(
      'UPDATE campaigns SET payment_status = ?, updated_at = ? WHERE id = ?'
    ).bind(payment_status, getCurrentDateTime(), campaignId).run();
    
    return c.json({ success: true, message: '결제 상태가 변경되었습니다' });
  } catch (error) {
    console.error('Update payment status error:', error);
    return c.json({ error: '결제 상태 변경 중 오류가 발생했습니다' }, 500);
  }
});

// 정산 내역 조회 및 엑셀 다운로드용 데이터
admin.get('/settlements', async (c) => {
  try {
    const { env } = c;
    
    // Get all approved applications with influencer and campaign info
    const settlements = await env.DB.prepare(
      `SELECT 
        a.id as application_id,
        c.title as campaign_title,
        c.budget,
        u.email as influencer_email,
        u.nickname as influencer_nickname,
        ip.account_holder_name,
        ip.bank_name,
        ip.account_number,
        ip.business_number,
        ip.contact_phone,
        r.post_url,
        r.submitted_at,
        a.applied_at,
        a.reviewed_at
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       JOIN users u ON a.influencer_id = u.id
       LEFT JOIN influencer_profiles ip ON u.id = ip.user_id
       LEFT JOIN reviews r ON a.id = r.application_id
       WHERE a.status = 'approved'
       ORDER BY a.reviewed_at DESC`
    ).all();
    
    return c.json(settlements.results);
  } catch (error) {
    console.error('Get settlements error:', error);
    return c.json({ error: '정산 내역 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 시스템 설정 조회
admin.get('/settings', async (c) => {
  try {
    const { env } = c;
    
    const settings = await env.DB.prepare(
      'SELECT * FROM system_settings ORDER BY setting_key'
    ).all();
    
    return c.json(settings.results);
  } catch (error) {
    console.error('Get system settings error:', error);
    return c.json({ error: '시스템 설정 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 시스템 설정 수정
admin.put('/settings/:key', async (c) => {
  try {
    const settingKey = c.req.param('key');
    const { value } = await c.req.json();
    
    if (!value) {
      return c.json({ error: '설정값을 입력해주세요' }, 400);
    }
    
    const { env } = c;
    
    // 설정값 업데이트
    await env.DB.prepare(
      'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
    ).bind(value, settingKey).run();
    
    // 업데이트된 설정값 반환
    const updated = await env.DB.prepare(
      'SELECT * FROM system_settings WHERE setting_key = ?'
    ).bind(settingKey).first();
    
    return c.json(updated);
  } catch (error) {
    console.error('Update system setting error:', error);
    return c.json({ error: '시스템 설정 수정 중 오류가 발생했습니다' }, 500);
  }
});

// 전체 사용자 목록 조회
admin.get('/users', async (c) => {
  try {
    const { env } = c;
    
    const users = await env.DB.prepare(
      `SELECT 
        id,
        email,
        nickname,
        role,
        sphere_points,
        created_at,
        updated_at
       FROM users
       ORDER BY created_at DESC`
    ).all();
    
    return c.json(users.results);
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: '사용자 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 모든 리뷰 조회 (관리자용)
admin.get('/reviews', async (c) => {
  try {
    const { env } = c;
    
    const reviews = await env.DB.prepare(
      `SELECT r.id, r.application_id, r.post_url, r.image_url as review_image, 
       r.submitted_at, r.updated_at, r.approval_status, r.rejection_reason, 
       COALESCE(r.is_best, 0) as is_best, r.reviewed_by, r.reviewed_at,
       '' as review_text,
       c.title as campaign_title,
       c.id as campaign_id,
       u.nickname as influencer_nickname,
       u.email as influencer_email,
       a.applied_at as created_at
       FROM reviews r
       JOIN applications a ON r.application_id = a.id
       JOIN campaigns c ON a.campaign_id = c.id
       JOIN users u ON a.influencer_id = u.id
       ORDER BY r.submitted_at DESC`
    ).all();
    
    return c.json(reviews.results);
  } catch (error) {
    console.error('Get all reviews error:', error);
    return c.json({ error: '리뷰 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 베스트 캠페인 토글
admin.put('/campaigns/:id/best', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const { is_best } = await c.req.json();
    const { env } = c;
    
    await env.DB.prepare(
      'UPDATE campaigns SET is_best = ?, updated_at = ? WHERE id = ?'
    ).bind(is_best ? 1 : 0, getCurrentDateTime(), campaignId).run();
    
    return c.json({ 
      success: true, 
      message: is_best ? '베스트 캠페인으로 설정되었습니다' : '베스트 캠페인에서 제외되었습니다' 
    });
  } catch (error) {
    console.error('Toggle best campaign error:', error);
    return c.json({ error: '베스트 캠페인 설정 중 오류가 발생했습니다' }, 500);
  }
});

// 베스트 리뷰 토글
admin.put('/reviews/:id/best', async (c) => {
  try {
    const reviewId = c.req.param('id');
    const { is_best } = await c.req.json();
    const { env } = c;
    
    await env.DB.prepare(
      'UPDATE reviews SET is_best = ?, updated_at = ? WHERE id = ?'
    ).bind(is_best ? 1 : 0, getCurrentDateTime(), reviewId).run();
    
    return c.json({ 
      success: true, 
      message: is_best ? '베스트 리뷰로 설정되었습니다' : '베스트 리뷰에서 제외되었습니다' 
    });
  } catch (error) {
    console.error('Toggle best review error:', error);
    return c.json({ error: '베스트 리뷰 설정 중 오류가 발생했습니다' }, 500);
  }
});

// 통계 조회
admin.get('/stats', async (c) => {
  try {
    const { env } = c;
    
    // 오늘 날짜 (한국 시간 기준 KST, UTC+9)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
    const kstNow = new Date(now.getTime() + kstOffset);
    
    // 한국 시간 기준 오늘 00:00:00
    const kstToday = new Date(kstNow);
    kstToday.setUTCHours(0, 0, 0, 0);
    
    // UTC로 변환 (한국 시간 00:00:00 = UTC 전날 15:00:00)
    const todayStr = new Date(kstToday.getTime() - kstOffset).toISOString();
    
    // 오늘 방문자 수 (visitor_logs 테이블이 없으면 0 반환)
    let todayVisitors = 0;
    try {
      // 30일 이상 된 로그 삭제 (DB 용량 관리)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await env.DB.prepare(
        `DELETE FROM visitor_logs WHERE visited_at < ?`
      ).bind(thirtyDaysAgo.toISOString()).run();
      
      // 오늘 방문자 수 조회
      const visitorsResult = await env.DB.prepare(
        `SELECT COUNT(DISTINCT ip_address) as count 
         FROM visitor_logs 
         WHERE visited_at >= ?`
      ).bind(todayStr).first();
      todayVisitors = visitorsResult?.count || 0;
    } catch (e) {
      console.log('Visitor logs table not found, returning 0');
    }
    
    // 전체 통계
    const totalUsers = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const totalCampaigns = await env.DB.prepare('SELECT COUNT(*) as count FROM campaigns').first();
    // 현재 모집 중인 캠페인 = approved 상태 + 신청기간 내
    const currentDate = new Date();
    const koreaDate = new Date(currentDate.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const activeCampaigns = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM campaigns 
       WHERE status = 'approved' 
       AND application_start_date <= ? 
       AND application_end_date >= ?`
    ).bind(koreaDate, koreaDate).first();
    
    return c.json({
      todayVisitors,
      totalUsers: totalUsers?.count || 0,
      totalCampaigns: totalCampaigns?.count || 0,
      activeCampaigns: activeCampaigns?.count || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: '통계 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 테스트 인플루언서 지원 데이터 생성
admin.post('/seed-applications', async (c) => {
  try {
    const { env } = c;
    
    // 1. 테스트 인플루언서 조회
    const influencers = await env.DB.prepare(
      `SELECT id FROM users WHERE email LIKE 'influencer%@test.com' AND role = 'influencer' ORDER BY id`
    ).all();
    
    if (!influencers.results || influencers.results.length === 0) {
      return c.json({ error: '테스트 인플루언서가 없습니다' }, 404);
    }
    
    // 2. 모집중/진행중 캠페인 조회
    const campaigns = await env.DB.prepare(
      `SELECT id, title, slots FROM campaigns WHERE status IN ('recruiting', 'in_progress') ORDER BY id`
    ).all();
    
    if (!campaigns.results || campaigns.results.length === 0) {
      return c.json({ error: '모집중이거나 진행중인 캠페인이 없습니다' }, 404);
    }
    
    // 3. 기존 테스트 지원 데이터 삭제
    await env.DB.prepare(
      `DELETE FROM applications WHERE influencer_id IN (SELECT id FROM users WHERE email LIKE 'influencer%@test.com')`
    ).run();
    
    // 4. 각 캠페인에 대해 지원 데이터 생성
    const now = getCurrentDateTime();
    let totalInserted = 0;
    
    for (const campaign of campaigns.results as any[]) {
      const slots = campaign.slots || 10;
      // 모집인원에 따라 현실적인 지원자 수 계산
      // 10명 → 10~15명 사이
      // 20명 → 25~30명 사이
      // 일반적으로 slots + (slots * 0.25 ~ slots * 0.5) 범위
      const minApplicants = Math.floor(slots + slots * 0.0);  // 최소: 모집인원과 동일
      const maxApplicants = Math.floor(slots + slots * 0.5);  // 최대: 모집인원 + 50%
      const applicantsCount = Math.floor(Math.random() * (maxApplicants - minApplicants + 1)) + minApplicants;
      
      // 랜덤하게 인플루언서 선택
      const shuffled = [...influencers.results].sort(() => Math.random() - 0.5);
      const selectedInfluencers = shuffled.slice(0, Math.min(applicantsCount, influencers.results.length));
      
      for (const influencer of selectedInfluencers) {
        await env.DB.prepare(
          `INSERT INTO applications (campaign_id, influencer_id, status, applied_at)
           VALUES (?, ?, 'pending', ?)`
        ).bind(
          campaign.id,
          (influencer as any).id,
          now
        ).run();
        totalInserted++;
      }
    }
    
    return c.json({ 
      success: true, 
      message: `${totalInserted}개의 테스트 지원 데이터가 생성되었습니다`,
      campaigns: campaigns.results.length,
      influencers: influencers.results.length
    });
  } catch (error) {
    console.error('Seed applications error:', error);
    return c.json({ error: '테스트 데이터 생성 중 오류가 발생했습니다' }, 500);
  }
});

// 관리자 - 사용자 비밀번호 변경
admin.post('/users/:id/reset-password', async (c) => {
  try {
    const userId = c.req.param('id');
    const { newPassword } = await c.req.json();
    
    if (!newPassword || newPassword.length < 8) {
      return c.json({ error: '비밀번호는 최소 8자 이상이어야 합니다' }, 400);
    }
    
    const { env } = c;
    
    // 사용자 존재 확인
    const user = await env.DB.prepare(
      'SELECT id, email FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    // 비밀번호 해시 생성
    const passwordHash = await hashPassword(newPassword);
    
    // 비밀번호 업데이트
    await env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).bind(passwordHash, getCurrentDateTime(), userId).run();
    
    return c.json({ 
      success: true, 
      message: '비밀번호가 변경되었습니다',
      email: user.email
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: '비밀번호 변경 중 오류가 발생했습니다' }, 500);
  }
});

export default admin;
