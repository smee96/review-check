import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';

// Import routes
import auth from './routes/auth';
import campaigns from './routes/campaigns';
import applications from './routes/applications';
import profiles from './routes/profiles';
import admin from './routes/admin';
import notifications from './routes/notifications';
import settings from './routes/settings';

// Import utilities
import { verifyJWT } from './utils';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API routes
app.route('/api/auth', auth);
app.route('/api/campaigns', campaigns);
app.route('/api/applications', applications);
app.route('/api/profile', profiles);
app.route('/api/admin', admin);
app.route('/api/notifications', notifications);
app.route('/api/settings', settings);

// Frontend route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>R.SPHERE - 인플루언서 마케팅 플랫폼</title>
        <link rel="icon" type="image/png" href="/static/favicon.png">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <!-- Flatpickr CSS -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/material_blue.css">
        <style>
          /* Hide scrollbar for Chrome, Safari and Opera */
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          /* Hide scrollbar for IE, Edge and Firefox */
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          /* Line clamp utilities */
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          /* Flatpickr 모바일 최적화 - 연도/월 선택 크게 */
          .flatpickr-months {
            padding: 8px 0;
          }
          .flatpickr-current-month {
            font-size: 120%;
            padding: 8px 0;
            height: auto;
          }
          .flatpickr-current-month .flatpickr-monthDropdown-months {
            font-size: 16px;
            padding: 8px 12px;
            min-height: 44px;
            appearance: none;
            -webkit-appearance: none;
          }
          .numInputWrapper {
            width: 80px !important;
          }
          .numInputWrapper input.cur-year {
            font-size: 16px !important;
            padding: 8px 4px !important;
            min-height: 44px;
          }
          .flatpickr-months .flatpickr-month {
            height: auto;
          }
          .flatpickr-months .flatpickr-prev-month,
          .flatpickr-months .flatpickr-next-month {
            padding: 12px;
            height: 44px;
            width: 44px;
          }
          .flatpickr-months .flatpickr-prev-month svg,
          .flatpickr-months .flatpickr-next-month svg {
            width: 16px;
            height: 16px;
          }
          /* 날짜 선택 버튼 크기 조정 */
          .flatpickr-day {
            height: 44px;
            line-height: 44px;
            max-width: 44px;
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <!-- Flatpickr JS -->
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/ko.js"></script>
        <!-- Daum 우편번호 API -->
        <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
        <script src="/static/js/api.js?v=46"></script>
        <script src="/static/js/ui-utils.js?v=46"></script>
        <script src="/static/js/pricing-utils.js?v=46"></script>
        <script src="/static/js/app.js?v=60"></script>
    </body>
    </html>
  `);
});

// ============================================
// 포인트 출금 API
// ============================================

// 출금 신청
app.post('/api/withdrawal/request', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }

    const { amount, bank_name, account_number, account_holder } = await c.req.json();

    // 최소 출금 금액 확인
    if (amount < 50000) {
      return c.json({ error: '최소 출금 금액은 50,000 포인트입니다' }, 400);
    }

    // 사용자 포인트 확인
    const user = await c.env.DB.prepare('SELECT sphere_points FROM users WHERE id = ?')
      .bind(decoded.userId).first();
    
    if (!user || user.sphere_points < amount) {
      return c.json({ error: '출금 가능한 포인트가 부족합니다' }, 400);
    }

    // 세금 계산 (22% 원천징수)
    const tax_amount = Math.floor(amount * 0.22);
    const net_amount = amount - tax_amount;

    // 출금 신청 생성
    const result = await c.env.DB.prepare(`
      INSERT INTO withdrawal_requests 
      (user_id, amount, tax_amount, net_amount, bank_name, account_number, account_holder, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(decoded.userId, amount, tax_amount, net_amount, bank_name, account_number, account_holder).run();

    // 포인트 차감 (pending 상태로 예약)
    await c.env.DB.prepare('UPDATE users SET sphere_points = sphere_points - ? WHERE id = ?')
      .bind(amount, decoded.userId).run();

    return c.json({ 
      success: true, 
      message: '출금 신청이 완료되었습니다',
      withdrawal_id: result.meta.last_row_id,
      amount,
      tax_amount,
      net_amount
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    return c.json({ error: '출금 신청 중 오류가 발생했습니다' }, 500);
  }
});

// 출금 신청 내역 조회
app.get('/api/withdrawal/history', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    console.log('[Withdrawal History] User ID:', decoded.userId);
    
    const withdrawals = await c.env.DB.prepare(`
      SELECT * FROM withdrawal_requests 
      WHERE user_id = ? 
      ORDER BY id DESC
    `).bind(decoded.userId).all();

    console.log('[Withdrawal History] Results:', withdrawals.results?.length || 0);

    return c.json(withdrawals.results || []);
  } catch (error) {
    console.error('[Withdrawal History] Error:', error);
    console.error('[Withdrawal History] Error message:', (error as Error).message);
    console.error('[Withdrawal History] Error stack:', (error as Error).stack);
    return c.json({ 
      error: '출금 내역 조회 중 오류가 발생했습니다',
      details: (error as Error).message 
    }, 500);
  }
});

