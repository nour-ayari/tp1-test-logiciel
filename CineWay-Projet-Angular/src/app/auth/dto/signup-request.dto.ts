export interface SignupRequestDto {
  email: string;
  full_name: string;
  password: string;
  date_of_birth?: Date;
  profile_picture_url?: string;
  newsletter_subscribed?: boolean;
}
