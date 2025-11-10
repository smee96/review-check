// Campaign Routes (광고주 & 인플루언서)

import { Hono } from 'hono';
import type { Campaign } from '../types';
import { getCurrentDateTime } from '../utils';
import { authMiddleware, requireRole } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

const campaigns = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
campaigns.use('*', authMiddleware);

// 캠페인 등록 (광고주)
campaigns.post('/', requireRole('advertiser', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const { title, description, product_name, product_url, requirements, budget, slots, start_date, end_date } = data;
    
    if (!title) {
      return c.json({ error: '캠페인 제목을 입력해주세요' }, 400);
    }
    
    const { env } = c;
    
    const result = await env.DB.prepare(
      `INSERT INTO campaigns (advertiser_id, title, description, product_name, product_url, requirements, budget, slots, start_date, end_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(
      user.userId,
      title,
      description || null,
      product_name || null,
      product_url || null,
      requirements || null,
      budget || null,
      slots || 1,
      start_date || null,
      end_date || null,
      getCurrentDateTime(),
      getCurrentDateTime()
    ).run();
    
    return c.json({ 
      success: true, 
      campaignId: result.meta.last_row_id,
      message: '캠페인이 등록되었습니다. 관리자 승인 후 활성화됩니다.'
    }, 201);
  } catch (error) {
    console.error('Create campaign error:', error);
    return c.json({ error: '캠페인 등록 중 오류가 발생했습니다' }, 500);
  }
});

// 내 캠페인 목록 조회 (광고주)
campaigns.get('/my', requireRole('advertiser', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    const campaigns = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE advertiser_id = ? ORDER BY created_at DESC'
    ).bind(user.userId).all();
    
    return c.json(campaigns.results);
  } catch (error) {
    console.error('Get my campaigns error:', error);
    return c.json({ error: '캠페인 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 승인된 캠페인 목록 조회 (인플루언서)
campaigns.get('/', requireRole('influencer', 'admin'), async (c) => {
  try {
    const { env } = c;
    
    const campaigns = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC'
    ).bind('approved').all();
    
    return c.json(campaigns.results);
  } catch (error) {
    console.error('Get campaigns error:', error);
    return c.json({ error: '캠페인 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 상세 조회
campaigns.get('/:id', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const user = c.get('user');
    const { env } = c;
    
    const campaign = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE id = ?'
    ).bind(campaignId).first() as Campaign | null;
    
    if (!campaign) {
      return c.json({ error: '캠페인을 찾을 수 없습니다' }, 404);
    }
    
    // 광고주는 자신의 캠페인만, 인플루언서는 승인된 캠페인만, 관리자는 모두 조회 가능
    if (user.role === 'advertiser' && campaign.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    if (user.role === 'influencer' && campaign.status !== 'approved') {
      return c.json({ error: '승인된 캠페인만 조회할 수 있습니다' }, 403);
    }
    
    return c.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    return c.json({ error: '캠페인 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 수정
campaigns.put('/:id', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const user = c.get('user');
    const { env } = c;
    
    // Check ownership
    const campaign = await env.DB.prepare(
      'SELECT advertiser_id FROM campaigns WHERE id = ?'
    ).bind(campaignId).first();
    
    if (!campaign) {
      return c.json({ error: '캠페인을 찾을 수 없습니다' }, 404);
    }
    
    if (user.role !== 'admin' && campaign.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    const data = await c.req.json();
    const { title, description, product_name, product_url, requirements, budget, slots, start_date, end_date } = data;
    
    await env.DB.prepare(
      `UPDATE campaigns 
       SET title = ?, description = ?, product_name = ?, product_url = ?, requirements = ?, 
           budget = ?, slots = ?, start_date = ?, end_date = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      title,
      description || null,
      product_name || null,
      product_url || null,
      requirements || null,
      budget || null,
      slots || 1,
      start_date || null,
      end_date || null,
      getCurrentDateTime(),
      campaignId
    ).run();
    
    return c.json({ success: true, message: '캠페인이 수정되었습니다' });
  } catch (error) {
    console.error('Update campaign error:', error);
    return c.json({ error: '캠페인 수정 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 지원하기 (인플루언서)
campaigns.post('/:id/apply', requireRole('influencer'), async (c) => {
  try {
    const campaignId = c.req.param('id');
    const user = c.get('user');
    const { message } = await c.req.json();
    const { env } = c;
    
    // Check if campaign exists and is approved
    const campaign = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND status = ?'
    ).bind(campaignId, 'approved').first();
    
    if (!campaign) {
      return c.json({ error: '승인된 캠페인을 찾을 수 없습니다' }, 404);
    }
    
    // Check if already applied
    const existing = await env.DB.prepare(
      'SELECT id FROM applications WHERE campaign_id = ? AND influencer_id = ?'
    ).bind(campaignId, user.userId).first();
    
    if (existing) {
      return c.json({ error: '이미 지원한 캠페인입니다' }, 400);
    }
    
    // Create application
    await env.DB.prepare(
      'INSERT INTO applications (campaign_id, influencer_id, message, applied_at) VALUES (?, ?, ?, ?)'
    ).bind(campaignId, user.userId, message || null, getCurrentDateTime()).run();
    
    return c.json({ success: true, message: '캠페인에 지원되었습니다' }, 201);
  } catch (error) {
    console.error('Apply campaign error:', error);
    return c.json({ error: '지원 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 지원자 목록 조회 (광고주)
campaigns.get('/:id/applications', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const user = c.get('user');
    const { env } = c;
    
    // Check campaign ownership and status
    const campaign = await env.DB.prepare(
      'SELECT advertiser_id, status FROM campaigns WHERE id = ?'
    ).bind(campaignId).first();
    
    if (!campaign) {
      return c.json({ error: '캠페인을 찾을 수 없습니다' }, 404);
    }
    
    if (user.role !== 'admin' && campaign.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // 승인된 캠페인만 지원자 조회 가능
    if (campaign.status !== 'approved') {
      return c.json({ error: '승인된 캠페인만 지원자를 조회할 수 있습니다' }, 403);
    }
    
    // Get applications with influencer info
    const applications = await env.DB.prepare(
      `SELECT a.*, u.email, u.nickname,
              ip.instagram_handle, ip.youtube_channel, ip.blog_url, ip.tiktok_handle, ip.follower_count, ip.category
       FROM applications a
       JOIN users u ON a.influencer_id = u.id
       LEFT JOIN influencer_profiles ip ON u.id = ip.user_id
       WHERE a.campaign_id = ?
       ORDER BY a.applied_at DESC`
    ).bind(campaignId).all();
    
    return c.json(applications.results);
  } catch (error) {
    console.error('Get applications error:', error);
    return c.json({ error: '지원자 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

export default campaigns;
