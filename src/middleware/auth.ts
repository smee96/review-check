// Authentication Middleware

import { Context, Next } from 'hono';
import { verifyJWT } from '../utils';

export const authMiddleware = async (c: Context, next: Next) => {
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

export const requireRole = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // '본사' role은 항상 admin 권한과 동일하게 처리
    const userRole = user.role === '본사' ? 'admin' : user.role;
    
    // admin이 요구되는 경우, '본사'도 허용
    const allowedRoles = roles.map(role => role === 'admin' ? ['admin', '본사'] : [role]).flat();
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    await next();
  };
};
