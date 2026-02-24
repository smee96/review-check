// Profile Routes (광고주 & 인플루언서)

import { Hono } from 'hono';
import { getCurrentDateTime } from '../utils';
import { authMiddleware, requireRole } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  user: any;
};

const profiles = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require authentication
profiles.use('*', authMiddleware);

// 인플루언서 프로필 조회
profiles.get('/influencer', requireRole('influencer'), async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    console.log('[Profile GET] Starting profile fetch for user:', user.userId);
    
    let profile = await env.DB.prepare(
      'SELECT * FROM influencer_profiles WHERE user_id = ?'
    ).bind(user.userId).first();
    
    console.log('[Profile GET] Profile query result:', profile ? 'Found' : 'Not found');
    
    // 프로필이 없으면 자동 생성
    if (!profile) {
      console.log('[Profile GET] Creating new profile for user:', user.userId);
      try {
        await env.DB.prepare(
          `INSERT INTO influencer_profiles (
            user_id, created_at, updated_at
          ) VALUES (?, ?, ?)`
        ).bind(user.userId, getCurrentDateTime(), getCurrentDateTime()).run();
        
        console.log('[Profile GET] Profile created, fetching again');
        
        profile = await env.DB.prepare(
          'SELECT * FROM influencer_profiles WHERE user_id = ?'
        ).bind(user.userId).first();
        
        console.log('[Profile GET] Re-fetch result:', profile ? 'Found' : 'Still not found');
      } catch (insertError) {
        console.error('[Profile GET] Insert error:', insertError);
        throw insertError;
      }
    }
    
    // sphere_points 조회
    console.log('[Profile GET] Fetching sphere_points');
    const userData = await env.DB.prepare(
      'SELECT sphere_points FROM users WHERE id = ?'
    ).bind(user.userId).first() as { sphere_points: number } | null;
    
    console.log('[Profile GET] Sphere points:', userData?.sphere_points);
    
    const result = {
      ...(profile || {}),
      sphere_points: userData?.sphere_points || 0
    };
    
    console.log('[Profile GET] Returning result');
    return c.json(result);
  } catch (error) {
    console.error('[Profile GET] Error:', error);
    console.error('[Profile GET] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({ 
      error: '프로필 조회 중 오류가 발생했습니다', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// 인플루언서 프로필 업데이트
profiles.put('/influencer', requireRole('influencer'), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const { 
      // 개인 정보
      real_name, birth_date, gender, contact_phone,
      // 채널 정보
      instagram_handle, youtube_channel, blog_url, tiktok_handle, 
      follower_count, category,
      // 정산 정보
      account_holder_name, bank_name, account_number, business_number,
      // 배송 정보
      shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
      // 동의 정보
      portrait_rights_consent, personal_info_consent, content_usage_consent, third_party_provision_consent
    } = data;
    
    const { env } = c;
    
    // 프로필 존재 확인
    const existingProfile = await env.DB.prepare(
      'SELECT user_id FROM influencer_profiles WHERE user_id = ?'
    ).bind(user.userId).first();
    
    if (!existingProfile) {
      // 프로필이 없으면 INSERT
      await env.DB.prepare(
        `INSERT INTO influencer_profiles (
          user_id, real_name, birth_date, gender, contact_phone,
          instagram_handle, youtube_channel, blog_url, tiktok_handle,
          follower_count, category,
          account_holder_name, bank_name, account_number, business_number,
          shipping_name, shipping_phone, shipping_postal_code, 
          shipping_address, shipping_address_detail,
          portrait_rights_consent, personal_info_consent, 
          content_usage_consent, third_party_provision_consent,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        user.userId,
        real_name || null,
        birth_date || null,
        gender || null,
        contact_phone || null,
        instagram_handle || null,
        youtube_channel || null,
        blog_url || null,
        tiktok_handle || null,
        follower_count || 0,
        category || null,
        account_holder_name || null,
        bank_name || null,
        account_number || null,
        business_number || null,
        shipping_name || null,
        shipping_phone || null,
        shipping_postal_code || null,
        shipping_address || null,
        shipping_address_detail || null,
        portrait_rights_consent ? 1 : 0,
        personal_info_consent ? 1 : 0,
        content_usage_consent ? 1 : 0,
        third_party_provision_consent ? 1 : 0,
        getCurrentDateTime(),
        getCurrentDateTime()
      ).run();
    } else {
      // 프로필이 있으면 UPDATE
      await env.DB.prepare(
        `UPDATE influencer_profiles 
         SET real_name = ?, birth_date = ?, gender = ?, contact_phone = ?,
             instagram_handle = ?, youtube_channel = ?, blog_url = ?, tiktok_handle = ?,
             follower_count = ?, category = ?,
             account_holder_name = ?, bank_name = ?, account_number = ?, 
             business_number = ?,
             shipping_name = ?, shipping_phone = ?, shipping_postal_code = ?, 
             shipping_address = ?, shipping_address_detail = ?,
             portrait_rights_consent = ?, personal_info_consent = ?, 
             content_usage_consent = ?, third_party_provision_consent = ?,
             updated_at = ?
         WHERE user_id = ?`
      ).bind(
        real_name || null,
        birth_date || null,
        gender || null,
        contact_phone || null,
        instagram_handle || null,
        youtube_channel || null,
        blog_url || null,
        tiktok_handle || null,
        follower_count || 0,
        category || null,
        account_holder_name || null,
        bank_name || null,
        account_number || null,
        business_number || null,
        shipping_name || null,
        shipping_phone || null,
        shipping_postal_code || null,
        shipping_address || null,
        shipping_address_detail || null,
        portrait_rights_consent ? 1 : 0,
        personal_info_consent ? 1 : 0,
        content_usage_consent ? 1 : 0,
        third_party_provision_consent ? 1 : 0,
        getCurrentDateTime(),
        user.userId
      ).run();
    }
    
    return c.json({ success: true, message: '프로필이 업데이트되었습니다' });
  } catch (error) {
    console.error('Update influencer profile error:', error);
    return c.json({ error: '프로필 업데이트 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// 광고주 프로필 조회 (광고주/대행사/렙사 공통)
profiles.get('/advertiser', requireRole('advertiser', 'agency', 'rep'), async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    const profile = await env.DB.prepare(
      'SELECT * FROM advertiser_profiles WHERE user_id = ?'
    ).bind(user.userId).first();
    
    return c.json(profile || {});
  } catch (error) {
    console.error('Get advertiser profile error:', error);
    return c.json({ error: '프로필 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 광고주 프로필 업데이트 (광고주/대행사/렙사 공통)
profiles.put('/advertiser', requireRole('advertiser', 'agency', 'rep'), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const { 
      company_name, business_number, representative_name, 
      business_address, contact_phone, contact_email
    } = data;
    
    const { env } = c;
    
    await env.DB.prepare(
      `UPDATE advertiser_profiles 
       SET company_name = ?, business_number = ?, representative_name = ?,
           business_address = ?, contact_phone = ?, contact_email = ?, updated_at = ?
       WHERE user_id = ?`
    ).bind(
      company_name || null,
      business_number || null,
      representative_name || null,
      business_address || null,
      contact_phone || null,
      contact_email || null,
      getCurrentDateTime(),
      user.userId
    ).run();
    
    return c.json({ success: true, message: '프로필이 업데이트되었습니다' });
  } catch (error) {
    console.error('Update advertiser profile error:', error);
    return c.json({ error: '프로필 업데이트 중 오류가 발생했습니다' }, 500);
  }
});

export default profiles;
