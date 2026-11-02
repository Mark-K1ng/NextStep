export type TutorStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended';
export type ConnectStatus =
  'not_started' | 'onboarding' | 'pending' | 'active' | 'restricted';
export type BookingStatus =
  | 'pending_payment'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'refunded';
export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'requires_action'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled';
export type TutorSubject = { subject: string; price_minor: number };
export type Availability = {
  weekday: number;
  start_minute: number;
  end_minute: number;
};
export type Tutor = {
  id: string;
  display_name: string;
  biography: string;
  experience: string;
  qualifications: string;
  levels: string[];
  subjects: TutorSubject[];
  availability: Availability[];
  rating: number | null;
  review_count: number;
  completed_lessons: number;
  can_book: boolean;
};
export type TutorApplication = {
  id: string;
  display_name: string;
  biography: string;
  experience: string;
  qualifications: string;
  levels: string[];
  status: TutorStatus;
  commission_accepted: boolean;
  subjects: TutorSubject[];
  availability: Availability[];
  connect_status: ConnectStatus;
};
export type Lesson = {
  id: string;
  tutor_id: string;
  tutor_name: string;
  student_name: string;
  subject: string;
  starts_at: string;
  ends_at: string;
  amount_minor: number;
  platform_fee_minor: number;
  teacher_share_minor: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  classroom_url: string | null;
  classroom_status: string | null;
  reviewed: boolean;
};
export type TutorReview = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
};
