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
campaigns.post('/', requireRole('advertiser', 'agency', 'rep', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const { 
      title, description, product_name, product_url, requirements, budget, slots,
      point_reward, thumbnail_image, channel_type, instagram_mention_account, blog_product_url, youtube_purchase_link,
      application_start_date, application_end_date, announcement_date,
      content_start_date, content_end_date, result_announcement_date,
      provided_items, mission, keywords, notes
    } = data;
    
    if (!title) {
      return c.json({ error: '캠페인 제목을 입력해주세요' }, 400);
    }
    
    if (!channel_type) {
      return c.json({ error: '캠페인 채널을 선택해주세요' }, 400);
    }
    
    const { env } = c;
    
    const result = await env.DB.prepare(
      `INSERT INTO campaigns (
        advertiser_id, title, description, product_name, product_url, requirements, 
        budget, slots, point_reward, thumbnail_image, channel_type, instagram_mention_account, 
        blog_product_url, youtube_purchase_link, application_start_date, application_end_date, 
        announcement_date, content_start_date, content_end_date, result_announcement_date,
        provided_items, mission, keywords, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(
      user.userId,
      title,
      description || null,
      product_name || null,
      product_url || null,
      requirements || null,
      budget || null,
      slots || 1,
      point_reward || 0,
      thumbnail_image || null,
      channel_type,
      instagram_mention_account || null,
      blog_product_url || null,
      youtube_purchase_link || null,
      application_start_date || null,
      application_end_date || null,
      announcement_date || null,
      content_start_date || null,
      content_end_date || null,
      result_announcement_date || null,
      provided_items || null,
      mission || null,
      keywords || null,
      notes || null,
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
campaigns.get('/my', requireRole('advertiser', 'agency', 'rep', 'admin'), async (c) => {
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
    
    // 광고주/대행사/렙사는 자신의 캠페인만, 인플루언서는 승인된 캠페인만, 관리자는 모두 조회 가능
    if (['advertiser', 'agency', 'rep'].includes(user.role) && campaign.advertiser_id !== user.userId) {
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
    
    // Check ownership and permissions
    const campaign = await env.DB.prepare(
      'SELECT advertiser_id, status, application_start_date FROM campaigns WHERE id = ?'
    ).bind(campaignId).first() as any;
    
    if (!campaign) {
      return c.json({ error: '캠페인을 찾을 수 없습니다' }, 404);
    }
    
    if (user.role !== 'admin' && campaign.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // 광고주 권한 체크: 승인된 캠페인이거나 신청 시작일 이후면 수정 불가
    if (user.role !== 'admin') {
      if (campaign.status === 'approved' || campaign.status === 'active' || campaign.status === 'suspended') {
        return c.json({ error: '승인된 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.' }, 403);
      }
      
      const today = new Date().toISOString().split('T')[0];
      if (campaign.application_start_date && campaign.application_start_date <= today) {
        return c.json({ error: '신청 시작일 이후에는 캠페인을 수정할 수 없습니다. 관리자에게 문의해주세요.' }, 403);
      }
    }
    
    const data = await c.req.json();
    const { 
      title, description, product_name, product_url, requirements, budget, slots,
      point_reward, thumbnail_image, channel_type, instagram_mention_account, blog_product_url, youtube_purchase_link,
      application_start_date, application_end_date, announcement_date,
      content_start_date, content_end_date, result_announcement_date,
      provided_items, mission, keywords, notes, payment_status
    } = data;
    
    if (!title) {
      return c.json({ error: '캠페인 제목을 입력해주세요' }, 400);
    }
    
    if (!channel_type) {
      return c.json({ error: '캠페인 채널을 선택해주세요' }, 400);
    }
    
    // 썸네일 이미지가 새로 제공된 경우만 업데이트
    let updateQuery = `UPDATE campaigns 
       SET title = ?, description = ?, product_name = ?, product_url = ?, requirements = ?, 
           budget = ?, slots = ?, point_reward = ?, channel_type = ?, instagram_mention_account = ?, 
           blog_product_url = ?, youtube_purchase_link = ?, application_start_date = ?, application_end_date = ?, 
           announcement_date = ?, content_start_date = ?, content_end_date = ?, result_announcement_date = ?,
           provided_items = ?, mission = ?, keywords = ?, notes = ?, updated_at = ?`;
    
    const params = [
      title,
      description || null,
      product_name || null,
      product_url || null,
      requirements || null,
      budget || null,
      slots || 10,
      point_reward || 0,
      channel_type,
      instagram_mention_account || null,
      blog_product_url || null,
      youtube_purchase_link || null,
      application_start_date || null,
      application_end_date || null,
      announcement_date || null,
      content_start_date || null,
      content_end_date || null,
      result_announcement_date || null,
      provided_items || null,
      mission || null,
      keywords || null,
      notes || null,
      getCurrentDateTime()
    ];
    
    // 썸네일 이미지가 제공된 경우 추가
    if (thumbnail_image) {
      updateQuery += ', thumbnail_image = ?';
      params.push(thumbnail_image);
    }
    
    // 관리자인 경우에만 결제 상태 업데이트 가능
    if (user.role === 'admin' && payment_status) {
      if (!['unpaid', 'paid'].includes(payment_status)) {
        return c.json({ error: '유효하지 않은 결제 상태입니다' }, 400);
      }
      updateQuery += ', payment_status = ?';
      params.push(payment_status);
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(campaignId);
    
    await env.DB.prepare(updateQuery).bind(...params).run();
    
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
    const { 
      message, 
      shipping_recipient, shipping_phone, shipping_zipcode, 
      shipping_address, shipping_detail 
    } = await c.req.json();
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
    
    // Validate required shipping information
    if (!shipping_recipient || !shipping_phone || !shipping_zipcode || !shipping_address) {
      return c.json({ error: '배송 정보를 모두 입력해주세요' }, 400);
    }
    
    // Create application with shipping info
    await env.DB.prepare(
      `INSERT INTO applications (
        campaign_id, influencer_id, message, 
        shipping_recipient, shipping_phone, shipping_zipcode, shipping_address, shipping_detail,
        applied_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      campaignId, 
      user.userId, 
      message || null,
      shipping_recipient,
      shipping_phone,
      shipping_zipcode,
      shipping_address,
      shipping_detail || null,
      getCurrentDateTime()
    ).run();
    
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
    
    // Get applications with influencer info and shipping details
    const applications = await env.DB.prepare(
      `SELECT a.*, u.email, u.nickname,
              ip.instagram_handle, ip.youtube_channel, ip.blog_url, ip.tiktok_handle, 
              ip.follower_count, ip.category, ip.real_name, ip.contact_phone
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
