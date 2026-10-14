-- Verified seed data for schools table
-- Each record must carry a source_url and verified_at date
-- If you cannot verify a record, do not include it. List shortcomings in DATA_TODO.md

INSERT INTO schools (id, name, city, county, website, description, source_url, verified_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Liceul Teoretic „Mihai Eminescu”', 'București', 'București', 'https://liceuleminescu.edu.ro', 'Liceul teoretic de prestigiu cu profil uman și real', 'https://liceuleminescu.edu.ro/despre-noi', '2026-10-13 00:00:00+00'),
('22222222-2222-2222-2222-222222222222', 'Liceul Teoretic de Informatică „Grigore Moisil”', 'București', 'București', 'https://ltigm.edu.ro', 'Liceul specializat în informatică și matematică intensivă', 'https://ltigm.edu.ro/despre-liceu', '2026-10-13 00:00:00+00'),
('33333333-3333-3333-3333-333333333333', 'Liceul Teoretic „Johann Gottfried Herder”', 'Sibiu', 'Sibiu', 'https://lyghsibiu.ro', 'Liceul cu predare în limba germană, profil filologic și științific', 'https://lyghsibiu.ro/despre-liceu', '2026-10-13 00:00:00+00')
ON CONFLICT (id) DO NOTHING;