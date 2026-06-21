export type UserRole = 'user' | 'creator' | 'admin'
export type DesignStatus = 'pending' | 'approved' | 'rejected'
export type DesignType = 'free' | 'premium'
export type FileType = 'cdr' | 'svg' | 'psd' | 'ai' | 'png' | 'jpg'
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'
export type PlanInterval = 'monthly' | 'yearly'
export type PlanTier = 'basic' | 'pro'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  bio: string | null
  bank_account: string | null
  bank_ifsc: string | null
  upi_id: string | null
  total_earnings: number
  total_withdrawn: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface Design {
  id: string
  creator_id: string
  title: string
  description: string | null
  category_id: string | null
  tags: string[]
  type: DesignType
  price: number | null
  status: DesignStatus
  downloads_count: number
  preview_url: string | null
  created_at: string
  updated_at: string
  creator?: Profile
  category?: Category
  files?: DesignFile[]
}

export interface DesignFile {
  id: string
  design_id: string
  file_type: FileType
  file_url: string
  file_size: number | null
  original_name: string | null
}

export interface SubscriptionPlan {
  id: string
  name: string
  tier: PlanTier
  interval: PlanInterval
  price: number
  features: string[]
  razorpay_plan_id: string | null
  is_active: boolean
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  razorpay_subscription_id: string | null
  current_period_start: string
  current_period_end: string
  plan?: SubscriptionPlan
}

export interface Purchase {
  id: string
  buyer_id: string
  design_id: string
  amount: number
  platform_fee: number
  creator_earning: number
  razorpay_payment_id: string | null
  created_at: string
  design?: Design
}

export interface Download {
  id: string
  user_id: string
  design_id: string
  download_type: 'free' | 'subscription' | 'purchase'
  created_at: string
  design?: Design
}

export interface Earning {
  id: string
  creator_id: string
  design_id: string | null
  amount: number
  type: 'purchase' | 'subscription_pool'
  settlement_month: string | null
  created_at: string
}

export interface Withdrawal {
  id: string
  creator_id: string
  amount: number
  status: WithdrawalStatus
  razorpay_payout_id: string | null
  requested_at: string
  completed_at: string | null
}

export interface MonthlySettlement {
  id: string
  month: string
  total_subscription_revenue: number
  platform_cut: number
  creator_pool: number
  total_downloads: number
  settled: boolean
  created_at: string
}
