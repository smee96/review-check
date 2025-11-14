// Applications & Reviews Routes

import { Hono } from 'hono';
import { getCurrentDateTime } from '../utils';
import { authMiddleware, requireRole } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

const applications = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
applications.use('*', authMiddleware);

// 내 지원 내역 조회 (인플루언서)
applications.get('/my', requireRole('influencer'), async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    const applications = await env.DB.prepare(
      `SELECT a.*, c.title as campaign_title, c.product_name, c.budget
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.influencer_id = ?
       ORDER BY a.applied_at DESC`
    ).bind(user.userId).all();
    
    return c.json(applications.results);
  } catch (error) {
    console.error('Get my applications error:', error);
    return c.json({ error: '지원 내역 조회 중 오류가 발생했습니다' }, 500);
  }
});

// 지원 취소 (인플루언서)
applications.delete('/:id', requireRole('influencer'), async (c) => {
  try {
    const applicationId = c.req.param('id');
    const user = c.get('user');
    const { env } = c;
    
    // Check if application exists and belongs to user
    const application = await env.DB.prepare(
      'SELECT * FROM applications WHERE id = ? AND influencer_id = ?'
    ).bind(applicationId, user.userId).first();
    
    if (!application) {
      return c.json({ error: '지원 내역을 찾을 수 없습니다' }, 404);
    }
    
    // Can only cancel pending applications
    if (application.status !== 'pending') {
      return c.json({ error: '대기중인 지원만 취소할 수 있습니다' }, 400);
    }
    
    // Delete application
    await env.DB.prepare(
      'DELETE FROM applications WHERE id = ?'
    ).bind(applicationId).run();
    
    return c.json({ success: true, message: '지원이 취소되었습니다' });
  } catch (error) {
    console.error('Cancel application error:', error);
    return c.json({ error: '지원 취소 중 오류가 발생했습니다' }, 500);
  }
});

// 지원자 확정/거절 (광고주/대행사/렙사)
applications.put('/:id/status', requireRole('advertiser', 'agency', 'rep', 'admin'), async (c) => {
  try {
    const applicationId = c.req.param('id');
    const user = c.get('user');
    const { status } = await c.req.json();
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return c.json({ error: '유효하지 않은 상태입니다' }, 400);
    }
    
    const { env } = c;
    
    // Check if user owns the campaign
    const application = await env.DB.prepare(
      `SELECT a.*, c.advertiser_id
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.id = ?`
    ).bind(applicationId).first();
    
    if (!application) {
      return c.json({ error: '지원 내역을 찾을 수 없습니다' }, 404);
    }
    
    if (user.role !== 'admin' && application.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // Update application status
    await env.DB.prepare(
      'UPDATE applications SET status = ?, reviewed_at = ? WHERE id = ?'
    ).bind(status, getCurrentDateTime(), applicationId).run();
    
    // Create notification for influencer (pending으로 되돌릴 때는 알림 안 보냄)
    if (status !== 'pending') {
      const message = status === 'approved' 
        ? '지원하신 캠페인이 확정되었습니다!' 
        : '지원하신 캠페인이 거절되었습니다.';
      
      await env.DB.prepare(
        'INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        application.influencer_id,
        '지원 결과 알림',
        message,
        'application_status',
        getCurrentDateTime()
      ).run();
    }
    
    return c.json({ success: true, message: '처리가 완료되었습니다' });
  } catch (error) {
    console.error('Update application status error:', error);
    return c.json({ error: '처리 중 오류가 발생했습니다' }, 500);
  }
});

// 리뷰 등록 (포스트 URL) (인플루언서)
applications.post('/:id/review', requireRole('influencer'), async (c) => {
  try {
    const applicationId = c.req.param('id');
    const user = c.get('user');
    const { post_url } = await c.req.json();
    
    if (!post_url) {
      return c.json({ error: '포스트 URL을 입력해주세요' }, 400);
    }
    
    const { env } = c;
    
    // First check if application exists
    const application = await env.DB.prepare(
      'SELECT * FROM applications WHERE id = ?'
    ).bind(applicationId).first();
    
    if (!application) {
      console.error(`Application not found: ${applicationId}`);
      return c.json({ error: '지원 내역을 찾을 수 없습니다' }, 404);
    }
    
    // Check if user owns the application
    if (application.influencer_id !== user.userId) {
      console.error(`User mismatch: ${user.userId} vs ${application.influencer_id}`);
      return c.json({ error: '본인의 지원 내역만 등록할 수 있습니다' }, 403);
    }
    
    // Check if it's approved
    if (application.status !== 'approved') {
      console.error(`Application status: ${application.status}`);
      return c.json({ error: `리뷰는 확정된 지원만 등록할 수 있습니다. (현재 상태: ${application.status === 'pending' ? '대기중' : application.status === 'rejected' ? '거절됨' : application.status})` }, 400);
    }
    
    // Check if review already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM reviews WHERE application_id = ?'
    ).bind(applicationId).first();
    
    if (existing) {
      return c.json({ error: '이미 리뷰가 등록되었습니다' }, 400);
    }
    
    // Create review
    await env.DB.prepare(
      'INSERT INTO reviews (application_id, post_url, submitted_at) VALUES (?, ?, ?)'
    ).bind(applicationId, post_url, getCurrentDateTime()).run();
    
    return c.json({ success: true, message: '리뷰가 등록되었습니다' }, 201);
  } catch (error) {
    console.error('Submit review error:', error);
    return c.json({ error: '리뷰 등록 중 오류가 발생했습니다' }, 500);
  }
});

export default applications;
