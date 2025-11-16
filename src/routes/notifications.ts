// Notifications Routes

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  user: any;
};

const notifications = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require authentication
notifications.use('*', authMiddleware);

// 내 알림 조회
notifications.get('/', async (c) => {
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
notifications.put('/:id/read', async (c) => {
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

export default notifications;
