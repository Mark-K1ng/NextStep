// Enable only after the corresponding live integration has been verified.
export const GOOGLE_AUTH_ENABLED =
  process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
export const APPLE_AUTH_ENABLED =
  process.env.EXPO_PUBLIC_APPLE_AUTH_ENABLED === 'true';
export const TUTORING_BOOKINGS_ENABLED =
  process.env.EXPO_PUBLIC_TUTORING_BOOKINGS_ENABLED === 'true';
