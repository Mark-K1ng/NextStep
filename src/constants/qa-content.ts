export const qaSections = [
  {
    title: 'Despre NextStep',
    questions: [
      {
        question: 'Cu ce mă ajută NextStep?',
        answer:
          'NextStep te ajută să explorezi opțiuni de studiu, cariere și cursuri. Poți salva ce te interesează, compara opțiuni și alege pașii pe care vrei să îi urmezi.',
      },
      {
        question: 'De ce contează clasa și județul meu?',
        answer:
          'Clasa ajută la adaptarea recomandărilor la etapa ta de studiu. Județul stabilește ce licee, universități și programe locale vezi. Le poți modifica din Profil, folosind Editează.',
      },
      {
        question: 'Informațiile despre admitere garantează un loc?',
        answer:
          'Nu. Mediile și locurile afișate descriu anul și etapa indicate, nu garantează admiterea viitoare. Verifică sursele și condițiile instituției înainte de a lua o decizie.',
      },
    ],
  },
  {
    title: 'Salvate și Traseu',
    questions: [
      {
        question: 'Care este diferența dintre Salvate și Traseu?',
        answer:
          'Salvate păstrează opțiunile care te interesează. Traseu conține pașii pe care îi alegi explicit. Salvarea unei opțiuni nu o adaugă automat în Traseu și nu îți schimbă obiectivul.',
      },
      {
        question: 'Cum aleg sau schimb un obiectiv?',
        answer:
          'Explorează carierele și deschide cariera care te interesează. Folosește acțiunea de alegere a obiectivului, care menționează numele carierei. Obiectivul ales apare în Traseu.',
      },
      {
        question: 'Cum îmi actualizez recomandările?',
        answer:
          'Poți modifica Preferințe și recomandări din Profil sau Preferințe din Traseu. Recomandările țin cont de datele tale, interese, opțiunile salvate și abilități. Chestionarul exprimă preferințe, nu este un test psihologic validat.',
      },
      {
        question: 'Ce reprezintă nivelul unei abilități?',
        answer:
          'Este autoevaluarea ta, nu o certificare. Deschide o abilitate din Explorează, alege nivelul care te descrie și salvează-l. Îl poți actualiza când înveți ceva nou.',
      },
    ],
  },
  {
    title: 'Chestionare și explorare',
    questions: [
      {
        question: 'Ce cuprind cele patru chestionare?',
        answer:
          'Interese și curiozități, Cum îmi place să lucrez, Abilități și încredere și Obiective și condiții practice. Sunt opționale și descriu preferințele și experiența ta. Nu măsoară aptitudini și nu sunt teste psihologice validate. Poți sări întrebări și relua răspunsurile din Preferințe și recomandări.',
      },
      {
        question: 'Ce fac activitățile și reflecțiile?',
        answer:
          'Activitățile te ajută să încerci o direcție înainte să o alegi. După activitate, poți nota cum ți s-a părut și dacă vrei să continui explorarea. Aceste reflecții sunt experiențe personale, nu note sau certificări. Modificarea preferințelor nu șterge pașii deja acceptați.',
      },
      {
        question: 'De ce sunt puține opțiuni în județul meu?',
        answer:
          'Catalogul local este în etapă pilot, cu accent pe Bihor. Acoperirea altor județe este limitată; lipsa unui rezultat nu înseamnă că instituția sau programul nu există. Verifică sursa și anul afișate pentru fiecare opțiune.',
      },
      {
        question: 'Pot folosi aplicația fără internet?',
        answer:
          'Ai nevoie de internet pentru autentificare, încărcarea catalogului și salvarea modificărilor. Unele pagini deja deschise pot rămâne vizibile în sesiunea curentă, dar nu sunt un catalog offline. Dacă apare o eroare, reconectează-te și folosește Reîncearcă. Verifică confirmarea înainte să consideri o modificare salvată.',
      },
      {
        question: 'Pot rezerva meditații acum?',
        answer:
          'Meditații este un program pilot. Rezervările și plățile nu sunt deschise în această versiune. Nu apar profesori fictivi; profilurile devin vizibile după aprobare. Ședințele deja înregistrate pot fi consultate separat.',
      },
      {
        question: 'Cum raportez o problemă?',
        answer:
          'Deschide Setări → Semnalează o problemă. Descrie ce ai făcut și ce nu a funcționat, apoi alege cum trimiți raportul. Versiunea aplicației și sistemul de operare sunt incluse automat; nu trimite parole sau date personale.',
      },
    ],
  },
  {
    title: 'Conturi de profesor',
    questions: [
      {
        question: 'Trebuie să completez un profil de elev pentru a preda?',
        answer:
          'Nu. La înscriere, alege Profesor. Contul de profesor trece prin verificarea cererii profesionale, fără clasa, interesele sau chestionarul unui elev. Funcțiile de predare se activează după aprobarea echipei.',
      },
      {
        question: 'Pot schimba un cont de elev în cont de profesor?',
        answer:
          'Conturile au tipuri fixe. Alegerea Profesor la autentificare nu transformă un cont de elev. Un profesor are nevoie de un cont de profesor și de aprobarea cererii sale.',
      },
      {
        question: 'Ce înseamnă perspectiva elevului pentru un profesor?',
        answer:
          'Profesorii aprobați pot previzualiza navigarea elevilor și explora conținutul public. Contul rămâne de profesor; previzualizarea nu creează un profil de elev, progres sau recomandări personale. Poți reveni la panoul profesorului din acțiunea afișată în previzualizare.',
      },
      {
        question:
          'Deschiderea formularului înseamnă că cererea a fost aprobată?',
        answer:
          'Nu. Deschiderea formularului, primirea răspunsului și aprobarea sunt etape separate. Starea cererii din aplicație reflectă înregistrarea și decizia echipei. Dacă formularul nu este încă disponibil, aplicația îți spune acest lucru.',
      },
    ],
  },
  {
    title: 'Personalizare',
    questions: [
      {
        question: 'Cum păstrez o paletă de culori?',
        answer:
          'Deschide Paletă de culori din Profil și alege culoarea dorită. Modificările se văd imediat, dar se păstrează numai după Salvează paleta. Dacă ieși fără să salvezi, revii la culoarea salvată.',
      },
      {
        question: 'Ce face resetarea paletei?',
        answer:
          'Resetează restaurează și salvează violetul original într-o singură acțiune. Confirmarea apare după salvare. Paleta este păstrată pe dispozitivul curent, inclusiv după deconectare.',
      },
    ],
  },
] as const;
