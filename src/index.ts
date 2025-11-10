import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { 
  User, 
  RegisterRequest, 
  LoginRequest, 
  LoginResponse,
  Campaign,
  Application,
  InfluencerProfile,
  AdvertiserProfile
} from './types';
import { 
  hashPassword, 
  verifyPassword, 
  signJWT, 
  verifyJWT, 
  generateToken,
  isValidEmail,
  isValidPassword,
  getCurrentDateTime
} from './utils';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// ============================================
// Authentication Middleware
// ============================================
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '인증이 필요합니다' }, 401);
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token);
  
  if (!payload) {
    return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
  }
  
  c.set('user', payload);
  await next();
};

// ============================================
// Auth API
// ============================================

// 회원가입
app.post('/api/auth/register', async (c) => {
  try {
    const { email, nickname, password, role } = await c.req.json<RegisterRequest>();
    
    // Validation
    if (!email || !nickname || !password || !role) {
      return c.json({ error: '모든 필드를 입력해주세요' }, 400);
    }
    
    if (!isValidEmail(email)) {
      return c.json({ error: '유효한 이메일 주소를 입력해주세요' }, 400);
    }
    
    if (!isValidPassword(password)) {
      return c.json({ error: '비밀번호는 최소 8자 이상이어야 합니다' }, 400);
    }
    
    if (!['advertiser', 'influencer', 'admin'].includes(role)) {
      return c.json({ error: '유효하지 않은 역할입니다' }, 400);
    }
    
    const { env } = c;
    
    // Check if email already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      return c.json({ error: '이미 존재하는 이메일입니다' }, 400);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const result = await env.DB.prepare(
      'INSERT INTO users (email, nickname, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(email, nickname, passwordHash, role, getCurrentDateTime(), getCurrentDateTime()).run();
    
    const userId = result.meta.last_row_id;
    
    // Create profile based on role
    if (role === 'advertiser') {
      await env.DB.prepare(
        'INSERT INTO advertiser_profiles (user_id, created_at, updated_at) VALUES (?, ?, ?)'
      ).bind(userId, getCurrentDateTime(), getCurrentDateTime()).run();
    } else if (role === 'influencer') {
      await env.DB.prepare(
        'INSERT INTO influencer_profiles (user_id, follower_count, created_at, updated_at) VALUES (?, ?, ?, ?)'
      ).bind(userId, 0, getCurrentDateTime(), getCurrentDateTime()).run();
    }
    
    return c.json({ 
      success: true, 
      message: '회원가입이 완료되었습니다',
      userId 
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: '회원가입 중 오류가 발생했습니다' }, 500);
  }
});

// 로그인
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json<LoginRequest>();
    
    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요' }, 400);
    }
    
    const { env } = c;
    
    // Find user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first() as User | null;
    
    if (!user) {
      return c.json({ error: '이메일 또는 비밀번호가 잘못되었습니다' }, 401);
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return c.json({ error: '이메일 또는 비밀번호가 잘못되었습니다' }, 401);
    }
    
    // Generate JWT
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    const response: LoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      }
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: '로그인 중 오류가 발생했습니다' }, 500);
  }
});

// 비밀번호 재설정 요청
app.post('/api/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: '이메일을 입력해주세요' }, 400);
    }
    
    const { env } = c;
    
    // Find user
    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      // Don't reveal if email exists for security
      return c.json({ 
        success: true, 
        message: '비밀번호 재설정 링크가 이메일로 전송되었습니다' 
      });
    }
    
    // Generate reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    
    // Save token
    await env.DB.prepare(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)'
    ).bind(user.id, token, expiresAt, getCurrentDateTime()).run();
    
    // TODO: Send email with reset link using Resend
    // const resetLink = `https://m-spheres.pages.dev/reset-password?token=${token}`;
    
    return c.json({ 
      success: true, 
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다',
      // For development only - remove in production
      dev_token: token
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: '요청 처리 중 오류가 발생했습니다' }, 500);
  }
});

