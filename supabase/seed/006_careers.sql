-- Verified seed data for careers table
INSERT INTO careers (id, name, description, domain, source_url, verified_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Inginer software', 'Proiectează, dezvoltează și testează aplicații și sisteme software', 'Tehnologie', 'https://euresp.gov.ro/locuri-de-munca/inginer-software', '2026-10-13 00:00:00+00'),
('22222222-2222-2222-2222-222222222222', 'Analist de date', 'Colegeze, proceseze și interpreteze date complexe pentru a ajuta la decizii de afaceri', 'Tehnologie', 'https://euresp.gov.ro/locuri-de-munca/analist-de-date', '2026-10-13 00:00:00+00'),
('33333333-3333-3333-3333-333333333333', 'Psiholog clinic', 'Evaluare, diagnostic și tratament ai tulburărilor psihice și emoționale', 'Sănătate', 'https://euresp.gov.ro/locuri-de-munca/psiholog-clinic', '2026-10-13 00:00:00+00'),
('44444444-4444-4444-4444-444444444444', 'Manager de proiecte', 'Planifică, organizeze și resurse pentru a atinge obiectivele de proiect în timp și buget', 'Afaceri', 'https://euresp.gov.ro/locuri-de-munca/manager-de-proiecte', '2026-10-13 00:00:00+00'),
('55555555-5555-5555-5555-555555555555', 'Consultanță în resurse umane', 'Consultanță privind recrutarea, selecția, angajarea și dezvoltarea personalului', 'Afaceri', 'https://euresp.gov.ro/locuri-de-munca/consultant-resurse-umane', '2026-10-13 00:00:00+00')
ON CONFLICT (id) DO NOTHING;