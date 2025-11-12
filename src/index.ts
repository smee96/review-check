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
        <script src="/static/js/api.js?v=30"></script>
        <script src="/static/js/ui-utils.js?v=30"></script>
        <script src="/static/js/app.js?v=30"></script>
    </body>
    </html>
  `);
});

export default app;
