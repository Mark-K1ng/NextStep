// Romanian translations for NextStep app
// Every user-visible string is in Romanian, stored here for easy i18n

export const ro = {
  // App info
  appName: 'NextStep',
  tagline: 'Descoperă următorul tău pas.',

  // Onboarding (placeholder keys - actual copy to be added when building screens)
  onboarding1_title: 'Bine ai venit!',
  onboarding1_description: 'Află ce te pasionează și ce vizioni pentru viitor.',
  onboarding2_title: 'Explorează opțiuni',
  onboarding2_description: 'Găși licee, facultăti, cariere și cursuri care se potrivește profilului tău.',
  onboarding3_title: 'Construiește traseul tău',
  onboarding3_description: 'Planifică pașii către obiectivul tău și urmării progresul.',

  // Auth
  auth: {
    email: 'E-mail',
    password: 'Parolă',
    confirmPassword: 'Confirmă parola',
    gradeLevel: 'Nivel de clasă',
    favoriteSubjects: 'Materii preferate',
    interests: 'Interese',
    goal: 'Obiectiv',
    acceptTerms: 'Accept termenii și condițiile',
    register: 'Înregistrează-te',
    login: 'Conectare',
    forgotPassword: 'Ai uitat parola?',
    resetPassword: 'Resetează parola',
    sendResetLink: 'Trimite link de reseteare',
    verifyEmail: 'Verifică e-mailul',
    resendVerification: 'Trimite linkul de verificare din nou',
    verificationSent: 'Linkul de verificare a fost trimis. Verificaţi cutia poștală.',
    emailVerified: 'E-mailul a fost verificat cu succes!',
    verificationFailed: 'Verificarea e-mailului a eșuat. Încercați din nou.',
  },

  // Home
  home: {
    greeting: 'Bună, {name}!',
    currentGoal: 'Scopul tău curent: {goal}',
    nextStep: 'Următorul pas recomandat: {step}',
    explore: 'Explorează',
    myPath: 'Traseul meu',
    recommendations: 'Recomandări',
    profile: 'Profil',
  },

  // Explore
  explore: {
    sections: {
      schools: 'Licee',
      universities: 'Facultăți',
      careers: 'Cariere',
      courses: 'Cursuri',
    },
    search: 'Caută...',
    filters: {
      county: 'Judet',
      domain: 'Domeniu',
      level: 'Nivel',
    },
    sortBy: 'Sortează după',
    sortOptions: {
      relevance: 'Relevanță',
      nameAtoZ: 'Nume A-Z',
      nameZtoA: 'Nume Z-A',
    },
    noResults: 'Nu am găsit rezultate pentru filtrările selectate.',
  },

  // Detail screens
  detail: {
    description: 'Descriere',
    keyFacts: 'Facts cheie',
    relatedEntities: 'Entități relevante',
    source: 'Sursă',
    website: 'Website',
    admissionNotes: 'Note de admitere',
    duration: 'Durata',
    degreeLevel: 'Nivel de studii',
    importance: 'Importanță',
    depth: 'Adâncime',
    level: 'Nivel',
    provider: 'Furnizor',
    language: 'Limbă',
    isFree: 'Gratuit',
    url: 'Link',
  },

  // My Path
  myPath: {
    title: 'Traseul meu',
    currentLevel: 'Nivelul tău curent',
    goalCareer: 'Scopul carierei',
    path: 'Traseu',
    step: 'Pas',
    status: {
      notStarted: 'Nu a început',
      inProgress: 'În curs',
      completed: 'Completat',
    },
    edit: 'Editează',
    remove: 'Elimină',
  },

  // Gap analysis
  gapAnalysis: {
    title: 'Analiza deficienților',
    covered: 'Acoperit',
    partial: 'Parțial',
    missing: 'Lipsă',
    recommendedCourses: 'Cursuri recomandate',
    skillLevel: 'Nivel de abilitate',
    courseDepth: 'Adâncime curs',
    importance: 'Importanță',
    noGaps: 'Felicitări! Ai toate abilitățile necesare pentru acest scop.',
    noCourses: 'Nu am găsit cursuri pentru abilitățile lipsă.',
  },

  // Recommendations
  recommendations: {
    title: 'Recomandări',
    subtitle: 'Pe baza analizei deficienților',
    refresh: 'Actualizează',
    loading: 'Se încarcă recomandările...',
    empty: 'Nu există recomandări disponibile.',
  },

  // Profile
  profile: {
    title: 'Profil',
    editProfile: 'Editează profilul',
    displayName: 'Nume de afișaj',
    gradeLevel: 'Nivel de clasă',
    county: 'Judet',
    favoriteSubjects: 'Materii preferate',
    interests: 'Interese',
    goal: 'Obiectiv',
    language: 'Limba',
    theme: 'Temă',
    changePassword: 'Schimbă parola',
    privacyPolicy: 'Politica de confidențialitate',
    terms: 'Termeni și condiții',
    exportData: 'Exportă datele',
    deleteAccount: 'Șterge contul',
    signOut: 'Deconectare',
    confirmDelete: 'Sigur vrei să ștergi contul? Această acțiune nu poate fi anulată.',
    deleting: 'Se șterge contul...',
    deleteSuccess: 'Contul a fost șters cu succes.',
    exportSuccess: 'Datele au fost exportate și trimise pe e-mail.',
  },

  // Common
  common: {
    loading: 'Se încarcă...',
    retry: 'Încearcă din nou',
    error: 'A apărut o eroare',
    success: 'Succes',
    cancel: 'Anulează',
    save: 'Salvează',
    update: 'Actualizează',
    back: 'Înapoi',
    next: 'Următorul',
    skip: 'Sari',
    done: 'Gata',
    close: 'Închide',
    search: 'Caută',
    filter: 'Filtrează',
    clear: 'Goleste',
    selectAll: 'Selectează tot',
    deselectAll: 'Dezselectează tot',
    noItems: 'Nu există articole',
    showMore: 'Arată mai mult',
    showLess: 'Arată mai puțin',
  },

  // Validation
  validation: {
    required: 'Acest câmp este obligatoriu',
    emailInvalid: 'Introdu o adresă de e-mail validă',
    passwordMinLength: 'Parola trebuie să aibă cel puțin 10 caractere',
    passwordsDoNotMatch: 'Parolele nu coincid',
    gradeLevelRequired: 'Selectează nivelul de clasă',
  },

  // Settings
  settings: {
    title: 'Setări',
    appearance: 'Aspect',
    themeMode: 'Modul temei',
    themeOptions: {
      system: 'Sistem',
      light: 'Luminoasă',
      dark: 'Închisă',
    },
    language: 'Limba',
    // Language options will be added when we support multiple languages
  },

  // Errors
  errors: {
    networkError: 'Nu există conexiune la internet. Verificați rețea și încercați din nou.',
    serverError: 'A apărut o problemă pe server. Vă rugăm să încercați mai târziu.',
    unauthorized: 'Nu sunteți autorizaţi să efectuaţi această acţiune.',
    forbidden: 'Nu aveţi permisiunea pentru această acţiune.',
    notFound: 'Resursa cerută nu a fost găsită.',
    validationError: 'Datele introduse sunt invalide. Corectaţi erorile și încercaţi din nou.',
  },
};