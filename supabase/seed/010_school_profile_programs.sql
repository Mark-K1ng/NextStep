-- Verified seed data for school_profile_programs table
INSERT INTO school_profile_programs (school_profile_id, program_id) VALUES
-- Liceul Teoretic „Mihai Eminescu” - Real - Matematică-Informatică
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'), -- Informatică
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'), -- Psihologie

-- Liceul Teoretic „Mihai Eminescu” - Human - Filosofie-Psychologie
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'), -- Psihologie
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'), -- Medicină (pregatire)

-- Liceul Teoretic de Informatică „Grigore Moisil” - Real - Informatică intensivă
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'), -- Informatică
('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'), -- Inginerie Mecanică
ON CONFLICT (school_profile_id, program_id) DO NOTHING;