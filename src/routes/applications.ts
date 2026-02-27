// Applications & Reviews Routes

import { Hono } from 'hono';
import { getCurrentDateTime } from '../utils';
import { authMiddleware, requireRole } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
};

type Variables = {
  user: any;
};

const applications = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// R2 이미지 가져오기 (공개 - 인증 불필요)
applications.get('/review-image/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const { env } = c;
    
    // Decode the key (it's URL encoded)
    const decodedKey = decodeURIComponent(key);
    
    const object = await env.R2.get(decodedKey);
    
    if (!object) {
      return c.json({ error: '이미지를 찾을 수 없습니다' }, 404);
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    console.error('Get review image error:', error);
    return c.json({ error: '이미지 로딩 중 오류가 발생했습니다' }, 500);
  }
});

// All routes below require authentication
applications.use('*', authMiddleware);

// 내 지원 내역 조회 (인플루언서)
applications.get('/my', requireRole('influencer'), async (c) => {
  try {
    const user = c.get('user');
    const { env } = c;
    
    const applications = await env.DB.prepare(
      `SELECT a.*, c.title as campaign_title, c.product_name, c.budget,
              c.application_end_date, c.announcement_date,
              r.post_url as review_url, r.image_url as review_image_url, r.submitted_at,
              r.approval_status as review_approval_status, r.rejection_reason, r.reviewed_at
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       LEFT JOIN reviews r ON a.id = r.application_id
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
    
    // Check if application exists and belongs to user, with campaign info
    const application = await env.DB.prepare(
      `SELECT a.*, c.application_end_date 
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.id = ? AND a.influencer_id = ?`
    ).bind(applicationId, user.userId).first();
    
    if (!application) {
      return c.json({ error: '지원 내역을 찾을 수 없습니다' }, 404);
    }
    
    // Can only cancel pending applications
    if (application.status !== 'pending') {
      return c.json({ error: '대기중인 지원만 취소할 수 있습니다' }, 400);
    }
    
    // Check if application period has ended (한국 시간 기준)
    if (application.application_end_date) {
      const { getKSTDate, parseKSTDate } = await import('../utils');
      
      const nowKST = getKSTDate();
      const endDate = parseKSTDate(application.application_end_date);
      endDate.setUTCHours(14, 59, 59, 999); // KST 23:59:59
      
      if (nowKST > endDate) {
        return c.json({ error: '지원 마감일이 지나 취소할 수 없습니다 (한국 시간 기준)' }, 400);
      }
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
      `SELECT a.*, c.advertiser_id, c.announcement_date
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.id = ?`
    ).bind(applicationId).first();
    
    if (!application) {
      return c.json({ error: '지원 내역을 찾을 수 없습니다' }, 404);
    }
    
    if (user.role !== 'admin' && user.role !== '본사' && application.advertiser_id !== user.userId) {
      return c.json({ error: '권한이 없습니다' }, 403);
    }
    
    // 선정 취소 제한: 선정일 이후는 취소 불가 (관리자는 예외)
    if (user.role !== 'admin' && user.role !== '본사' && status === 'pending' && application.status === 'approved') {
      if (application.announcement_date) {
        const now = new Date();
        const koreaDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
        if (application.announcement_date < koreaDate) {
          return c.json({ error: '선정 발표일 이후에는 선정을 취소할 수 없습니다' }, 403);
        }
      }
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

// 리뷰 등록 (포스트 URL + 이미지) (인플루언서)
applications.post('/:id/review', requireRole('influencer'), async (c) => {
  try {
    const applicationId = c.req.param('id');
    const user = c.get('user');
    const { post_url, image_data } = await c.req.json();
    
    // post_url or image_data is required
    if (!post_url && !image_data) {
      return c.json({ error: '게시물 링크 또는 리뷰 캡쳐 이미지를 입력해주세요' }, 400);
    }
    
    const { env } = c;
    
    // Get application with campaign info
    const application = await env.DB.prepare(
      `SELECT a.*, c.content_start_date, c.result_announcement_date 
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.id = ?`
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
      return c.json({ error: '이미 리뷰가 등록되었습니다. 수정하려면 수정 기능을 사용하세요.' }, 400);
    }
    
    // Check if within review submission period (content_start_date ~ result_announcement_date + 3일)
    // 한국 시간 기준으로 체크
    if (application.content_start_date && application.result_announcement_date) {
      const { getKSTDate, parseKSTDate } = await import('../utils');
      
      const nowKST = getKSTDate();
      const startDate = parseKSTDate(application.content_start_date);
      const announcementDate = parseKSTDate(application.result_announcement_date);
      
      // result_announcement_date + 3일, 23:59:59까지
      const endDate = new Date(announcementDate);
      endDate.setUTCDate(endDate.getUTCDate() + 3);
      endDate.setUTCHours(14, 59, 59, 999); // KST 23:59:59
      
      if (nowKST < startDate) {
        return c.json({ error: '리뷰 등록 기간이 아직 시작되지 않았습니다 (한국 시간 기준)' }, 400);
      }
      if (nowKST > endDate) {
        return c.json({ error: '리뷰 등록 기간이 종료되었습니다 (결과발표일 +3일까지, 한국 시간 기준)' }, 400);
      }
    }
    
    // Upload image to R2 if provided
    let imageUrl = null;
    if (image_data) {
      try {
        // Extract base64 data
        const base64Data = image_data.split(',')[1];
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const key = `reviews/${applicationId}-${timestamp}-${randomId}.jpg`;
        
        // Upload to R2
        await env.R2.put(key, imageBuffer, {
          httpMetadata: {
            contentType: 'image/jpeg'
          }
        });
        
        imageUrl = key;
      } catch (error) {
        console.error('R2 upload error:', error);
        return c.json({ error: '이미지 업로드에 실패했습니다' }, 500);
      }
    }
    
    // Create review
    await env.DB.prepare(
      'INSERT INTO reviews (application_id, post_url, image_url, submitted_at) VALUES (?, ?, ?, ?)'
    ).bind(applicationId, post_url || null, imageUrl, getCurrentDateTime()).run();
    
    return c.json({ success: true, message: '리뷰가 등록되었습니다' }, 201);
  } catch (error) {
    console.error('Submit review error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return c.json({ 
      error: '리뷰 등록 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 리뷰 수정 (포스트 URL + 이미지) (인플루언서)
applications.put('/:id/review', requireRole('influencer'), async (c) => {
  try {
    const applicationId = c.req.param('id');
    const user = c.get('user');
    const { post_url, image_data } = await c.req.json();
    
    const { env } = c;
    
    // Get application with campaign info
    const application = await env.DB.prepare(
      `SELECT a.*, c.content_start_date, c.result_announcement_date 
       FROM applications a
       JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.id = ?`
    ).bind(applicationId).first();
    
    if (!application) {
      return c.json({ error: '지원 내역을 찾을 수 없습니다' }, 404);
    }
    
    // Check ownership
    if (application.influencer_id !== user.userId) {
      return c.json({ error: '본인의 지원 내역만 수정할 수 있습니다' }, 403);
    }
    
    // Check if approved
    if (application.status !== 'approved') {
      return c.json({ error: '확정된 지원만 리뷰를 수정할 수 있습니다' }, 400);
    }
    
    // Check if review exists
    const existing = await env.DB.prepare(
      'SELECT * FROM reviews WHERE application_id = ?'
    ).bind(applicationId).first();
    
    if (!existing) {
      return c.json({ error: '등록된 리뷰가 없습니다' }, 404);
    }
    
    // 승인완료된 리뷰는 수정 불가
    if (existing.approval_status === 'approved') {
      return c.json({ error: '광고주가 승인한 리뷰는 수정할 수 없습니다' }, 403);
    }
    
    // Check if within review submission period (content_start_date ~ result_announcement_date + 3일)
    // 한국 시간 기준으로 체크
    if (application.content_start_date && application.result_announcement_date) {
      const { getKSTDate, parseKSTDate } = await import('../utils');
      
      const nowKST = getKSTDate();
      const startDate = parseKSTDate(application.content_start_date);
      const announcementDate = parseKSTDate(application.result_announcement_date);
      
      // result_announcement_date + 3일, 23:59:59까지
      const endDate = new Date(announcementDate);
      endDate.setUTCDate(endDate.getUTCDate() + 3);
      endDate.setUTCHours(14, 59, 59, 999); // KST 23:59:59
      
      if (nowKST < startDate) {
        return c.json({ error: '리뷰 등록 기간이 아직 시작되지 않았습니다 (한국 시간 기준)' }, 400);
      }
      if (nowKST > endDate) {
        return c.json({ error: '리뷰 등록 기간이 종료되어 수정할 수 없습니다 (결과발표일 +3일까지, 한국 시간 기준)' }, 400);
      }
    }
    
    // Check if at least one field is provided (post_url, image_data, or existing data)
    if (!post_url && !image_data && !existing.post_url && !existing.image_url) {
      return c.json({ error: '게시물 링크 또는 리뷰 캡쳐 이미지를 입력해주세요' }, 400);
    }
    
    // Handle image update
    let imageUrl = existing.image_url;
    if (image_data) {
      try {
        // Delete old image if exists
        if (existing.image_url) {
          await env.R2.delete(existing.image_url);
        }
        
        // Upload new image
        const base64Data = image_data.split(',')[1];
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const key = `reviews/${applicationId}-${timestamp}-${randomId}.jpg`;
        
        await env.R2.put(key, imageBuffer, {
          httpMetadata: {
            contentType: 'image/jpeg'
          }
        });
        
        imageUrl = key;
      } catch (error) {
        console.error('R2 upload error:', error);
        return c.json({ error: '이미지 업로드에 실패했습니다' }, 500);
      }
    }
    
    // Update review (ensure empty strings become null)
    const finalPostUrl = post_url && post_url.trim() ? post_url.trim() : null;
    const finalImageUrl = imageUrl || null;
    
    console.log('Updating review:', {
      applicationId,
      finalPostUrl,
      finalImageUrl,
      existingPostUrl: existing.post_url,
      existingImageUrl: existing.image_url
    });
    
    // 리뷰 수정 시 승인 상태 초기화 (거절된 리뷰를 수정하면 다시 검토 대기로)
    await env.DB.prepare(
      `UPDATE reviews 
       SET post_url = ?, 
           image_url = ?, 
           updated_at = ?,
           approval_status = 'pending',
           rejection_reason = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL
       WHERE application_id = ?`
    ).bind(finalPostUrl, finalImageUrl, getCurrentDateTime(), applicationId).run();
    
    return c.json({ 
      success: true, 
      message: existing.approval_status === 'rejected' 
        ? '리뷰가 수정되었습니다. 광고주의 재검토를 기다려주세요.' 
        : '리뷰가 수정되었습니다' 
    });
  } catch (error) {
    console.error('Update review error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return c.json({ 
      error: '리뷰 수정 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 베스트 리뷰 조회 (로그인 필수)
applications.get('/reviews/best', authMiddleware, async (c) => {
  try {
    const { env } = c;
    
    const reviews = await env.DB.prepare(
      `SELECT r.*, 
       c.title as campaign_title,
       c.thumbnail_image as campaign_thumbnail,
       u.nickname as influencer_nickname
       FROM reviews r
       JOIN applications a ON r.application_id = a.id
       JOIN campaigns c ON a.campaign_id = c.id
       JOIN users u ON a.influencer_id = u.id
       WHERE r.is_best = 1 AND r.approval_status = 'approved'
       ORDER BY r.updated_at DESC
       LIMIT 20`
    ).all();
    
    return c.json(reviews.results);
  } catch (error) {
    console.error('Get best reviews error:', error);
    return c.json({ error: '베스트 리뷰 조회 중 오류가 발생했습니다' }, 500);
  }
});

export default applications;
