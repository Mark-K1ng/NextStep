-- Seed data for course_skills junction table
-- Maps courses to skills they teach with depth level (1-3)

-- Python courses teach programming
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Programare'
WHERE c.title LIKE '%Python%' OR c.title LIKE '%JavaScript%' OR c.title LIKE '%Programming%';

-- Data courses teach data analysis
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name IN ('Analiză date', 'Statistică', 'SQL')
WHERE c.title LIKE '%Data%' OR c.title LIKE '%SQL%' OR c.title LIKE '%Statistics%';

-- Machine Learning courses teach ML
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Machine Learning'
WHERE c.title LIKE '%Machine Learning%' OR c.title LIKE '%AI%';

-- Web development courses teach web dev
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Dezvoltare web'
WHERE c.title LIKE '%Web%' OR c.title LIKE '%HTML%' OR c.title LIKE '%CSS%';

-- UI/UX courses teach design
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'UI/UX Design'
WHERE c.title LIKE '%UI%' OR c.title LIKE '%UX%' OR c.title LIKE '%Design%';

-- Project management courses teach management
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Management'
WHERE c.title LIKE '%Project Management%' OR c.title LIKE '%Management%';

-- Marketing courses teach marketing
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Marketing'
WHERE c.title LIKE '%Marketing%' OR c.title LIKE '%SEO%' OR c.title LIKE '%Content%';

-- Communication courses teach communication
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Comunicare'
WHERE c.title LIKE '%Communication%' OR c.title LIKE '%Speaking%' OR c.title LIKE '%Writing%';

-- Leadership courses teach leadership
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Leadership'
WHERE c.title LIKE '%Leadership%' OR c.title LIKE '%Management%';

-- Sales courses teach sales
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Vânzări'
WHERE c.title LIKE '%Sales%' OR c.title LIKE '%Selling%';

-- Accounting courses teach accounting
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Contabilitate'
WHERE c.title LIKE '%Accounting%' OR c.title LIKE '%Finance%';

-- HR courses teach HR
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Resurse umane'
WHERE c.title LIKE '%Human Resources%' OR c.title LIKE '%HR%';

-- Law courses teach law
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Drept'
WHERE c.title LIKE '%Law%' OR c.title LIKE '%Legal%';

-- Psychology courses teach psychology
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Psihologie'
WHERE c.title LIKE '%Psychology%' OR c.title LIKE '%Counseling%';

-- Teaching courses teach teaching
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Teaching'
WHERE c.title LIKE '%Teaching%' OR c.title LIKE '%Education%';

-- Engineering courses teach engineering
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Inginerie'
WHERE c.title LIKE '%Engineering%' OR c.title LIKE '%Civil%' OR c.title LIKE '%Electrical%' OR c.title LIKE '%Mechanical%';

-- Medical courses teach medicine
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Medicină'
WHERE c.title LIKE '%Medical%' OR c.title LIKE '%Health%' OR c.title LIKE '%Nutrition%';

-- Cybersecurity courses teach cybersecurity
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Securitate cibernetică'
WHERE c.title LIKE '%Cybersecurity%' OR c.title LIKE '%Security%';

-- Cloud courses teach cloud computing
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Cloud computing'
WHERE c.title LIKE '%Cloud%';

-- DevOps courses teach DevOps
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'DevOps'
WHERE c.title LIKE '%DevOps%';

-- Mobile dev courses teach mobile development
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Dezvoltare mobilă'
WHERE c.title LIKE '%Mobile%';

-- Game dev courses teach game development
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Game Dev'
WHERE c.title LIKE '%Game%';

-- 3D courses teach 3D modeling
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = '3D Modeling'
WHERE c.title LIKE '%3D%';

-- Animation courses teach animation
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Animation'
WHERE c.title LIKE '%Animation%';

-- Critical thinking courses teach critical thinking
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Gândire critică'
WHERE c.title LIKE '%Critical Thinking%' OR c.title LIKE '%Logic%';

-- Research courses teach research
INSERT INTO course_skills (course_id, skill_id, depth)
SELECT c.id, s.id, 3
FROM courses c
JOIN skills s ON s.name = 'Cercetare'
WHERE c.title LIKE '%Research%' OR c.title LIKE '%Methods%';
