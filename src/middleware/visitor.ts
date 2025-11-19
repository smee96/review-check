// Visitor tracking middleware
import { Context, Next } from 'hono';

export async function visitorLogger(c: Context, next: Next) {
  try {
    const { env } = c as any;
    
    // Get IP address
    const ip = c.req.header('cf-connecting-ip') || 
               c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    
    // Get user agent
    const userAgent = c.req.header('user-agent') || 'unknown';
    
    // Get user ID if authenticated
    const user = c.get('user');
    const userId = user?.userId || null;
    
    // Log visitor (don't wait for response)
    try {
      await env.DB.prepare(
        'INSERT INTO visitor_logs (user_id, ip_address, user_agent, visited_at) VALUES (?, ?, ?, ?)'
      ).bind(userId, ip, userAgent, new Date().toISOString()).run();
    } catch (e) {
      // Ignore errors if table doesn't exist yet
      console.log('Visitor log error (table may not exist):', e);
    }
  } catch (error) {
    console.error('Visitor logger error:', error);
  }
  
  await next();
}