// 비밀번호 재설정
app.post('/api/auth/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();
    
    if (!token || !newPassword) {
      return c.json({ error: '토큰과 새 비밀번호를 입력해주세요' }, 400);
    }
    
    if (!isValidPassword(newPassword)) {
      return c.json({ error: '비밀번호는 최소 8자 이상이어야 합니다' }, 400);
    }
    
    const { env } = c;
    
    // Find valid token
    const resetToken = await env.DB.prepare(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?'
    ).bind(token, getCurrentDateTime()).first();
    
    if (!resetToken) {
      return c.json({ error: '유효하지 않거나 만료된 토큰입니다' }, 400);
    }
    
    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update password
    await env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).bind(passwordHash, getCurrentDateTime(), resetToken.user_id).run();
    
    // Mark token as used
    await env.DB.prepare(
      'UPDATE password_reset_tokens SET used = 1 WHERE id = ?'
    ).bind(resetToken.id).run();
    
    return c.json({ 
      success: true, 
      message: '비밀번호가 성공적으로 변경되었습니다' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: '비밀번호 재설정 중 오류가 발생했습니다' }, 500);
  }
});

// 현재 사용자 정보 조회
app.get('/api/auth/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    const dbUser = await env.DB.prepare(
      'SELECT id, email, nickname, role, created_at FROM users WHERE id = ?'
    ).bind(user.userId).first();
    
    if (!dbUser) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }
    
    return c.json(dbUser);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: '사용자 정보 조회 중 오류가 발생했습니다' }, 500);
  }
});

// ============================================
// Campaign API (광고주)
// ============================================

