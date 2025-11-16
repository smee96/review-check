// ReviewSphere Utility Functions

import type { JWTPayload } from './types';

// Password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

// JWT functions using Web Crypto API
const JWT_SECRET = 'reviewsphere-secret-key-change-in-production'; // TODO: Use environment variable

export async function signJWT(payload: JWTPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }));
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${message}.${encodedSignature}`;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    if (!token || typeof token !== 'string') {
      console.error('Invalid token: token is empty or not a string');
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token: JWT must have 3 parts');
      return null;
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message));
    
    if (!isValid) {
      console.error('Invalid token: signature verification failed');
      return null;
    }
    
    const payload = JSON.parse(atob(encodedPayload)) as JWTPayload;
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.error('Invalid token: token expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Generate random token for password reset
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password strength validation
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

// Get current datetime in ISO format
export function getCurrentDateTime(): string {
  return new Date().toISOString();
}

// 한국 시간대(KST, UTC+9) 관련 유틸리티 함수
export function getKSTDate(): Date {
  // 현재 UTC 시간에 9시간을 더해 한국 시간 생성
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
  return new Date(now.getTime() + kstOffset);
}

// 날짜 문자열(YYYY-MM-DD)을 한국 시간 기준 Date 객체로 변환
export function parseKSTDate(dateString: string): Date {
  // dateString은 "2025-11-17" 형식
  // 한국 시간 기준 00:00:00으로 파싱
  const [year, month, day] = dateString.split('-').map(Number);
  // UTC 시간으로 생성 후 9시간 빼기 (한국 시간 00:00:00이 UTC -9시간)
  return new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
}

// 한국 시간 기준으로 날짜 비교 (시간 무시, 날짜만)
export function isWithinKSTDateRange(startDateStr: string | null, endDateStr: string | null): {
  started: boolean;
  ended: boolean;
  message?: string;
} {
  const nowKST = getKSTDate();
  
  if (startDateStr) {
    const startDate = parseKSTDate(startDateStr);
    if (nowKST < startDate) {
      return { 
        started: false, 
        ended: false, 
        message: '기간이 아직 시작되지 않았습니다' 
      };
    }
  }
  
  if (endDateStr) {
    const endDate = parseKSTDate(endDateStr);
    // 종료일 23:59:59까지 허용
    endDate.setUTCHours(14, 59, 59, 999); // UTC 기준 14:59:59 = KST 23:59:59
    
    if (nowKST > endDate) {
      return { 
        started: true, 
        ended: true, 
        message: '기간이 종료되었습니다' 
      };
    }
  }
  
  return { started: true, ended: false };
}
