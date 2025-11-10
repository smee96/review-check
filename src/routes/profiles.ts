// Profile Routes (광고주 & 인플루언서)

import { Hono } from 'hono';
import { getCurrentDateTime } from '../utils';
import { authMiddleware, requireRole } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

const profiles = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
profiles.use('*', authMiddleware);

// 인플루언서 프로필 조회
profiles.get('/influencer', requireRole('influencer'), async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    const profile = await env.DB.prepare(
      'SELECT * FROM influencer_profiles WHERE user_id = ?'
    ).bind(user.userId).first();
    
    return c.json(profile || {});
  } catch (error) {
    console.error('Get influencer profile error:', error);
    return c.json({ error: '프로필 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 인플루언서 프로필 업데이트
profiles.put('/influencer', requireRole('influencer'), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const { 
      instagram_handle, youtube_channel, blog_url, tiktok_handle, 
      follower_count, category,
      account_holder_name, bank_name, account_number, business_number, contact_phone
    } = data;
    
    const { env } = c;
    
    await env.DB.prepare(
      `UPDATE influencer_profiles 
       SET instagram_handle = ?, youtube_channel = ?, blog_url = ?, tiktok_handle = ?,
           follower_count = ?, category = ?,
           account_holder_name = ?, bank_name = ?, account_number = ?, 
           business_number = ?, contact_phone = ?, updated_at = ?
       WHERE user_id = ?`
    ).bind(
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
      contact_phone || null,
      getCurrentDateTime(),
      user.userId
    ).run();
    
    return c.json({ success: true, message: '프로필이 업데이트되었습니다' });
  } catch (error) {
    console.error('Update influencer profile error:', error);
    return c.json({ error: '프로필 업데이트 중 오류가 발생했습니다' }, 500);
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
