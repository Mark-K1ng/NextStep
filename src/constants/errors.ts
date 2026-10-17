/**
 * Error messages in Romanian
 */

export const ERROR_MESSAGES = {
  // Auth errors
  AUTH_EMAIL_REQUIRED: 'Email-ul este obligatoriu',
  AUTH_PASSWORD_REQUIRED: 'Parola este obligatorie',
  AUTH_PASSWORD_TOO_SHORT: 'Parola trebuie să aibă cel puțin 10 caractere',
  AUTH_EMAIL_INVALID: 'Email-ul nu este valid',
  AUTH_LOGIN_FAILED: 'Email sau parolă incorectă',
  AUTH_SIGNUP_FAILED: 'Nu s-a putut crea contul',
  AUTH_EMAIL_EXISTS: 'Există deja un cont cu acest email',
  AUTH_SESSION_EXPIRED: 'Sesiunea a expirat',
  AUTH_NOT_AUTHENTICATED: 'Nu ești conectat',
  
  // Profile errors
  PROFILE_LOAD_FAILED: 'Nu s-a putut încărca profilul',
  PROFILE_UPDATE_FAILED: 'Nu s-a putut actualiza profilul',
  PROFILE_DELETE_FAILED: 'Nu s-a putut șterge profilul',
  
  // Data errors
  DATA_LOAD_FAILED: 'Nu s-au putut încărca datele',
  DATA_SEARCH_FAILED: 'Căutarea a eșuat',
  DATA_NOT_FOUND: 'Nu s-au găsit rezultate',
  
  // Network errors
  NETWORK_OFFLINE: 'Nu există conexiune la internet',
  NETWORK_TIMEOUT: 'Conexiunea a expirat',
  NETWORK_ERROR: 'Eroare de rețea',
  
  // Generic errors
  UNKNOWN_ERROR: 'A apărut o eroare necunoscută',
  SOMETHING_WENT_WRONG: 'Ceva nu a mers bine. Încearcă din nou.',
} as const;

/**
 * Success messages in Romanian
 */
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profilul a fost actualizat cu succes',
  PASSWORD_CHANGED: 'Parola a fost schimbată cu succes',
  LOGGED_OUT: 'Te-ai deconectat cu succes',
  ACCOUNT_DELETED: 'Contul a fost șters cu succes',
} as const;
