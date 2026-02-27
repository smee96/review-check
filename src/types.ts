// ReviewSphere Type Definitions

export type UserRole = 'advertiser' | 'agency' | 'rep' | 'influencer' | 'admin' | '본사';

export interface User {
  id: number;
  email: string;
  nickname: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AdvertiserProfile {
  id: number;
  user_id: number;
  company_name?: string;
  business_number?: string;
  representative_name?: string;
  business_address?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

export interface InfluencerProfile {
  id: number;
  user_id: number;
  instagram_handle?: string;
  youtube_channel?: string;
  blog_url?: string;
  tiktok_handle?: string;
  follower_count: number;
  category?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  business_number?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = 'pending' | 'recruiting' | 'in_progress' | 'suspended' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface Campaign {
  id: number;
  advertiser_id: number;
  title: string;
  description?: string;
  product_name?: string;
  product_url?: string;
  requirements?: string;
  budget?: number;
  slots: number;
  start_date?: string;
  end_date?: string;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  point_reward: number;
  application_start_date?: string;
  application_end_date?: string;
  announcement_date?: string;
  content_start_date?: string;
  content_end_date?: string;
  result_announcement_date?: string;
  provided_items?: string;
  mission?: string;
  keywords?: string;
  notes?: string;
  channel_type?: string;
  instagram_mention_account?: string;
  blog_product_url?: string;
  youtube_purchase_link?: string;
  thumbnail_image?: string;
  payment_status: PaymentStatus;
  refundable: number; // 1 = 환불 가능, 0 = 환불 불가
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Application {
  id: number;
  campaign_id: number;
  influencer_id: number;
  status: ApplicationStatus;
  message?: string;
  applied_at: string;
  reviewed_at?: string;
}

export interface Review {
  id: number;
  application_id: number;
  post_url: string;
  submitted_at: string;
}

export type SettlementStatus = 'pending' | 'completed';

export interface Settlement {
  id: number;
  application_id: number;
  amount: number;
  status: SettlementStatus;
  paid_at?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  exp?: number;
}

// Request/Response types
export interface RegisterRequest {
  email: string;
  nickname: string;
  password: string;
  role: UserRole;
  recaptchaToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    nickname: string;
    role: UserRole;
  };
}
