-- Verified seed data for skills table
INSERT INTO skills (id, name, category) VALUES
('11111111-1111-1111-1111-111111111111', 'Programare', 'Tehnologie'),
('22222222-2222-2222-2222-222222222222', 'Analiză de date', 'Tehnologie'),
('33333333-3333-3333-3333-333333333333', 'Gestiune de proiecte', 'Management'),
('44444444-4444-4444-4444-444444444444', 'Comunicare', 'Interpersonal'),
('55555555-5555-5555-5555-555555555555', 'Pensare critică', 'Cognitiv'),
('66666666-6666-6666-6666-666666666666', 'Creativitate', 'Cognitiv'),
('77777777-7777-7777-7777-777777777777', 'Lucru în echipă', 'Interpersonal'),
('88888888-8888-8888-8888-888888888888', 'Managementul timpului', 'Personal'),
('99999999-9999-9999-9999-999999999999', 'Abilități de prezentare', 'Comunicare'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaa-aaaa-aaaa-aaaa', 'Limbi străine', 'Comunicare')
ON CONFLICT (id) DO NOTHING;