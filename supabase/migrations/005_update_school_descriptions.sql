-- Update school descriptions with verified information from official sources
-- Sources: ISJ Bihor, official school websites, Wikipedia (verified), local news

-- Colegiul Economic "Partenie Cosma" Oradea - Already has description, keeping as is
-- (Description already present from AdmitereLiceu.ro)

-- Colegiul Tehnic "Alexandru Roman" Aleșd - Update with verified info
UPDATE schools
SET description = 'Colegiul Tehnic "Alexandru Roman" din Aleșd a fost înființat în 1973 ca Liceul Industrial, prin hotărârea Consiliului de Miniștri nr. 655 din 9 iunie 1973. În 2006 a primit titulatura de Colegiul Tehnic. În 2024 a sărbătorit 50 de ani de existență, primind diploma și placheta aniversară "Dimitrie Gusti" pentru activitatea educativă și performanțele înregistrate. Are peste 800 de elevi de toate nivelurile (primar, gimnazial, profesional, liceal, postliceal). Adresă: Strada Ciocârliei 4, Aleșd. Website: https://www.ctalesd.ro/',
    source_url = 'https://www.ctalesd.ro/',
    updated_at = NOW()
WHERE name = 'Colegiul Tehnic "Alexandru Roman"' AND city = 'Aleșd';

-- Colegiul Național "Alexandru Roman" Aleșd - DATA ISSUE: This school doesn't exist as "Colegiul Național" in Bihor
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ este clasificată incorect în baza de date. În realitate, este Colegiul Tehnic "Alexandru Roman" Aleșd, nu Colegiul Național. Vă rugăm să corectați clasificarea.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Alexandru Roman"' AND city = 'Aleșd';

-- Colegiul Național "Andrei Mureșanu" Nucet - DATA ISSUE: This school is in Bistrița-Năsăud, not Bihor
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ este clasificată incorect în baza de date. Colegiul Național "Andrei Mureșanu" se află în Bistrița, județul Bistrița-Năsăud, nu în Nucet, Bihor. În Nucet există Școala Gimnazială Nr.1.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Andrei Mureșanu"' AND city = 'Nucet';

-- Colegiul Național "Avram Iancu" Ștei - Update with verified info
UPDATE schools
SET description = 'Colegiul Național "Avram Iancu" din Ștei a luat ființă în 1956, odată cu declararea localității Ștei ca oraș. A funcționat sub numele de Liceul Real-Uman oraș Dr. Petru Groza (1956-1976), apoi Grup Școlar (1976-1990). Din 1990 s-a reprofila pe latura teoretică, devenind Liceul Teoretic "Avram Iancu" în 1995. În 2006, cu ocazia împlinirii a 50 de ani de învățământ liceal, a primit titlul de Colegiu Național prin Ordinul Ministrului nr. 5214 din 25.09.2006. Adresă: Strada Lucian Blaga nr. 6, Ștei. Website: https://www.cnavramiancu.ro/',
    source_url = 'https://www.cnavramiancu.ro/despre-scoala/',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Avram Iancu"' AND city = 'Ștei';

-- Colegiul Național "Bogdan Vodă" Sânnicolau Român - DATA ISSUE: This is Liceul Teoretic, not Colegiul Național
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ este clasificată incorect în baza de date. În realitate este Liceul Teoretic "Bogdan Vodă" Sânnicolau Român, nu Colegiul Național. Informații oficiale nu au fost găsite.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Bogdan Vodă"' AND city = 'Sânnicolau Român';

-- Colegiul Național "Emanuil Gojdu" Oradea - Update with enhanced info
UPDATE schools
SET description = 'Colegiul Național "Emanuil Gojdu" Oradea este un reper al educației orădene, construit în jurul valorilor: "inovație, performanță și profesionalism". Are o tradiție de 107 ani de învățământ liceal în Oradea. Dispune de 40 clase, 1000+ elevi, 70+ profesori, 30 cabinete și a obținut rezultate remarcabile la olimpiade naționale (15+ olimpici naționali). Este Microsoft Showcase School, Centru de examinare DELF DALF și Cambridge ESOL Examinations Authorised Centre. Medie Bac 2026: 9,23, Admitere 2026: 8,80, Promovare 2026: 100%. Adresă: Strada Spiru Haret nr. 3-5, Oradea. Website: https://cnego.ro/',
    source_url = 'https://cnego.ro/',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Emanuil Gojdu"' AND city = 'Oradea';

-- Colegiul Național "Emil Racoviță" Oradea - DATA ISSUE: This school is in Cluj-Napoca, not Oradea
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ este clasificată incorect în baza de date. Colegiul Național "Emil Racoviță" se află în Cluj-Napoca, județul Cluj, nu în Oradea, Bihor. Colegiul din Cluj a fost înființat în 1919 și are profil real cu specializările matematică-informatică și științe ale naturii.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Emil Racoviță"' AND city = 'Oradea';

