export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  stripe_customer_id: string | null;
  plan: 'free' | 'pro';
  plan_type: 'annual' | 'lifetime' | null;
  subscription_id: string | null;
  current_period_end: string | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
}
