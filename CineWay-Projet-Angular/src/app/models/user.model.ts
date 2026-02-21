export interface UserModel {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  date_of_birth?: string;
  profile_picture_url?: string;
  dark_mode: boolean;
  notifications_enabled: boolean;
  newsletter_subscribed: boolean;
}