// 캠페인 등록
app.post('/api/campaigns', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'advertiser' && user.role !== 'admin') {
      return c.json({ error: '광고주만 캠페인을 등록할 수 있습니다' }, 403);
    }
    
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
app.get('/api/campaigns/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'advertiser' && user.role !== 'admin') {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
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

// 캠페인 상세 조회
app.get('/api/campaigns/:id', authMiddleware, async (c) => {
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
app.put('/api/campaigns/:id', authMiddleware, async (c) => {
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

// 캠페인 지원자 목록 조회 (광고주용 - 승인된 캠페인만)
app.get('/api/campaigns/:id/applications', authMiddleware, async (c) => {
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

// 지원자 확정/거절 (광고주)
app.put('/api/applications/:id/status', authMiddleware, async (c) => {
  try {
    const applicationId = c.req.param('id');
    const user = c.get('user');
    const { status } = await c.req.json();
    
    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ error: '유효하지 않은 상태입니다' }, 400);
    }
    
    const { env } = c;
    
    // Check if user owns the campaign
    const application = await env.DB.prepare(
      `SELECT a.*, c.advertiser_id
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.id = ?`
    ).bind(applicationId).first();
    
    if (!application) {
      return c.json({ error: '지원 내역을 찾을 수 없습니다' }, 404);
    }
    
    if (user.role !== 'admin' && application.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // Update application status
    await env.DB.prepare(
      'UPDATE applications SET status = ?, reviewed_at = ? WHERE id = ?'
    ).bind(status, getCurrentDateTime(), applicationId).run();
    
    // Create notification for influencer
    const message = status === 'approved' 
      ? '지원하신 캠페인이 확정되었습니다!' 
      : '지원하신 캠페인이 거절되었습니다.';
    
    await env.DB.prepare(
      'INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      application.influencer_id,
      '지원 결과 알림',
      message,
      'application_status',
      getCurrentDateTime()
    ).run();
    
    return c.json({ success: true, message: '처리가 완료되었습니다' });
  } catch (error) {
    console.error('Update application status error:', error);
    return c.json({ error: '처리 중 오류가 발생했습니다' }, 500);
  }
});

// ============================================
// Influencer API
// ============================================

// 승인된 캠페인 목록 조회 (인플루언서용)
app.get('/api/campaigns', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'influencer' && user.role !== 'admin') {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    const { env } = c;
    
    // Get approved campaigns only
    const campaigns = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC'
    ).bind('approved').all();
    
    return c.json(campaigns.results);
  } catch (error) {
    console.error('Get campaigns error:', error);
    return c.json({ error: '캠페인 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 캠페인 지원하기
app.post('/api/campaigns/:id/apply', authMiddleware, async (c) => {
  try {
    const campaignId = c.req.param('id');
    const user = c.get('user');
    
    if (user.role !== 'influencer') {
      return c.json({ error: '인플루언서만 지원할 수 있습니다' }, 403);
    }
    
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

// 내 지원 내역 조회
app.get('/api/applications/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'influencer') {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    const { env } = c;
    
    const applications = await env.DB.prepare(
      `SELECT a.*, c.title as campaign_title, c.product_name, c.budget
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.influencer_id = ?
       ORDER BY a.applied_at DESC`
    ).bind(user.userId).all();
    
    return c.json(applications.results);
  } catch (error) {
    console.error('Get my applications error:', error);
    return c.json({ error: '지원 내역 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 결과 등록 (포스트 URL)
app.post('/api/applications/:id/review', authMiddleware, async (c) => {
  try {
    const applicationId = c.req.param('id');
    const user = c.get('user');
    const { post_url } = await c.req.json();
    
    if (!post_url) {
      return c.json({ error: '포스트 URL을 입력해주세요' }, 400);
    }
    
    const { env } = c;
    
    // Check if user owns the application and it's approved
    const application = await env.DB.prepare(
      'SELECT * FROM applications WHERE id = ? AND influencer_id = ? AND status = ?'
    ).bind(applicationId, user.userId, 'approved').first();
    
    if (!application) {
      return c.json({ error: '확정된 지원 내역을 찾을 수 없습니다' }, 404);
    }
    
    // Check if review already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM reviews WHERE application_id = ?'
    ).bind(applicationId).first();
    
    if (existing) {
      return c.json({ error: '이미 결과가 등록되었습니다' }, 400);
    }
    
    // Create review
    await env.DB.prepare(
      'INSERT INTO reviews (application_id, post_url, submitted_at) VALUES (?, ?, ?)'
    ).bind(applicationId, post_url, getCurrentDateTime()).run();
    
    return c.json({ success: true, message: '결과가 등록되었습니다' }, 201);
  } catch (error) {
    console.error('Submit review error:', error);
    return c.json({ error: '결과 등록 중 오류가 발생했습니다' }, 500);
  }
});

// 인플루언서 프로필 조회
app.get('/api/profile/influencer', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'influencer') {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
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
app.put('/api/profile/influencer', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'influencer') {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
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

// 광고주 프로필 조회
app.get('/api/profile/advertiser', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'advertiser') {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
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

// 광고주 프로필 업데이트
app.put('/api/profile/advertiser', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'advertiser') {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
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

// ============================================
// Admin API
// ============================================

// 모든 캠페인 조회 (관리자)
app.get('/api/admin/campaigns', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: '관리자 권한이 필요합니다' }, 403);
    }
    
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

// 캠페인 상태 변경 (관리자)
app.put('/api/admin/campaigns/:id/status', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: '관리자 권한이 필요합니다' }, 403);
    }
    
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

// 정산 내역 조회 및 엑셀 다운로드용 데이터 (관리자)
app.get('/api/admin/settlements', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: '관리자 권한이 필요합니다' }, 403);
    }
    
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

// ============================================
// Notifications API
// ============================================

// 내 알림 조회
app.get('/api/notifications', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    const notifications = await env.DB.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(user.userId).all();
    
    return c.json(notifications.results);
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: '알림 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 알림 읽음 처리
app.put('/api/notifications/:id/read', authMiddleware, async (c) => {
  try {
    const notificationId = c.req.param('id');
    const user = c.get('user');
    const { env } = c;
    
    await env.DB.prepare(
      'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?'
    ).bind(notificationId, user.userId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return c.json({ error: '알림 처리 중 오류가 발생했습니다' }, 500);
  }
});

// ============================================
// Frontend Routes
// ============================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>M-Spheres - 인플루언서 마케팅 플랫폼</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

export default app;
