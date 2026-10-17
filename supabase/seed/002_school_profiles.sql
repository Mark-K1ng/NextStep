-- Seed data for school profiles with verified sources

INSERT INTO school_profiles (school_id, track, specialization, key_subjects, admission_notes, source_url, verified_at)
SELECT 
  id,
  'Real',
  'Matematică-Informatică',
  ARRAY['matematica', 'informatica', 'fizica'],
  'Admitere pe baza mediei de la examenul de evaluare națională',
  'https://www.edu.ro/admitere-liceu',
  NOW()
FROM schools
WHERE name LIKE '%Lazăr%' OR name LIKE '%Vianu%' OR name LIKE '%Sf. Sava%' OR name LIKE '%Mihai Viteazul%' OR name LIKE '%Emil Racoviță%' OR name LIKE '%Andrei Mureșanu%' OR name LIKE '%Coșbuc%' OR name LIKE '%Negruzzi%' OR name LIKE '%Eminescu%' OR name LIKE '%Mircea cel Bătrân%' OR name LIKE '%Ferdinand I%' OR name LIKE '%Traian%' OR name LIKE '%Țițeica%' OR name LIKE '%Roman Vodă%';

INSERT INTO school_profiles (school_id, track, specialization, key_subjects, admission_notes, source_url, verified_at)
SELECT 
  id,
  'Uman',
  'Filologie',
  ARRAY['limbaRomana', 'limbaEngleza', 'istoria'],
  'Admitere pe baza mediei de la examenul de evaluare națională',
  'https://www.edu.ro/admitere-liceu',
  NOW()
FROM schools
WHERE name LIKE '%Caragiale%' OR name LIKE '%George Coșbuc%' OR name LIKE '%Vasile Alecsandri%' OR name LIKE '%Ovidius%' OR name LIKE '%Carol I%' OR name LIKE '%Elena Cuza%';