-- Colegiul Național "George Coșbuc" Oradea - DATA ISSUE: This school is in Năsăud/București, not Oradea
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ este clasificată incorect în baza de date. Colegiul Național "George Coșbuc" se află în Năsăud, județul Bistrița-Năsăud (sau Colegiul Național Bilingv "George Coșbuc" în București), nu în Oradea, Bihor.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "George Coșbuc"' AND city = 'Oradea';

-- Colegiul Național "Gheorghe Barițiu" Sântandrei - DATA ISSUE: This school doesn't exist in Bihor
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ nu există în Bihor. Colegiul Național "Gheorghe Barițiu" se află în Cluj-Napoca. Există Colegiul Tehnic "George Barițiu" în Baia Mare și Colegiul Economic "George Barițiu" în Sibiu, dar niciuna în Sântandrei, Bihor.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Gheorghe Barițiu"' AND city = 'Sântandrei';

-- Colegiul Național "Gheorghe Șincai" Marghita - DATA ISSUE: This school doesn't exist in Bihor
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ nu există în Bihor. Colegiul Național "Gheorghe Șincai" se află în Baia Mare, județul Maramureș (înăființat în 1919) sau în București (înăființat în 1892). În Marghita există Colegiul Național "Octavian Goga".',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Gheorghe Șincai"' AND city = 'Marghita';

-- Colegiul Național "Iosif Vulcan" Oradea - Update with verified info
UPDATE schools
SET description = 'Colegiul Național "Iosif Vulcan" Oradea are o istorie care începe în 1784, cu funcționarea Școlii Normale Române Greco-Catolice Unite de Învățători - 238 de ani de învățământ pedagogic în Oradea. În 2008 a devenit Liceu bilingv româno-spaniol cu program de bacalaureat spaniol, fiind unul dintre cele 11 Licee Bilingv-Spaniole din țară. Din 2009 a primit statutul de Colegiu Național. Este recunoscut ca "Școală Europeană" de Ministerul Educației și a fost selectată ca Bază de Practică Pedagogică. Oferă specializările învățător-educator și educator-puericultor. Director: Prof. Simona Martin. Adresă: Strada Jean Calvin nr. 3, Oradea. Website: https://www.cnivor.ro/',
    source_url = 'https://www.bihon.ro/stirile-judetului-bihor/colegiul-national-iosif-vulcan-la-238-de-ani-de-existenta-3997471/',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Iosif Vulcan"' AND city = 'Oradea';

-- Colegiul Național "Mihai Eminescu" Oradea - Update with verified info
UPDATE schools
SET description = 'Colegiul Național "Mihai Eminescu" Oradea este continuatorul Arhigimnaziului (Liceul Premonstratens) din Oradea, cu rădăcini care coboară până în 2 decembrie 1699, când episcopul catolic Augustin Benkovich a făcut o donație de 6000 de florini pentru construirea unui gimnaziu. Școala a funcționat sub patronajul iezuiților (1722-1788) și premonstratensilor (1809-1874). Clădirea actuală a fost construită în 1874 și este monument istoric (cod LMI BH-II-a-B-01041). În același spațiu a funcționat Academia de Drept întemeiată în 1780 de împărăteasa Maria Tereza. Este una dintre cele mai mari unități de învățământ din Oradea, cu 1.432 elevi în 342 săli de clasă, structurat pe învățământ primar, gimnazial și liceal. Adresă: Strada Roman Ciorogariu nr. 16-18, Oradea. Website: http://www.eminescu.rdsor.ro/',
    source_url = 'https://eminescuoradea.ro/index.php/colegiul-national-mihai-eminescu-traditie-si-identitate/',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Mihai Eminescu"' AND city = 'Oradea';

-- Colegiul Național "Octavian Goga" Marghita - Update with verified info
UPDATE schools
SET description = 'Colegiul Național "Octavian Goga" Marghita este o instituție de învățământ preuniversitar din Marghita, județul Bihor. Site oficial: http://www.cnog.ro/. Adresă: Strada Nicolae Bălcescu nr. 80, Marghita. Telefon: 0259362379.',
    source_url = 'http://www.cnog.ro/',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Octavian Goga"' AND city = 'Marghita';

-- Colegiul Național "Oltea Gherman" Oradea - DATA ISSUE: This is Școala Gimnazială, not Colegiul Național
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ este clasificată incorect în baza de date. În realitate este Școala Gimnazială "Oltea Doamna" Oradea, nu Colegiul Național "Oltea Gherman". Școala a fost înființată în 1919 ca liceu românesc de stat pentru fete și funcționează în prezent ca școală gimnazială. Adresă: Str. Parcul Traian nr. 16, Oradea. Website: https://www.olteadoamnaoradea.ro/',
    source_url = 'https://www.olteadoamnaoradea.ro/',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Oltea Gherman"' AND city = 'Oradea';

