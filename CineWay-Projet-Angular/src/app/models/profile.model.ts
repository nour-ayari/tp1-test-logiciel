export interface Profile {
  email: string;
  full_name: string;
  profile_picture_url?: string | null;
  dark_mode?: boolean;
  notifications_enabled?: boolean;
  newsletter_subscribed?: boolean;
  is_admin?:boolean;
}
