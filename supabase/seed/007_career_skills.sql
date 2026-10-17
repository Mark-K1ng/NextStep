-- Seed data for career_skills junction table
-- Maps careers to required skills with importance level (1-3)

-- Software Developer skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Programare', 'Algoritmi', 'Rezolvare probleme')
WHERE c.name = 'Programator Software';

-- Software Engineer skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Programare', 'Baze de date', 'Arhitectură software')
WHERE c.name = 'Inginer Software';

-- Data Analyst skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Analiză date', 'Statistică', 'SQL')
WHERE c.name = 'Analist Date';

-- AI/ML Engineer skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Machine Learning', 'Python', 'Matematică')
WHERE c.name = 'Inginer AI/ML';

-- UI/UX Designer skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('UI/UX Design', 'Creativitate', 'Comunicare')
WHERE c.name = 'Designer UI/UX';

-- Project Manager skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Management', 'Comunicare', 'Organizare')
WHERE c.name = 'Manager Proiect';

-- Product Manager skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Strategie', 'Analiză', 'Comunicare')
WHERE c.name = 'Manager Produs';

-- Economist skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Economie', 'Analiză', 'Statistică')
WHERE c.name = 'Economist';

-- Accountant skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Contabilitate', 'Excel', 'Atenție la detalii')
WHERE c.name = 'Contabil';

-- Doctor skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Medicină', 'Diagnosticare', 'Empatie')
WHERE c.name = 'Medic';

-- Pharmacist skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Farmacie', 'Chimie', 'Atenție la detalii')
WHERE c.name = 'Farmacist';

-- Psychologist skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Psihologie', 'Empatie', 'Comunicare')
WHERE c.name = 'Psiholog';

-- Lawyer skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Drept', 'Argumentare', 'Cercetare')
WHERE c.name = 'Avocat';

-- Journalist skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Scriere', 'Cercetare', 'Comunicare')
WHERE c.name = 'Jurnalist';

-- Teacher skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Teaching', 'Comunicare', 'Răbdare')
WHERE c.name = 'Profesor';

-- Architect skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Arhitectură', 'Design', 'Creativitate')
WHERE c.name = 'Arhitect';

-- Civil Engineer skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Inginerie', 'Proiectare', 'Management')
WHERE c.name = 'Inginer Civil';

-- Marketing Specialist skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Marketing', 'Comunicare', 'Creativitate')
WHERE c.name = 'Marketing Specialist';

-- HR Specialist skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Resurse umane', 'Comunicare', 'Organizare')
WHERE c.name = 'Specialist HR';

-- Sales skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Vânzări', 'Comunicare', 'Persuasiune')
WHERE c.name = 'Vânzări';

-- Consultant skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Consulting', 'Analiză', 'Comunicare')
WHERE c.name = 'Consultant';

-- Entrepreneur skills
INSERT INTO career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM careers c
JOIN skills s ON s.name IN ('Leadership', 'Inovație', 'Risc')
WHERE c.name = 'Antreprenor';