// 관리자: 출금 신청 목록 조회
app.get('/api/admin/withdrawals', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // 관리자 권한 확인
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?')
      .bind(decoded.userId).first();
    
    if (user?.role !== 'admin') {
      return c.json({ error: '관리자 권한이 필요합니다' }, 403);
    }

    const status = c.req.query('status') || 'all';
    let query = `
      SELECT w.*, u.email as user_email, u.nickname as user_nickname 
      FROM withdrawal_requests w
      JOIN users u ON w.user_id = u.id
    `;
    
    if (status !== 'all') {
      query += ` WHERE w.status = ?`;
    }
    
    query += ` ORDER BY w.created_at DESC`;

    const withdrawals = status !== 'all'
      ? await c.env.DB.prepare(query).bind(status).all()
      : await c.env.DB.prepare(query).all();

    return c.json(withdrawals.results || []);
  } catch (error) {
    console.error('Admin withdrawals error:', error);
    return c.json({ error: '출금 신청 목록 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 관리자: 출금 승인/거부
app.post('/api/admin/withdrawal/:id/process', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // 관리자 권한 확인
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?')
      .bind(decoded.userId).first();
    
    if (user?.role !== 'admin') {
      return c.json({ error: '관리자 권한이 필요합니다' }, 403);
    }

    const withdrawalId = c.req.param('id');
    const { status, admin_memo } = await c.req.json(); // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ error: '잘못된 상태 값입니다' }, 400);
    }

    // 출금 신청 정보 조회
    const withdrawal = await c.env.DB.prepare('SELECT * FROM withdrawal_requests WHERE id = ?')
      .bind(withdrawalId).first();

    if (!withdrawal) {
      return c.json({ error: '출금 신청을 찾을 수 없습니다' }, 404);
    }

    if (withdrawal.status !== 'pending') {
      return c.json({ error: '이미 처리된 출금 신청입니다' }, 400);
    }

    // 거부 시 포인트 복구
    if (status === 'rejected') {
      await c.env.DB.prepare('UPDATE users SET sphere_points = sphere_points + ? WHERE id = ?')
        .bind(withdrawal.amount, withdrawal.user_id).run();
    }

    // 출금 신청 상태 업데이트
    await c.env.DB.prepare(`
      UPDATE withdrawal_requests 
      SET status = ?, admin_memo = ?, processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, admin_memo || null, withdrawalId).run();

    return c.json({ 
      success: true, 
      message: status === 'approved' ? '출금이 승인되었습니다' : '출금이 거부되었습니다'
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    return c.json({ error: '출금 처리 중 오류가 발생했습니다' }, 500);
  }
});

// 출금 승인 (RESTful)
app.put('/api/admin/withdrawals/:id/approve', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // 관리자 권한 확인
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?')
      .bind(decoded.userId).first();
    
    if (user?.role !== 'admin') {
      return c.json({ error: '관리자 권한이 필요합니다' }, 403);
    }

    const withdrawalId = c.req.param('id');
    const { memo } = await c.req.json();

    // 출금 신청 정보 조회
    const withdrawal = await c.env.DB.prepare('SELECT * FROM withdrawal_requests WHERE id = ?')
      .bind(withdrawalId).first();

    if (!withdrawal) {
      return c.json({ error: '출금 신청을 찾을 수 없습니다' }, 404);
    }

    if (withdrawal.status !== 'pending') {
      return c.json({ error: '이미 처리된 출금 신청입니다' }, 400);
    }

    // 출금 신청 승인 처리
    await c.env.DB.prepare(`
      UPDATE withdrawal_requests 
      SET status = 'approved', admin_memo = ?, processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(memo || null, withdrawalId).run();

    return c.json({ 
      success: true, 
      message: '출금이 승인되었습니다'
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    return c.json({ error: '출금 승인 중 오류가 발생했습니다' }, 500);
  }
});

// 출금 거절 (RESTful)
app.put('/api/admin/withdrawals/:id/reject', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }
    
    // 관리자 권한 확인
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?')
      .bind(decoded.userId).first();
    
    if (user?.role !== 'admin') {
      return c.json({ error: '관리자 권한이 필요합니다' }, 403);
    }

    const withdrawalId = c.req.param('id');
    const { memo } = await c.req.json();

    if (!memo) {
      return c.json({ error: '거절 사유를 입력해주세요' }, 400);
    }

    // 출금 신청 정보 조회
    const withdrawal = await c.env.DB.prepare('SELECT * FROM withdrawal_requests WHERE id = ?')
      .bind(withdrawalId).first();

    if (!withdrawal) {
      return c.json({ error: '출금 신청을 찾을 수 없습니다' }, 404);
    }

    if (withdrawal.status !== 'pending') {
      return c.json({ error: '이미 처리된 출금 신청입니다' }, 400);
    }

    // 포인트 복구
    await c.env.DB.prepare('UPDATE users SET sphere_points = sphere_points + ? WHERE id = ?')
      .bind(withdrawal.amount, withdrawal.user_id).run();

    // 출금 신청 거절 처리
    await c.env.DB.prepare(`
      UPDATE withdrawal_requests 
      SET status = 'rejected', admin_memo = ?, processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(memo, withdrawalId).run();

    return c.json({ 
      success: true, 
      message: '출금이 거절되었습니다'
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    return c.json({ error: '출금 거절 중 오류가 발생했습니다' }, 500);
  }
});

// 리뷰 승인 (광고주)
app.put('/api/reviews/:id/approve', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }

    const reviewId = c.req.param('id');

    // 리뷰 정보 조회 및 권한 확인 (applications 테이블을 통해)
    const review = await c.env.DB.prepare(`
      SELECT r.*, c.advertiser_id 
      FROM reviews r
      JOIN applications a ON r.application_id = a.id
      JOIN campaigns c ON a.campaign_id = c.id
      WHERE r.id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: '리뷰를 찾을 수 없습니다' }, 404);
    }

    // 광고주 본인의 캠페인 리뷰인지 확인
    if (review.advertiser_id !== decoded.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }

    // 리뷰 승인 처리 - updated_at 업데이트
    await c.env.DB.prepare(`
      UPDATE reviews 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(reviewId).run();

    return c.json({ 
      success: true, 
      message: '리뷰가 승인되었습니다'
    });
  } catch (error) {
    console.error('Approve review error:', error);
    return c.json({ error: '리뷰 승인 중 오류가 발생했습니다' }, 500);
  }
});

// 리뷰 거절 (광고주)
app.put('/api/reviews/:id/reject', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }

    const reviewId = c.req.param('id');
    const { reason } = await c.req.json();

    if (!reason) {
      return c.json({ error: '거절 사유를 입력해주세요' }, 400);
    }

    // 리뷰 정보 조회 및 권한 확인 (applications 테이블을 통해)
    const review = await c.env.DB.prepare(`
      SELECT r.*, c.advertiser_id 
      FROM reviews r
      JOIN applications a ON r.application_id = a.id
      JOIN campaigns c ON a.campaign_id = c.id
      WHERE r.id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: '리뷰를 찾을 수 없습니다' }, 404);
    }

    // 광고주 본인의 캠페인 리뷰인지 확인
    if (review.advertiser_id !== decoded.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }

    // 리뷰 삭제 처리 (거절 사유는 로그에만 기록)
    console.log(`Review ${reviewId} rejected by user ${decoded.userId}. Reason: ${reason}`);
    
    await c.env.DB.prepare(`
      DELETE FROM reviews WHERE id = ?
    `).bind(reviewId).run();

    return c.json({ 
      success: true, 
      message: '리뷰가 거절되었습니다'
    });
  } catch (error) {
    console.error('Reject review error:', error);
    return c.json({ error: '리뷰 거절 중 오류가 발생했습니다' }, 500);
  }
});

export default app;
