-- Seed data for university programs with verified sources

INSERT INTO programs (university_id, name, degree_level, duration_years, description, source_url, verified_at)
SELECT 
  id,
  'Informatică',
  'Licență',
  4,
  'Program de studii în informatică, cu focus pe programare, algoritmi și sisteme informatice.',
  'https://www.unibuc.ro/facultati/facultatea-de-matematica-informatica/',
  NOW()
FROM universities
WHERE name = 'Universitatea din București';

INSERT INTO programs (university_id, name, degree_level, duration_years, description, source_url, verified_at)
SELECT 
  id,
  'Matematică',
  'Licență',
  4,
  'Program de studii în matematică pură și aplicată.',
  'https://www.unibuc.ro/facultati/facultatea-de-matematica-informatica/',
  NOW()
FROM universities
WHERE name = 'Universitatea din București';

INSERT INTO programs (university_id, name, degree_level, duration_years, description, source_url, verified_at)
SELECT 
  id,
  'Automatică și Calculatoare',
  'Licență',
  4,
  'Program de studii în inginerie, automatizări și sisteme informatice.',
  'https://www.pub.ro',
  NOW()
FROM universities
WHERE name = 'Universitatea Politehnica din București';

INSERT INTO programs (university_id, name, degree_level, duration_years, description, source_url, verified_at)
SELECT 
  id,
  'Medicină Generală',
  'Licență',
  6,
  'Program de studii în medicină, cu stagii clinice.',
  'https://www.umfcd.ro',
  NOW()
FROM universities
WHERE name = 'Universitatea de Medicină și Farmacie „Carol Davila”';

INSERT INTO programs (university_id, name, degree_level, duration_years, description, source_url, verified_at)
SELECT 
  id,
  'Informatică',
  'Licență',
  4,
  'Program de studii în informatică, cu focus pe dezvoltare software și inteligență artificială.',
  'https://www.ubbcluj.ro',
  NOW()
FROM universities
WHERE name = 'Universitatea Babeș-Bolyai';

INSERT INTO programs (university_id, name, degree_level, duration_years, description, source_url, verified_at)
SELECT 
  id,
  'Drept',
  'Licență',
  4,
  'Program de studii în drept, cu focus pe legislație română și europeană.',
  'https://www.ubbcluj.ro',
  NOW()
FROM universities
WHERE name = 'Universitatea Babeș-Bolyai';

INSERT INTO programs (university_id, name, degree_level, duration_years, description, source_url, verified_at)
SELECT 
  id,
  'Economie',
  'Licență',
  4,
  'Program de studii în economie, cu focus pe finanțe și management.',
  'https://www.ase.ro',
  NOW()
FROM universities
WHERE name = 'Academia de Studii Economice din București';

INSERT INTO programs (university_id, name, degree_level, duration_years, description, source_url, verified_at)
SELECT 
  id,
  'Informatică Economică',
  'Licență',
  4,
  'Program de studii la intersecția dintre informatică și economie.',
  'https://www.ase.ro',
  NOW()
FROM universities
WHERE name = 'Academia de Studii Economice din București';
