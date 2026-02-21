export interface User {
  id?: number;
  email: string;
  full_name: string;
  is_active?: boolean;
  is_admin?: boolean;
  created_at?: Date;
  updated_at?: Date;
  date_of_birth?: Date | null;
  profile_picture_url?: string | null;
  dark_mode?: boolean;
  notifications_enabled?: boolean;
  newsletter_subscribed?: boolean;
}
