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
    
    if (!['advertiser', 'agency', 'rep', 'influencer', 'admin'].includes(role)) {
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
    
    // Create user with initial points (5,000 points for new users)
    const initialPoints = 5000;
    const result = await env.DB.prepare(
      'INSERT INTO users (email, nickname, password_hash, role, sphere_points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(email, nickname, passwordHash, role, initialPoints, getCurrentDateTime(), getCurrentDateTime()).run();
    
    const userId = result.meta.last_row_id;
    
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
