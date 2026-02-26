// Public System Settings Routes
// 수수료율 조회는 모든 사용자가 가능해야 함

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const settings = new Hono<{ Bindings: Bindings }>();

// 시스템 설정 조회 (Public - 인증 불필요)
settings.get('/', async (c) => {
  try {
    const { env } = c;
    
    const settingsData = await env.DB.prepare(
      'SELECT * FROM system_settings ORDER BY setting_key'
    ).all();
    
    return c.json(settingsData.results);
  } catch (error) {
    console.error('Get system settings error:', error);
    return c.json({ error: '시스템 설정 조회 중 오류가 발생했습니다' }, 500);
  }
});

export default settings;
