export interface Member {
  id: string;
  name: string;
  phone: string;
  join_date: string;
  membership_start: string;
  membership_end: string;
  status?: string;
  fingerprint_user_id?: string;
  goal?: string;
  fitness_level?: string;
  last_reminder_type?: string;
  last_reminder_date?: string;
  renewal_reminder?: boolean;
  welcome_sent?: boolean;
  created_at: string;
}

export type MembershipStatus = 'Active' | 'Due' | 'Expired';
