-- Seed data for program_careers junction table
-- Maps university programs to related careers

-- Informatics programs lead to software careers
INSERT INTO program_careers (program_id, career_id)
SELECT p.id, c.id
FROM programs p
JOIN careers c ON c.name IN ('Programator Software', 'Inginer Software', 'Analist Date', 'Inginer AI/ML')
WHERE p.name = 'Informatică';

-- Mathematics programs lead to data careers
INSERT INTO program_careers (program_id, career_id)
SELECT p.id, c.id
FROM programs p
JOIN careers c ON c.name IN ('Analist Date', 'Economist', 'Inginer Software')
WHERE p.name = 'Matematică';

-- Automatică și Calculatoare programs lead to engineering careers
INSERT INTO program_careers (program_id, career_id)
SELECT p.id, c.id
FROM programs p
JOIN careers c ON c.name IN ('Inginer Software', 'Inginer Electric', 'Inginer Mecanic')
WHERE p.name = 'Automatică și Calculatoare';

-- Medicine programs lead to medical careers
INSERT INTO program_careers (program_id, career_id)
SELECT p.id, c.id
FROM programs p
JOIN careers c ON c.name IN ('Medic', 'Farmacist', 'Psiholog')
WHERE p.name = 'Medicină Generală';

-- Law programs lead to legal careers
INSERT INTO program_careers (program_id, career_id)
SELECT p.id, c.id
FROM programs p
JOIN careers c ON c.name IN ('Avocat', 'Judecător', 'Consultant')
WHERE p.name = 'Drept';

-- Economy programs lead to business careers
INSERT INTO program_careers (program_id, career_id)
SELECT p.id, c.id
FROM programs p
JOIN careers c ON c.name IN ('Economist', 'Contabil', 'Consultant', 'Antreprenor')
WHERE p.name = 'Economie';

-- Informatică Economică programs lead to hybrid careers
INSERT INTO program_careers (program_id, career_id)
SELECT p.id, c.id
FROM programs p
JOIN careers c ON c.name IN ('Analist Date', 'Economist', 'Programator Software')
WHERE p.name = 'Informatică Economică';
