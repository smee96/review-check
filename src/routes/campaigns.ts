// Campaign Routes (광고주 & 인플루언서)

import { Hono } from 'hono';
import type { Campaign } from '../types';
import { getCurrentDateTime, verifyJWT } from '../utils';
import { authMiddleware, requireRole } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  user: any;
};

const campaigns = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 캠페인 등록 (광고주)
campaigns.post('/', authMiddleware, requireRole('advertiser', 'agency', 'rep', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const { 
      title, description, product_name, product_url, requirements, budget, slots,
      point_reward, thumbnail_image, channel_type, instagram_mention_account, blog_product_url, youtube_purchase_link,
      smartstore_product_url,
      application_start_date, application_end_date, announcement_date,
      content_start_date, content_end_date, result_announcement_date,
      provided_items, mission, keywords, notes,
      pricing_type, product_value, sphere_points
    } = data;
    
    if (!title) {
      return c.json({ error: '캠페인 제목을 입력해주세요' }, 400);
    }
    
    if (!channel_type) {
      return c.json({ error: '캠페인 채널을 선택해주세요' }, 400);
    }
    
    // 과금 방식 검증
    if (pricing_type && !['points_only', 'purchase_with_points', 'product_only', 'product_with_points', 'voucher_only', 'voucher_with_points'].includes(pricing_type)) {
      return c.json({ error: '유효하지 않은 과금 방식입니다' }, 400);
    }
    
    const { env } = c;
    
    const result = await env.DB.prepare(
      `INSERT INTO campaigns (
        advertiser_id, title, description, product_name, product_url, requirements, 
        budget, slots, point_reward, thumbnail_image, channel_type, instagram_mention_account, 
        blog_product_url, youtube_purchase_link, smartstore_product_url, application_start_date, application_end_date, 
        announcement_date, content_start_date, content_end_date, result_announcement_date,
        provided_items, mission, keywords, notes, pricing_type, product_value, sphere_points, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
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
      smartstore_product_url || null,
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
      pricing_type || 'product_only',
      product_value || 0,
      sphere_points || 0,
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
campaigns.get('/my', authMiddleware, requireRole('advertiser', 'agency', 'rep', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    const campaigns = await env.DB.prepare(
      `SELECT c.*, 
       (SELECT COUNT(*) FROM applications WHERE campaign_id = c.id) as application_count
       FROM campaigns c
       WHERE c.advertiser_id = ? 
       ORDER BY c.created_at DESC`
    ).bind(user.userId).all();
    
    return c.json(campaigns.results);
  } catch (error) {
    console.error('Get my campaigns error:', error);
    return c.json({ error: '캠페인 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 승인된 캠페인 목록 조회 (인플루언서 및 메인 페이지)
campaigns.get('/', async (c) => {
  try {
    const { env } = c;
    const type = c.req.query('type'); // 'best' or undefined
    
    if (type === 'best') {
      // 베스트 캠페인: 모집중이고 결제 완료된 캠페인 중 지원자 수가 많은 순
      // - 모든 캠페인: 결제 완료 필수 (포인트 0원 캠페인도 고정 수수료 11,000원 결제 필요)
      const campaigns = await env.DB.prepare(
        `SELECT c.*, 
         (SELECT COUNT(*) FROM applications WHERE campaign_id = c.id) as application_count
         FROM campaigns c
         WHERE c.status = ? AND c.payment_status = ?
         ORDER BY application_count DESC, c.created_at DESC
         LIMIT 10`
      ).bind('recruiting', 'paid').all();
      
      return c.json(campaigns.results);
    } else {
      // 진행중인 캠페인: 모집중(결제완료) + 승인대기(결제 무관) 캠페인
      // - 모집중: 결제 완료 필수
      // - 승인대기: 미리보기로 표시 (결제 상태 무관, 지원 불가 안내)
      const campaigns = await env.DB.prepare(
        `SELECT c.*, 
         (SELECT COUNT(*) FROM applications WHERE campaign_id = c.id) as application_count
         FROM campaigns c
         WHERE (c.status = ? AND c.payment_status = ?) 
            OR c.status = ?
         ORDER BY 
           CASE 
             WHEN c.status = 'recruiting' AND c.payment_status = 'paid' THEN 0
             WHEN c.status = 'pending' THEN 1
           END,
           c.created_at DESC`
      ).bind('recruiting', 'paid', 'pending').all();
      
      return c.json(campaigns.results);
    }
  } catch (error) {
    console.error('Get campaigns error:', error);
    return c.json({ error: '캠페인 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 상세 조회 (로그인 필수)
campaigns.get('/:id', authMiddleware, async (c) => {
  try {
    const campaignId = c.req.param('id');
    const { env } = c;
    const user = c.get('user');
    
    const campaign = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE id = ?'
    ).bind(campaignId).first() as Campaign | null;
    
    if (!campaign) {
      return c.json({ error: '캠페인을 찾을 수 없습니다' }, 404);
    }
    
    // 권한 체크
    // 광고주/대행사/렙사는 자신의 캠페인만 조회 가능
    if (['advertiser', 'agency', 'rep'].includes(user.role) && campaign.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // 인플루언서는 모든 캠페인 조회 가능 (pending 포함)
    // 단, 지원은 recruiting + paid 캠페인만 가능 (아래 can_apply에서 제어)
    
    // 인플루언서인 경우 지원 여부 및 신청 가능 여부 확인
    let has_applied = false;
    let can_apply = true;
    if (user.role === 'influencer') {
      const application = await env.DB.prepare(
        'SELECT id FROM applications WHERE campaign_id = ? AND influencer_id = ?'
      ).bind(campaignId, user.userId).first();
      has_applied = !!application;
      
      // pending 상태나 미결제 캠페인은 지원 불가
      if (campaign.status === 'pending' || campaign.payment_status !== 'paid') {
        can_apply = false;
      }
      
      // 신청 기간 체크 (한국 시간 기준 UTC+9)
      const now = new Date();
      const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0]; // YYYY-MM-DD
      if (campaign.application_start_date && koreaDate < campaign.application_start_date) {
        can_apply = false; // 신청 시작 전
      }
      if (campaign.application_end_date && koreaDate > campaign.application_end_date) {
        can_apply = false; // 신청 마감
      }
    }
    
    return c.json({
      ...campaign,
      has_applied,
      can_apply
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    return c.json({ error: '캠페인 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 수정
campaigns.put('/:id', authMiddleware, async (c) => {
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
    
    // 광고주 권한 체크: 모집 중이거나 진행 중인 캠페인, 또는 신청 시작일 이후면 수정 불가
    if (user.role !== 'admin') {
      if (campaign.status === 'recruiting' || campaign.status === 'in_progress' || campaign.status === 'suspended') {
        return c.json({ error: '모집 중이거나 진행 중인 캠페인은 수정할 수 없습니다. 관리자에게 문의해주세요.' }, 403);
      }
      
      const now = new Date();
      const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 한국 시간
      if (campaign.application_start_date && campaign.application_start_date < koreaDate) {
        return c.json({ error: '신청 시작일 이후에는 캠페인을 수정할 수 없습니다. 관리자에게 문의해주세요.' }, 403);
      }
    }
    
    const data = await c.req.json();
    const { 
      title, description, product_name, product_url, requirements, budget, slots,
      point_reward, thumbnail_image, channel_type, instagram_mention_account, blog_product_url, youtube_purchase_link,
      smartstore_product_url,
      application_start_date, application_end_date, announcement_date,
      content_start_date, content_end_date, result_announcement_date,
      provided_items, mission, keywords, notes, payment_status,
      pricing_type, product_value, sphere_points
    } = data;
    
    if (!title) {
      return c.json({ error: '캠페인 제목을 입력해주세요' }, 400);
    }
    
    if (!channel_type) {
      return c.json({ error: '캠페인 채널을 선택해주세요' }, 400);
    }
    
    // 과금 방식 검증
    if (pricing_type && !['points_only', 'purchase_with_points', 'product_only', 'product_with_points', 'voucher_only', 'voucher_with_points'].includes(pricing_type)) {
      return c.json({ error: '유효하지 않은 과금 방식입니다' }, 400);
    }
    
    // 썸네일 이미지가 새로 제공된 경우만 업데이트
    let updateQuery = `UPDATE campaigns 
       SET title = ?, description = ?, product_name = ?, product_url = ?, requirements = ?, 
           budget = ?, slots = ?, point_reward = ?, channel_type = ?, instagram_mention_account = ?, 
           blog_product_url = ?, youtube_purchase_link = ?, smartstore_product_url = ?, application_start_date = ?, application_end_date = ?, 
           announcement_date = ?, content_start_date = ?, content_end_date = ?, result_announcement_date = ?,
           provided_items = ?, mission = ?, keywords = ?, notes = ?, pricing_type = ?, product_value = ?, sphere_points = ?, updated_at = ?`;
    
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
      smartstore_product_url || null,
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
      pricing_type || 'product_only',
      product_value || 0,
      sphere_points || 0,
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
campaigns.post('/:id/apply', authMiddleware, requireRole('influencer'), async (c) => {
  try {
    const campaignId = c.req.param('id');
    const user = c.get('user');
    const { 
      message, 
      real_name, birth_date, gender, contact_phone,
      portrait_rights_consent, personal_info_consent, content_usage_consent,
      shipping_recipient, shipping_phone, shipping_zipcode, 
      shipping_address, shipping_detail 
    } = await c.req.json();
    const { env } = c;
    
    // Check if campaign exists and is recruiting
    const campaign = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND status = ?'
    ).bind(campaignId, 'recruiting').first();
    
    if (!campaign) {
      return c.json({ error: '모집 중인 캠페인을 찾을 수 없습니다' }, 404);
    }
    
    // Check if already applied
    const existing = await env.DB.prepare(
      'SELECT id FROM applications WHERE campaign_id = ? AND influencer_id = ?'
    ).bind(campaignId, user.userId).first();
    
    if (existing) {
      return c.json({ error: '이미 지원한 캠페인입니다' }, 400);
    }
    
    // Check if influencer has required channel
    const profile = await env.DB.prepare(
      'SELECT instagram_handle, blog_url, youtube_channel, tiktok_handle FROM influencer_profiles WHERE user_id = ?'
    ).bind(user.userId).first() as any;
    
    if (profile && campaign.channel_type) {
      const channelNames: { [key: string]: string } = {
        'instagram': '인스타그램',
        'blog': '블로그',
        'youtube': '유튜브',
        'tiktok': '틱톡'
      };
      
      const hasRequiredChannel = () => {
        switch(campaign.channel_type) {
          case 'instagram':
            return profile.instagram_handle;
          case 'blog':
            return profile.blog_url;
          case 'youtube':
            return profile.youtube_channel;
          case 'tiktok':
            return profile.tiktok_handle;
          case 'smartstore':
            return true; // 스마트스토어는 모든 인플루언서 지원 가능
          default:
            return true;
        }
      };
      
      if (!hasRequiredChannel()) {
        const channelName = channelNames[campaign.channel_type] || campaign.channel_type;
        return c.json({ error: `이 캠페인은 ${channelName} 채널이 필요합니다. 프로필에서 ${channelName} 채널을 먼저 등록해주세요.` }, 400);
      }
    }
    
    // Validate required personal information
    if (!real_name || !birth_date || !gender || !contact_phone) {
      return c.json({ error: '개인 정보를 모두 입력해주세요' }, 400);
    }
    
    // Validate required consents
    if (!portrait_rights_consent || !personal_info_consent || !content_usage_consent) {
      return c.json({ error: '모든 필수 동의 항목에 동의해주세요' }, 400);
    }
    
    // Validate required shipping information
    if (!shipping_recipient || !shipping_phone || !shipping_zipcode || !shipping_address) {
      return c.json({ error: '배송 정보를 모두 입력해주세요' }, 400);
    }
    
    // Create application with all information
    await env.DB.prepare(
      `INSERT INTO applications (
        campaign_id, influencer_id, message, 
        real_name, birth_date, gender, contact_phone,
        portrait_rights_consent, personal_info_consent, content_usage_consent,
        shipping_recipient, shipping_phone, shipping_zipcode, shipping_address, shipping_detail,
        applied_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      campaignId, 
      user.userId, 
      message || null,
      real_name,
      birth_date,
      gender,
      contact_phone,
      portrait_rights_consent ? 1 : 0,
      personal_info_consent ? 1 : 0,
      content_usage_consent ? 1 : 0,
      shipping_recipient,
      shipping_phone,
      shipping_zipcode,
      shipping_address,
      shipping_detail || null,
      getCurrentDateTime()
    ).run();
    
    // 첫 지원자가 생기면 캠페인 환불 불가 처리
    await env.DB.prepare(
      'UPDATE campaigns SET refundable = 0 WHERE id = ?'
    ).bind(campaignId).run();
    
    return c.json({ success: true, message: '캠페인에 지원되었습니다' }, 201);
  } catch (error) {
    console.error('Apply campaign error:', error);
    return c.json({ error: '지원 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 지원자 목록 조회 (광고주)
campaigns.get('/:id/applications', authMiddleware, async (c) => {
  try {
    const campaignId = c.req.param('id');
    const user = c.get('user');
    const { env } = c;
    
    // Check campaign ownership and application end date
    const campaign = await env.DB.prepare(
      'SELECT advertiser_id, status, application_end_date FROM campaigns WHERE id = ?'
    ).bind(campaignId).first();
    
    if (!campaign) {
      return c.json({ error: '캠페인을 찾을 수 없습니다' }, 404);
    }
    
    // 권한 체크: 관리자 또는 캠페인 소유자만
    if (user.role !== 'admin' && campaign.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // 모집 기간 체크: 광고주는 모집 기간이 끝난 후에만 지원자 조회 가능 (관리자는 언제든 가능)
    if (user.role !== 'admin') {
      const now = new Date();
      const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0]; // YYYY-MM-DD (한국 시간)
      if (campaign.application_end_date && koreaDate <= campaign.application_end_date) {
        return c.json({ error: '모집 기간이 종료된 후 지원자를 확인할 수 있습니다' }, 403);
      }
    }
    
    // Get applications with influencer info (채널 정보만 공개, 개인정보는 마스킹)
    const applications = await env.DB.prepare(
      `SELECT a.id, a.campaign_id, a.influencer_id, a.status, a.applied_at, a.reviewed_at,
              ip.instagram_handle, ip.youtube_channel, ip.blog_url, ip.tiktok_handle, 
              ip.follower_count, ip.category,
              a.shipping_recipient, a.shipping_phone, a.shipping_zipcode, 
              a.shipping_address, a.shipping_detail
       FROM applications a
       JOIN users u ON a.influencer_id = u.id
       LEFT JOIN influencer_profiles ip ON u.id = ip.user_id
       WHERE a.campaign_id = ?
       ORDER BY a.applied_at DESC`
    ).bind(campaignId).all();
    
    // 모든 개인정보 마스킹 처리 (배송 정보는 별도 API에서만 제공)
    const maskedApplications = applications.results.map((app: any) => ({
      ...app,
      // 배송 정보도 모두 마스킹 (별도 API로만 조회 가능)
      shipping_recipient: '***',
      shipping_phone: '***-****-****',
      shipping_zipcode: '*****',
      shipping_address: '***************',
      shipping_detail: '***',
      nickname: '익명' + app.id // 닉네임 익명 처리
    }));
    
    return c.json(maskedApplications);
  } catch (error) {
    console.error('Get applications error:', error);
    return c.json({ error: '지원자 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 선정된 지원자 배송 정보 조회 (광고주 전용)
campaigns.get('/:id/shipping-info', authMiddleware, requireRole('advertiser', 'agency', 'rep', 'admin'), async (c) => {
  try {
    const campaignId = c.req.param('id');
    const user = c.get('user');
    const { env } = c;
    
    // 캠페인 소유 권한 확인
    const campaign = await env.DB.prepare(
      'SELECT advertiser_id FROM campaigns WHERE id = ?'
    ).bind(campaignId).first() as { advertiser_id: number } | null;
    
    if (!campaign) {
      return c.json({ error: '캠페인을 찾을 수 없습니다' }, 404);
    }
    
    if (user.role !== 'admin' && campaign.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // 승인된 지원자들의 배송 정보만 조회 (채널 정보와 매칭 방지)
    const shippingInfo = await env.DB.prepare(
      `SELECT a.id as application_id,
              a.shipping_recipient, a.shipping_phone, 
              a.shipping_zipcode, a.shipping_address, a.shipping_detail
       FROM applications a
       WHERE a.campaign_id = ? AND a.status = 'approved'
       ORDER BY a.applied_at DESC`
    ).bind(campaignId).all();
    
    return c.json(shippingInfo.results);
  } catch (error) {
    console.error('Get shipping info error:', error);
    return c.json({ error: '배송 정보 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 내 캠페인의 모든 리뷰 조회 (광고주)
campaigns.get('/my/reviews', authMiddleware, requireRole('advertiser', 'agency', 'rep'), async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    console.log('[My Reviews] User:', user);
    console.log('[My Reviews] User ID:', user.userId);
    
    // 내 캠페인의 모든 리뷰 조회 (applications 테이블을 통해)
    const reviews = await env.DB.prepare(`
      SELECT 
        r.id,
        r.application_id,
        r.post_url,
        r.image_url as review_image,
        r.submitted_at,
        r.updated_at,
        r.approval_status,
        r.rejection_reason,
        r.reviewed_at,
        c.title as campaign_title,
        c.id as campaign_id,
        a.influencer_id,
        u.email as influencer_email,
        u.nickname as influencer_nickname
      FROM reviews r
      JOIN applications a ON r.application_id = a.id
      JOIN campaigns c ON a.campaign_id = c.id
      JOIN users u ON a.influencer_id = u.id
      WHERE c.advertiser_id = ?
      ORDER BY r.submitted_at DESC
    `).bind(user.userId).all();
    
    console.log('[My Reviews] Results count:', reviews.results?.length || 0);
    
    return c.json(reviews.results || []);
  } catch (error) {
    console.error('[My Reviews] Error:', error);
    console.error('[My Reviews] Error message:', (error as Error).message);
    console.error('[My Reviews] Error stack:', (error as Error).stack);
    return c.json({ 
      error: '리뷰 조회 중 오류가 발생했습니다',
      details: (error as Error).message 
    }, 500);
  }
});

export default campaigns;
