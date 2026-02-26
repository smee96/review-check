// Simple bcrypt hash generator using Web Crypto API
const password = 'jua090716!';

// bcrypt은 Cloudflare Workers에서 직접 사용 불가
// 대신 간단한 방법으로 직접 hash 생성
async function generateHash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_rounds_10');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Note: 이 방법은 bcrypt이 아닌 SHA-256입니다.
// 실제 bcrypt hash를 생성하려면 bcryptjs 패키지가 필요합니다.
console.log('Password:', password);
console.log('Note: Use bcryptjs for real bcrypt hash');
