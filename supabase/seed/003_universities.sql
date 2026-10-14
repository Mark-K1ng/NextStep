-- Verified seed data for universities table
INSERT INTO universities (id, name, city, website, source_url, verified_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Universitatea din București', 'București', 'https://www.unibuc.ro', 'https://www.unibuc.ro/despre-us', '2026-10-13 00:00:00+00'),
('22222222-2222-2222-2222-222222222222', 'Universitatea Babeș-Bolyai', 'Cluj-Napoca', 'https://www.ubbcluj.ro', 'https://www.ubbcluj.ro/despre', '2026-10-13 00:00:00+00'),
('33333333-3333-3333-3333-333333333333', 'Politehnica Timișoara', 'Timișoara', 'https://www.upt.ro', 'https://www.upt.ro/despre-universitate', '2026-10-13 00:00:00+00')
ON CONFLICT (id) DO NOTHING;