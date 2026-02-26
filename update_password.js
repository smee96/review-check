// Cloudflare Workers 환경에서 사용하는 bcrypt 해시 생성
const password = 'jua090716!';

// bcrypt hash를 직접 생성하는 대신, API 엔드포인트를 사용
console.log('Password to update:', password);
console.log('Use API endpoint: POST /api/auth/reset-password or admin panel');
