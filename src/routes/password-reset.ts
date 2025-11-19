// Password Reset Routes
import { Hono } from 'hono';
import { Resend } from 'resend';
import { hashPassword } from '../utils';

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY: string;
};

const passwordReset = new Hono<{ Bindings: Bindings }>();

// 비밀번호 재설정 요청
passwordReset.post('/request', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: '이메일을 입력해주세요' }, 400);
    }

    const { env } = c;
    
    // 사용자 확인
    const user = await env.DB.prepare('SELECT id, email, nickname FROM users WHERE email = ?')
      .bind(email).first();
    
    if (!user) {
      // 보안상 이유로 사용자가 없어도 성공 메시지 반환
      return c.json({ 
        success: true, 
        message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' 
      });
    }

    // 재설정 토큰 생성 (6자리 숫자)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30분 후 만료

    // 토큰 저장
    await env.DB.prepare(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      user.id,
      resetToken,
      expiresAt.toISOString(),
      new Date().toISOString()
    ).run();

    // 관리자에게 이메일 발송 (고객 정보 + 인증번호)
    const resend = new Resend(env.RESEND_API_KEY);
    
    try {
      await resend.emails.send({
        from: 'R.SPHERE <onboarding@resend.dev>',
        to: 'bensmee96@gmail.com',
        subject: '[R.SPHERE 관리자] 비밀번호 재설정 요청',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 2px solid #667eea; }
              .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
              .info-row:last-child { border-bottom: none; }
              .info-label { font-weight: bold; min-width: 120px; color: #666; }
              .info-value { color: #333; }
              .token { background: #667eea; color: white; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
              .alert { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 비밀번호 재설정 요청</h1>
              </div>
              <div class="content">
                <p><strong>새로운 비밀번호 재설정 요청이 접수되었습니다.</strong></p>
                
                <div class="info-box">
                  <div class="info-row">
                    <div class="info-label">요청자 이메일:</div>
                    <div class="info-value"><strong>${email}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">닉네임:</div>
                    <div class="info-value">${user.nickname}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">요청 시간:</div>
                    <div class="info-value">${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</div>
                  </div>
                </div>
                
                <p><strong>아래 인증번호를 고객에게 전달해주세요:</strong></p>
                <div class="token">${resetToken}</div>
                
                <div class="alert">
                  ⏰ <strong>유효시간:</strong> 30분<br>
                  📧 <strong>고객 이메일:</strong> ${email}<br>
                  💡 위 이메일로 인증번호를 직접 전달해주세요.
                </div>
              </div>
              <div class="footer">
                © ${new Date().getFullYear()} R.SPHERE Admin Panel
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      return c.json({ error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' }, 500);
    }

    return c.json({ 
      success: true, 
      message: '인증번호가 이메일로 전송되었습니다. 받으신 6자리 인증번호를 입력해주세요.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return c.json({ error: '비밀번호 재설정 요청 중 오류가 발생했습니다' }, 500);
  }
});

// 토큰 검증
passwordReset.post('/verify', async (c) => {
  try {
    const { email, token } = await c.req.json();
    
    if (!email || !token) {
      return c.json({ error: '이메일과 인증번호를 입력해주세요' }, 400);
    }

    const { env } = c;
    
    // 사용자 확인
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }

    // 토큰 확인
    const resetToken = await env.DB.prepare(`
      SELECT * FROM password_reset_tokens 
      WHERE user_id = ? AND token = ? AND used = 0
      ORDER BY created_at DESC LIMIT 1
    `).bind(user.id, token).first();

    if (!resetToken) {
      return c.json({ error: '유효하지 않은 인증번호입니다' }, 400);
    }

    // 만료 확인
    if (new Date(resetToken.expires_at) < new Date()) {
      return c.json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요.' }, 400);
    }

    return c.json({ 
      success: true, 
      message: '인증번호가 확인되었습니다.',
      resetTokenId: resetToken.id
    });
  } catch (error) {
    console.error('Token verify error:', error);
    return c.json({ error: '토큰 검증 중 오류가 발생했습니다' }, 500);
  }
});

// 비밀번호 변경
passwordReset.post('/change', async (c) => {
  try {
    const { email, token, newPassword } = await c.req.json();
    
    if (!email || !token || !newPassword) {
      return c.json({ error: '모든 필드를 입력해주세요' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: '비밀번호는 최소 6자 이상이어야 합니다' }, 400);
    }

    const { env } = c;
    
    // 사용자 확인
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email).first();
    
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
    }

    // 토큰 확인
    const resetToken = await env.DB.prepare(`
      SELECT * FROM password_reset_tokens 
      WHERE user_id = ? AND token = ? AND used = 0
      ORDER BY created_at DESC LIMIT 1
    `).bind(user.id, token).first();

    if (!resetToken) {
      return c.json({ error: '유효하지 않은 인증번호입니다' }, 400);
    }

    // 만료 확인
    if (new Date(resetToken.expires_at) < new Date()) {
      return c.json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요.' }, 400);
    }

    // 비밀번호 해시
    const hashedPassword = await hashPassword(newPassword);

    // 비밀번호 업데이트
    await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(hashedPassword, new Date().toISOString(), user.id).run();

    // 토큰 사용 처리
    await env.DB.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?')
      .bind(resetToken.id).run();

    return c.json({ 
      success: true, 
      message: '비밀번호가 성공적으로 변경되었습니다.' 
    });
  } catch (error) {
    console.error('Password change error:', error);
    return c.json({ error: '비밀번호 변경 중 오류가 발생했습니다' }, 500);
  }
});

export default passwordReset;
