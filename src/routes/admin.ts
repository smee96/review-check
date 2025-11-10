// Admin Routes

import { Hono } from 'hono';
import { getCurrentDateTime } from '../utils';
import { authMiddleware, requireRole } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

const admin = new Hono<{ Bindings: Bindings }>();

// All routes require admin authentication
admin.use('*', authMiddleware, requireRole('admin'));

// 모든 캠페인 조회
admin.get('/campaigns', async (c) => {
  try {
    const { env } = c;
    
    const campaigns = await env.DB.prepare(
      `SELECT c.*, u.email as advertiser_email, u.nickname as advertiser_nickname
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
    
    if (!['pending', 'approved', 'suspended', 'completed', 'cancelled'].includes(status)) {
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

export default admin;
