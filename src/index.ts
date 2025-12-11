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
import passwordReset from './routes/password-reset';

// Import utilities
import { verifyJWT } from './utils';

// Import middleware
import { visitorLogger } from './middleware/visitor';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  RESEND_API_KEY: string;
};

type Variables = {
  user: any;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Visitor logging middleware (모든 요청 추적)
app.use('*', visitorLogger);

// CORS middleware
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// SEO files
app.get('/robots.txt', (c) => {
  return c.text(`# robots.txt for 리뷰스피어 (ReviewSphere)

User-agent: *
Allow: /
Allow: /static/

# Disallow private pages
Disallow: /api/

# Sitemap
Sitemap: https://reviews-sphere.com/sitemap.xml

# Crawl-delay (optional)
Crawl-delay: 1`, 200, {
    'Content-Type': 'text/plain',
  });
});

app.get('/sitemap.xml', (c) => {
  return c.text(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://reviews-sphere.com/</loc>
    <lastmod>2025-11-24</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://reviews-sphere.com/#login</loc>
    <lastmod>2025-11-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://reviews-sphere.com/#register</loc>
    <lastmod>2025-11-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`, 200, {
    'Content-Type': 'application/xml',
  });
});

// R2 이미지 제공 API
app.get('/api/images/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    
    // R2에서 이미지 가져오기
    const object = await c.env.R2.get(filename);
    
    if (!object) {
      return c.notFound();
    }

    // 이미지를 응답으로 반환 (ETag 기반 캐싱)
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, must-revalidate', // 1시간 캐싱, ETag 재검증 필수
        'ETag': object.etag || '',
      }
    });
  } catch (error) {
    console.error('R2 image fetch error:', error);
    return c.json({ error: '이미지를 불러올 수 없습니다' }, 500);
  }
});

// API routes
app.route('/api/auth', auth);
app.route('/api/campaigns', campaigns);
app.route('/api/applications', applications);
app.route('/api/profile', profiles);
app.route('/api/admin', admin);
app.route('/api/notifications', notifications);
app.route('/api/settings', settings);
app.route('/api/password-reset', passwordReset);

// Frontend route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-PKDXL8PH');</script>
        <!-- End Google Tag Manager -->
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- SEO Meta Tags -->
        <title>리뷰스피어 - 인플루언서 리뷰 마케팅 플랫폼 | 블로그 리뷰, 인스타그램 리뷰, 유튜브 리뷰</title>
        <meta name="description" content="리뷰스피어는 광고주와 인플루언서를 연결하는 리뷰 마케팅 플랫폼입니다. 블로그 리뷰, 인스타그램 리뷰, 유튜브 리뷰, 스마트스토어 리뷰 등 다양한 채널에서 진짜 리뷰를 만나보세요. 신규 인플루언서도 환영합니다!">
        <meta name="keywords" content="리뷰스피어, 리뷰플랫폼, 인플루언서리뷰, 블로그리뷰, 인스타그램리뷰, 유튜브리뷰, 체험단, 리뷰마케팅, 인플루언서마케팅, 제품리뷰, 서비스리뷰, 광고주플랫폼, 인플루언서플랫폼, 협찬, 체험단모집, 리뷰어모집, 블로거체험단, 인스타체험단, 유튜버체험단, 스마트스토어리뷰, 쿠팡리뷰, 네이버쇼핑리뷰, 마케팅플랫폼, 바이럴마케팅, 입소문마케팅, SNS마케팅, 콘텐츠마케팅, 브랜드홍보, 제품홍보, 리뷰작성, 포인트적립, 현금출금, 초보인플루언서, 신규인플루언서, 팔로워적어도가능, 이웃적어도가능">
        <meta name="author" content="리뷰스피어">
        <meta name="robots" content="index, follow">
        <meta name="googlebot" content="index, follow">
        <link rel="canonical" href="https://reviews-sphere.com">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://reviews-sphere.com">
        <meta property="og:title" content="리뷰스피어 - 인플루언서 리뷰 마케팅 플랫폼">
        <meta property="og:description" content="광고주와 인플루언서를 연결하는 리뷰 마케팅 플랫폼. 블로그, 인스타그램, 유튜브 등 다양한 채널에서 진짜 리뷰를 만나보세요!">
        <meta property="og:image" content="https://reviews-sphere.com/static/logo.png">
        <meta property="og:locale" content="ko_KR">
        <meta property="og:site_name" content="리뷰스피어">
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="https://reviews-sphere.com">
        <meta name="twitter:title" content="리뷰스피어 - 인플루언서 리뷰 마케팅 플랫폼">
        <meta name="twitter:description" content="광고주와 인플루언서를 연결하는 리뷰 마케팅 플랫폼. 블로그, 인스타그램, 유튜브 등 다양한 채널에서 진짜 리뷰를 만나보세요!">
        <meta name="twitter:image" content="https://reviews-sphere.com/static/logo.png">
        
        <!-- Mobile App Meta -->
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="리뷰스피어">
        <meta name="application-name" content="리뷰스피어">
        <meta name="theme-color" content="#9333ea">
        
        <link rel="icon" type="image/png" href="/static/favicon.png">
        
        <!-- Google reCAPTCHA v3 -->
        <script src="https://www.google.com/recaptcha/api.js?render=6LfYorkqAAAAAMlA1wsensitSC9vHr-hcMEBTwwUDT"></script>
        
        <!-- Structured Data (JSON-LD) for Google -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "리뷰스피어",
          "alternateName": ["R.SPHERE", "ReviewSphere"],
          "url": "https://reviews-sphere.com",
          "description": "인플루언서 리뷰 마케팅 플랫폼",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://reviews-sphere.com/?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "리뷰스피어",
          "url": "https://reviews-sphere.com",
          "logo": "https://reviews-sphere.com/static/logo.png",
          "description": "광고주와 인플루언서를 연결하는 리뷰 마케팅 플랫폼",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "KR"
          }
        }
        </script>
        <link href="/static/css/tailwind.output.css" rel="stylesheet">
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
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PKDXL8PH"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
        
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <!-- Flatpickr JS -->
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/ko.js"></script>
        <!-- Daum 우편번호 API -->
        <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
        <script src="/static/js/api.js?v=96"></script>
        <script src="/static/js/ui-utils.js?v=96"></script>
        <script src="/static/js/pricing-utils.js?v=47"></script>
        <script src="/static/js/withdrawal-ui.js?v=1"></script>
        <script src="/static/js/password-reset.js?v=1"></script>
        <script src="/static/js/app.js?v=85"></script>
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

    const { 
      amount, 
      bank_name, 
      account_number, 
      account_holder, 
      contact_phone,
      real_name,
      resident_number_partial,
      id_card_image,
      bankbook_image
    } = await c.req.json();

    // 필수 필드 검증
    if (!real_name || !resident_number_partial || !id_card_image || !bankbook_image) {
      return c.json({ error: '필수 서류 정보가 누락되었습니다' }, 400);
    }

    // 최소 출금 금액 확인
    if (amount < 10000) {
      return c.json({ error: '최소 출금 금액은 10,000 포인트입니다' }, 400);
    }

    // 10,000 단위 확인
    if (amount % 10000 !== 0) {
      return c.json({ error: '출금 금액은 10,000 포인트 단위로 입력해주세요' }, 400);
    }

    // 사용자 포인트 확인
    const user = await c.env.DB.prepare('SELECT sphere_points FROM users WHERE id = ?')
      .bind(decoded.userId).first();
    
    if (!user || user.sphere_points < amount) {
      return c.json({ error: '출금 가능한 포인트가 부족합니다' }, 400);
    }

    // 세금 계산 (3.3% 원천징수: 소득세 3% + 지방소득세 0.3%)
    const tax_amount = Math.floor(amount * 0.033);
    const net_amount = amount - tax_amount;

    // 출금 신청 생성 (서류 정보 포함)
    const result = await c.env.DB.prepare(`
      INSERT INTO withdrawal_requests 
      (user_id, amount, tax_amount, net_amount, bank_name, account_number, account_holder, 
       contact_phone, real_name, resident_number_partial, id_card_image_url, bankbook_image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      decoded.userId, 
      amount, 
      tax_amount, 
      net_amount, 
      bank_name, 
      account_number, 
      account_holder, 
      contact_phone || null,
      real_name,
      resident_number_partial,
      id_card_image, // Base64 데이터 저장
      bankbook_image, // Base64 데이터 저장
    ).run();

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

// 출금 신청 상세 조회 (관리자)
app.get('/api/admin/withdrawals/:id', async (c) => {
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

    // 출금 신청 정보 조회 (사용자 정보 포함)
    const withdrawal = await c.env.DB.prepare(`
      SELECT 
        w.*,
        u.email as user_email,
        u.nickname as user_nickname
      FROM withdrawal_requests w
      JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `).bind(withdrawalId).first();

    if (!withdrawal) {
      return c.json({ error: '출금 신청을 찾을 수 없습니다' }, 404);
    }

    return c.json(withdrawal);
  } catch (error) {
    console.error('Get withdrawal error:', error);
    return c.json({ error: '출금 신청 조회 중 오류가 발생했습니다' }, 500);
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

    // 리뷰 승인 처리
    await c.env.DB.prepare(`
      UPDATE reviews 
      SET approval_status = 'approved',
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(decoded.userId, reviewId).run();

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

    if (!reason || reason.trim() === '') {
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

    // 리뷰 거절 처리 (삭제하지 않고 상태만 변경)
    await c.env.DB.prepare(`
      UPDATE reviews 
      SET approval_status = 'rejected',
          rejection_reason = ?,
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(reason, decoded.userId, reviewId).run();

    return c.json({ 
      success: true, 
      message: '리뷰가 거절되었습니다'
    });
  } catch (error) {
    console.error('Reject review error:', error);
    return c.json({ error: '리뷰 거절 중 오류가 발생했습니다' }, 500);
  }
});

// 리뷰 승인 취소 (광고주)
app.put('/api/reviews/:id/cancel-approval', async (c) => {
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

    // 리뷰 정보 조회 및 권한 확인
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

    // 승인 취소 처리 (대기 상태로 변경)
    await c.env.DB.prepare(`
      UPDATE reviews 
      SET approval_status = 'pending',
          rejection_reason = NULL,
          reviewed_by = NULL,
          reviewed_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(reviewId).run();

    return c.json({ 
      success: true, 
      message: '승인이 취소되었습니다'
    });
  } catch (error) {
    console.error('Cancel approval error:', error);
    return c.json({ error: '승인 취소 중 오류가 발생했습니다' }, 500);
  }
});

// 1:1 문의 이메일 전송
app.post('/api/contact/inquiry', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 401);
    }

    const { subject, message, reply_email } = await c.req.json();

    if (!subject || !message) {
      return c.json({ error: '제목과 내용을 입력해주세요' }, 400);
    }

    if (!reply_email) {
      return c.json({ error: '회신받을 이메일 주소를 입력해주세요' }, 400);
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reply_email)) {
      return c.json({ error: '올바른 이메일 주소를 입력해주세요' }, 400);
    }

    // 사용자 정보 조회
    const user = await c.env.DB.prepare(
      'SELECT email, nickname, role FROM users WHERE id = ?'
    ).bind(decoded.userId).first() as { email: string; nickname: string; role: string } | null;

    if (!user) {
      return c.json({ error: '사용자 정보를 찾을 수 없습니다' }, 404);
    }

    // Resend API로 이메일 전송
    const resendApiKey = c.env.RESEND_API_KEY;
    console.log('[Contact Inquiry] RESEND_API_KEY exists:', !!resendApiKey);
    
    if (!resendApiKey) {
      console.error('[Contact Inquiry] RESEND_API_KEY not configured');
      return c.json({ error: '이메일 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' }, 500);
    }

    const roleText = user.role === 'advertiser' ? '광고주' : 
                     user.role === 'agency' ? '대행사' :
                     user.role === 'rep' ? '렙사' :
                     user.role === 'influencer' ? '인플루언서' : '관리자';

    console.log('[Contact Inquiry] Sending email from:', user.email, 'subject:', subject);
    
    // Resend 기본 발신 주소 사용 (테스트 모드)
    // 인증된 수신자: bensmee96@gmail.com
    const fromEmail = 'onboarding@resend.dev';
    const toEmail = 'bensmee96@gmail.com';
    
    const emailPayload = {
      from: `ReviewSphere <${fromEmail}>`,
      to: [toEmail],
      reply_to: reply_email,
      subject: `[1:1 문의] ${subject}`,
      html: `
        <h2>리뷰스피어 1:1 문의</h2>
        <hr/>
        <p><strong>문의자:</strong> ${user.nickname} (${user.email})</p>
        <p><strong>회신 이메일:</strong> ${reply_email}</p>
        <p><strong>구분:</strong> ${roleText}</p>
        <p><strong>제목:</strong> ${subject}</p>
        <hr/>
        <h3>문의 내용:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr/>
        <p style="color: #666; font-size: 12px;">이 이메일은 리뷰스피어 1:1 문의 시스템에서 자동 발송되었습니다.</p>
        <p style="color: #666; font-size: 12px;">답장은 <strong>${reply_email}</strong>로 보내주세요.</p>
      `
    };
    
    console.log('[Contact Inquiry] Email payload:', JSON.stringify(emailPayload));
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    console.log('[Contact Inquiry] Resend API response status:', emailResponse.status);

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('[Contact Inquiry] Resend API error status:', emailResponse.status);
      console.error('[Contact Inquiry] Resend API error body:', errorText);
      
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.message || errorJson.error || errorText;
      } catch (e) {
        // JSON 파싱 실패시 원본 텍스트 사용
      }
      
      return c.json({ 
        error: '이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
        details: `Resend API Error (${emailResponse.status}): ${errorDetails}`
      }, 500);
    }

    const responseData = await emailResponse.json();
    console.log('[Contact Inquiry] Email sent successfully:', responseData);

    return c.json({ 
      success: true, 
      message: '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.' 
    });
  } catch (error) {
    console.error('Contact inquiry error:', error);
    return c.json({ error: '문의 접수 중 오류가 발생했습니다' }, 500);
  }
});

export default app;
