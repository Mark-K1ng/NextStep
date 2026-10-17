-- Seed data for school_profile_programs junction table
-- Maps school profiles to university programs

-- Connect mathematics-informatics profiles to informatics programs
INSERT INTO school_profile_programs (school_profile_id, program_id)
SELECT sp.id, p.id
FROM school_profiles sp
JOIN programs p ON p.name = 'Informatică'
WHERE sp.specialization = 'Matematică-Informatică';

-- Connect mathematics-informatics profiles to mathematics programs
INSERT INTO school_profile_programs (school_profile_id, program_id)
SELECT sp.id, p.id
FROM school_profiles sp
JOIN programs p ON p.name = 'Matematică'
WHERE sp.specialization = 'Matematică-Informatică';

-- Connect philology profiles to law programs
INSERT INTO school_profile_programs (school_profile_id, program_id)
SELECT sp.id, p.id
FROM school_profiles sp
JOIN programs p ON p.name = 'Drept'
WHERE sp.specialization = 'Filologie';

-- Connect philology profiles to journalism/communication careers (if programs existed)
-- For now, connect to economy as a general humanities option
INSERT INTO school_profile_programs (school_profile_id, program_id)
SELECT sp.id, p.id
FROM school_profiles sp
JOIN programs p ON p.name = 'Economie'
WHERE sp.specialization = 'Filologie';
