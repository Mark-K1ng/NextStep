-- Seed data for program_skills junction table
-- Maps university programs to skills they teach with depth level (1-3)

-- Informatics programs
INSERT INTO program_skills (program_id, skill_id, depth)
SELECT p.id, s.id, 3
FROM programs p
JOIN skills s ON s.name IN ('Programare', 'Algoritmi', 'Baze de date')
WHERE p.name = 'Informatică';

-- Mathematics programs
INSERT INTO program_skills (program_id, skill_id, depth)
SELECT p.id, s.id, 3
FROM programs p
JOIN skills s ON s.name IN ('Analiză matematică', 'Algebră', 'Geometrie')
WHERE p.name = 'Matematică';

-- Automatică și Calculatoare programs
INSERT INTO program_skills (program_id, skill_id, depth)
SELECT p.id, s.id, 3
FROM programs p
JOIN skills s ON s.name IN ('Inginerie', 'Automatizări', 'Programare')
WHERE p.name = 'Automatică și Calculatoare';

-- Medicine programs
INSERT INTO program_skills (program_id, skill_id, depth)
SELECT p.id, s.id, 3
FROM programs p
JOIN skills s ON s.name IN ('Medicină', 'Anatomie', 'Fiziologie')
WHERE p.name = 'Medicină Generală';

-- Law programs
INSERT INTO program_skills (program_id, skill_id, depth)
SELECT p.id, s.id, 3
FROM programs p
JOIN skills s ON s.name IN ('Drept', 'Argumentare', 'Cercetare')
WHERE p.name = 'Drept';

-- Economy programs
INSERT INTO program_skills (program_id, skill_id, depth)
SELECT p.id, s.id, 3
FROM programs p
JOIN skills s ON s.name IN ('Economie', 'Finanțe', 'Statistică')
WHERE p.name = 'Economie';

-- Informatică Economică programs
INSERT INTO program_skills (program_id, skill_id, depth)
SELECT p.id, s.id, 3
FROM programs p
JOIN skills s ON s.name IN ('Programare', 'Economie', 'Analiză date')
WHERE p.name = 'Informatică Economică';
