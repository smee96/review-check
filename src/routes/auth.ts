// Authentication Routes

import { Hono } from 'hono';
import type { User, RegisterRequest, LoginRequest, LoginResponse } from '../types';
import { 
  hashPassword, 
  verifyPassword, 
  signJWT, 
  isValidEmail,
  isValidPassword,
  getCurrentDateTime
} from '../utils';
import { authMiddleware } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  user: any;
};

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 회원가입
auth.post('/register', async (c) => {
  try {
    const { email, nickname, password, role, recaptchaToken } = await c.req.json<RegisterRequest>();
    
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
    
    if (!['advertiser', 'agency', 'rep', 'influencer', 'admin', '본사'].includes(role)) {
      return c.json({ error: '유효하지 않은 역할입니다' }, 400);
    }
    
    // 1️⃣ reCAPTCHA 검증
    if (recaptchaToken) {
      try {
        const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=6Ldt3nUsAAAAANQDPi3Yy_CAYeinwiKP3I9LauKa&response=${recaptchaToken}`
        });
        const recaptchaResult = await recaptchaResponse.json();
        
        if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
          return c.json({ error: '보안 검증에 실패했습니다. 다시 시도해주세요.' }, 400);
        }
      } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        // reCAPTCHA 오류 시 계속 진행 (서비스 중단 방지)
      }
    }
    
    // 2️⃣ 이메일 도메인 검증 (존재하지 않는 도메인 차단)
    const emailDomain = email.split('@')[1];
    const suspiciousDomains = ['hhhh.com', 'fydtr.com', 'test.com', 'example.com', 'temp-mail.org', 'guerrillamail.com'];
    if (suspiciousDomains.includes(emailDomain)) {
      return c.json({ error: '사용할 수 없는 이메일 도메인입니다' }, 400);
    }
    
    const { env } = c;
    
    // 3️⃣ IP 기반 가입 속도 제한 (1일 1회)
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentSignup = await env.DB.prepare(
      'SELECT id FROM users WHERE created_at > ? AND id IN (SELECT user_id FROM user_ips WHERE ip_address = ?)'
    ).bind(oneDayAgo, clientIP).first();
    
    if (recentSignup) {
      return c.json({ error: '하루에 한 번만 가입할 수 있습니다. 24시간 후 다시 시도해주세요.' }, 429);
    }
    
    // Check if email already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      return c.json({ error: '이미 존재하는 이메일입니다' }, 400);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user with initial points (5,000 points for new users)
    const initialPoints = 5000;
    const result = await env.DB.prepare(
      'INSERT INTO users (email, nickname, password_hash, role, sphere_points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(email, nickname, passwordHash, role, initialPoints, getCurrentDateTime(), getCurrentDateTime()).run();
    
    const userId = result.meta.last_row_id;
    
    // Save IP address for rate limiting (create table if not exists)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();
    
    await env.DB.prepare(
      'INSERT INTO user_ips (user_id, ip_address, created_at) VALUES (?, ?, ?)'
    ).bind(userId, clientIP, getCurrentDateTime()).run();
    
    // Create profile based on role
    if (role === 'advertiser' || role === 'agency' || role === 'rep') {
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
auth.post('/login', async (c) => {
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

// 현재 사용자 정보 조회
auth.get('/me', authMiddleware, async (c) => {
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

export default auth;