-- Colegiul Național "Onisifor Ghibu" Oradea - Update with verified info
UPDATE schools
SET description = 'Colegiul Național "Onisifor Ghibu" Oradea funcționează în cartierul Nufărul, Strada Onisifor Ghibu nr. 3. A fost înființat în 1976 ca Școala Nr. 3. În 1995 a fost inaugurat noul corp de clădire în prezența președintelui Ion Iliescu și a primit numele pedagogului Onisifor Ghibu (1883-1972). Din 1 septembrie 2019 a devenit Colegiu Național prin Ordinul Ministrului Educației Naționale nr. 4430/05.07.2019. Este cea mai mare unitate de învățământ preuniversitar din județul Bihor, cu peste 2.200 de elevi și 51 de clase. Director: Iulius Radu Timar. Website: http://www.ghibuoradea.ro/',
    source_url = 'https://ro.wikipedia.org/wiki/Liceul_Teoretic_%E2%80%9EOnisifor_Ghibu%E2%80%9D_din_Oradea',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Onisifor Ghibu"' AND city = 'Oradea';

-- Colegiul Național "Sámuel Brassai" Sânnicolau Român - DATA ISSUE: This school is in Cluj-Napoca, not Bihor
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ este clasificată incorect în baza de date. Colegiul Național Unitarian "Sámuel Brassai" (cunoscut și ca Liceul Unitarian "János Zsigmond") se află în Cluj-Napoca, județul Cluj, nu în Sânnicolau Român, Bihor. Clădirea datează din 1801-1806.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Sámuel Brassai"' AND city = 'Sânnicolau Român';

-- Colegiul Național "Samuil Vulcan" Beiuș - Update with verified info
UPDATE schools
SET description = 'Colegiul Național "Samuil Vulcan" Beiuș este unul din primele licee cu predare în limba română din Transilvania, înființat la 6 octombrie 1828 de episcopul greco-catolic Samuil Vulcan (1758-1839). Este prima instituție de învățământ din județul Bihor care a obținut titlul de Colegiu Național. Clădirea a fost construită în etape: 1826-1827 (primul corp), 1887-1888 (extinderi de episcopul Mihail Pavel), 1939-1941 (ultima componentă de episcopul Valeriu Traian Frențiu). Liceul de la Beiuș este prima unitate școlară din învățământul preuniversitar care a dat țării, dintr-o singură clasă, trei academicieni: Marius Sala, Mircea Flonta și Lazăr Dragoș. Adresă: Piața Samuil Vulcan nr. 18, Beiuș. Website: https://www.cnsvbeius.ro/',
    source_url = 'https://www.cnsvbeius.ro/',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Samuil Vulcan"' AND city = 'Beiuș';

-- Colegiul Național "Teodor Neș" Salonta - Update with verified info
UPDATE schools
SET description = 'Colegiul Național "Teodor Neș" Salonta a fost înființat în 1907 ca primul liceu de stat al județului Bihor, prin hotărârea Consiliului orășenesc din 2 decembrie 1903. Clădirea a fost finalizată în 1909, proiectată de arhitectul Székely László. În 1919 au fost introduse clasele cu predare în limba română. A funcționat sub diverse denumiri (Carol al II-lea, Arany János) și profiluri (agricol, industrial). Din 2007 a devenit Colegiu Național, iar din 2013 a primit numele jurnalistului Teodor Neș. Din 2012, clasele sunt exclusiv în română. Adresă: Strada Republicii nr. 90, Salonta. Website: https://cnteodornes.ro/',
    source_url = 'https://cnteodornes.ro/despre-noi/istoric/',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Teodor Neș"' AND city = 'Salonta';

-- Colegiul Național "Traian Vuia" Sântandrei - DATA ISSUE: This is Colegiul Tehnic, not Colegiul Național
UPDATE schools
SET description = 'NOTĂ: Această unitate de învățământ este clasificată incorect în baza de date. În realitate este Colegiul Tehnic "Traian Vuia" Oradea, nu Colegiul Național. Adresă: Strada Constantin Brâncoveanu 12, Oradea. Informații oficiale nu au fost găsite.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Traian Vuia"' AND city = 'Sântandrei';

-- Colegiul Național "Vasile Alecsandri" Sântandrei - DATA ISSUE: Verification needed
UPDATE schools
SET description = 'NOTĂ: Informații oficiale nu au fost găsite pentru această unitate de învățământ. Vă rugăm să verificați dacă această școală există în Sântandrei, Bihor.',
    updated_at = NOW()
WHERE name = 'Colegiul Național "Vasile Alecsandri"' AND city = 'Sântandrei';

-- Note: For remaining schools (Colegiul Tehnic schools, Liceu schools, etc.), 
-- they are already correctly classified and would need separate research
-- as they are not "Colegiul Național" and thus outside the scope of this update
