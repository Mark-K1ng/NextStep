import type {
  Availability,
  TutorStatus,
  BookingStatus,
  PaymentStatus,
} from '@/types/tutoring';

export const money = (minor: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(
    minor / 100
  );
export const lessonDate = (value: string) =>
  new Intl.DateTimeFormat('ro-RO', {
    timeZone: 'Europe/Bucharest',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
export const days = [
  'Duminică',
  'Luni',
  'Marți',
  'Miercuri',
  'Joi',
  'Vineri',
  'Sâmbătă',
];
export const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
export const availabilityLabel = (row: Availability) =>
  `${days[row.weekday]} · ${clock(row.start_minute)}–${clock(row.end_minute)}`;
export function parsePrice(value: string): number | null {
  if (!/^\d{1,4}([.,]\d{1,2})?$/.test(value.trim())) {
    return null;
  }
  const [whole, fraction = ''] = value.trim().replace(',', '.').split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return minor >= 1000 && minor <= 500000 ? minor : null;
}
export const applicationLabels: Record<TutorStatus, string> = {
  draft: 'Ciornă',
  submitted: 'Cererea ta este în curs de verificare.',
  under_review: 'Cererea ta este în curs de verificare.',
  approved: 'Profesor aprobat',
  rejected:
    'Cererea nu a fost aprobată. Poți actualiza și retrimite informațiile.',
  suspended: 'Profilul de profesor este suspendat.',
};
export const bookingLabels: Record<BookingStatus, string> = {
  pending_payment: 'Așteaptă plata',
  scheduled: 'Programată',
  completed: 'Finalizată',
  cancelled: 'Anulată',
  no_show: 'Neprezentare',
  refunded: 'Rambursată',
};
export const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: 'Neplătită',
  pending: 'Plată în curs',
  requires_action: 'Plata necesită confirmare',
  paid: 'Plătită',
  failed: 'Plată eșuată',
  refunded: 'Rambursată',
  partially_refunded: 'Rambursată parțial',
  cancelled: 'Plată anulată',
};
