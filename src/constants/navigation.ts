/**
 * Navigation constants and route names
 */

/**
 * Route names
 */
export const ROUTES = {
  // Auth routes
  WELCOME: '/(auth)/screens/index',
  REGISTER: '/(auth)/screens/register',
  LOGIN: '/(auth)/screens/login',
  FORGOT_PASSWORD: '/(auth)/screens/forgot-password',
  RESET_PASSWORD: '/(auth)/screens/reset-password',
  VERIFY_EMAIL: '/(auth)/screens/verify-email',
  
  // Tab routes
  HOME: '/(tabs)',
  EXPLORE: '/(tabs)/explore',
  PATH: '/(tabs)/path',
  RECOMMENDATIONS: '/(tabs)/recommendations',
  PROFILE: '/(tabs)/profile',
} as const;

/**
 * Grade levels
 */
export const GRADE_LEVELS = [
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'student',
] as const;

/**
 * Counties (Romania)
 */
export const COUNTIES = [
  'București',
  'Alba',
  'Arad',
  'Argeș',
  'Bacău',
  'Bihor',
  'Bistrița-Năsăud',
  'Botoșani',
  'Brașov',
  'Brăila',
  'Buzău',
  'Caraș-Severin',
  'Călărași',
  'Cluj',
  'Constanța',
  'Covasna',
  'Dâmbovița',
  'Dolj',
  'Galați',
  'Gorj',
  'Harghita',
  'Hunedoara',
  'Ialomița',
  'Iași',
  'Ilfov',
  'Maramureș',
  'Mehedinți',
  'Mureș',
  'Neamț',
  'Olt',
  'Prahova',
  'Sălaj',
  'Satu Mare',
  'Sibiu',
  'Suceava',
  'Teleorman',
  'Timiș',
  'Tulcea',
  'Vaslui',
  'Vâlcea',
  'Vrancea',
] as const;
