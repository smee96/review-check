// Admin Routes

import { Hono } from 'hono';
import { getCurrentDateTime } from '../utils';
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
    
    // 유효한 상태값: pending, recruiting, in_progress, suspended, completed, cancelled
    if (!['pending', 'recruiting', 'in_progress', 'suspended', 'completed', 'cancelled'].includes(status)) {
      return c.json({ error: '유효하지 않은 상태입니다' }, 400);
    }
    
    const { env } = c;
    
    await env.DB.prepare(
      'UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?'
    ).bind(status, getCurrentDateTime(), campaignId).run();
    
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
    
    // 오늘 날짜 (한국 시간 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
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
    const activeCampaigns = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM campaigns WHERE status = 'recruiting'`
    ).first();
    
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

export default admin;
