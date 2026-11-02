// Draft app notices based on current data flows. Requires legal review before release.
// Adapted from web/privacy.html and web/terms.html; no unverified contact addresses.
export const privacyContent = {
  updated: 'Actualizat la 2 noiembrie 2026',
  privacy: [
    {
      title: 'Datele contului tău',
      body: 'NextStep folosește adresa de email pentru autentificare și păstrează tipul contului: elev sau profesor. Profilul elevului cuprinde numele afișat, clasa, județul, sectorul pentru București, interesele și materiile preferate. Contul de profesor nu necesită aceste date de elev. Nu îți cerem adresa de domiciliu sau localizarea exactă.',
    },
    {
      title: 'Conturile și cererile profesorilor',
      body: 'Pentru verificarea profesorilor, aplicația păstrează codul cererii, starea, data primirii și decizia echipei. Informațiile profesionale publicate includ numele, prezentarea, materiile, tarifele și disponibilitatea. Când formularul extern este activat, răspunsurile și documentele transmise sunt gestionate separat în Google Forms și Drive, potrivit informării afișate în formular. Ștergerea contului din aplicație nu șterge automat aceste răspunsuri externe. Previzualizarea perspectivei elevului nu creează un profil de elev; județul ales pentru explorare este temporar.',
    },
    {
      title: 'Pregătirea și traseul tău',
      body: 'Păstrăm în cont nivelurile abilităților pe care le autoevaluezi, obiectivul ales, pașii acceptați, progresul și acordurile înregistrate. Salvate păstrează interesele separat de Traseu. Bookmarkurile se sincronizează între dispozitive; eliminarea unui bookmark nu șterge un pas din Traseu.',
    },
    {
      title: 'Cum sunt folosite',
      body: 'Folosim aceste informații pentru profil, filtrarea opțiunilor după județ, analiza abilităților și recomandarea pașilor următori. Recomandările nu reprezintă o decizie de admitere.',
    },
    {
      title: 'Preferințe și recomandări',
      body: 'Cele patru chestionare opționale sunt Interese și curiozități, Cum îmi place să lucrez, Abilități și încredere și Obiective și condiții practice. Păstrăm răspunsurile, întrebările sărite, versiunea, stadiul și locul în care ai rămas. Păstrăm și activitățile alese, starea lor și reflecțiile oferite după explorare. Recomandările folosesc aceste răspunsuri, clasa, județul, interesele salvate, abilitățile autoevaluate și obiectivul ales. Explicațiile arată de ce apare o sugestie; acceptarea și respingerea sunt păstrate în cont. Încrederea exprimată și reflecțiile nu sunt măsurători ale aptitudinilor. Chestionarele nu sunt teste psihologice validate și nu stabilesc diagnostice. Poți modifica sau șterge răspunsurile din Preferințe și recomandări, fără să pierzi pașii acceptați ori progresul.',
    },
    {
      title: 'Stocare și servicii externe',
      body: 'Autentificarea și datele contului sunt gestionate prin Supabase. Sesiunea este păstrată pe dispozitiv pentru a rămâne conectat. Previzualizările hărților și site-urile instituțiilor pot contacta servicii externe, care au propriile politici. Aplicația nu include instrumente de analiză publicitară.',
    },
    {
      title: 'Controlul datelor',
      body: 'Poți modifica profilul și nivelurile abilităților, poți exporta datele sau poți șterge contul din această secțiune. Exportul include bookmarkurile, răspunsurile chestionarelor, activitățile, reflecțiile și deciziile privind sugestiile. Ștergerea contului elimină aceste date și progresul asociat. Copiile exportate de tine rămân la tine.',
    },
    {
      title: 'Feedback',
      body: 'Raportul conține textul introdus de tine, versiunea NextStep și sistemul de operare. Nu atașăm automat profilul, răspunsurile chestionarelor sau datele de autentificare. Raportul se deschide într-o aplicație aleasă de tine; trimiterea și păstrarea lui urmează regulile acelei aplicații. Nu include parole sau date personale.',
    },
    {
      title: 'Modificări ale politicii',
      body: 'Această pagină descrie funcțiile actuale ale aplicației. Verifică data actualizării când revii pentru a vedea dacă informațiile s-au schimbat.',
    },
  ],
  terms: [
    {
      title: 'Scopul NextStep',
      body: 'NextStep te ajută să explorezi licee, specializări, facultăți, programe, cariere, abilități și cursuri și să îți organizezi traseul educațional.',
    },
    {
      title: 'Contul și accesul',
      body: 'Păstrează parola în siguranță și folosește propriul cont. Completează informațiile de profil corect pentru ca opțiunile și recomandările să fie relevante.',
    },
    {
      title: 'Informații și recomandări',
      body: 'Datele despre instituții și admitere pot avea o sursă și un an de referință. Verifică regulile și termenele actuale direct la instituție înainte de a lua o decizie. NextStep nu garantează admiterea, angajarea sau disponibilitatea unui curs.',
    },
    {
      title: 'Utilizare responsabilă',
      body: 'Nu încerca să accesezi conturile altor persoane, să modifici date fără permisiune sau să afectezi funcționarea serviciului. Nu introduce parole sau alte informații sensibile în câmpurile de profil.',
    },
    {
      title: 'Servicii externe',
      body: 'Site-urile instituțiilor, hărțile și resursele educaționale externe sunt administrate de furnizorii lor. Verifică informațiile și condițiile acestora când le accesezi.',
    },
    {
      title: 'Datele și închiderea contului',
      body: 'Poți citi politica de confidențialitate, solicita un export și șterge contul din Confidențialitate și date. Ștergerea este definitivă; exportă mai întâi datele pe care vrei să le păstrezi.',
    },
  ],
};
